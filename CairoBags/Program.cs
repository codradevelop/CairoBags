using System.Text.Json;
using System.Threading.RateLimiting;
using CairoBags.Data;
using CairoBags.Helpers;
using CairoBags.Hubs;
using CairoBags.Models.Identity;
using CairoBags.Middleware;
using CairoBags.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.FileProviders;
using System.Text;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// حد حجم الطلب (50 ميجا) لتفادي توقف الباك عند رفع الصور
builder.WebHost.ConfigureKestrel(opt =>
{
    opt.Limits.MaxRequestBodySize = 50 * 1024 * 1024;
});
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(opt =>
{
    opt.MultipartBodyLengthLimit = 50 * 1024 * 1024;
});

// CORS — origins from config (comma-separated); dev localhost defaults preserved
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"];
var originList = string.IsNullOrWhiteSpace(corsOrigins)
    ? new[] { "http://localhost:3000", "http://localhost:3001" }
    : corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins(originList)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.AddPolicy("newsletter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
    options.SerializerSettings.DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Utc;
    options.SerializerSettings.DateFormatHandling = Newtonsoft.Json.DateFormatHandling.IsoDateFormat;
});

builder.Services.AddMemoryCache();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<GoogleSignInService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<EmailQueue>();
builder.Services.AddSingleton<IEmailQueue>(sp => sp.GetRequiredService<EmailQueue>());
builder.Services.AddHostedService<EmailQueueBackgroundService>();
builder.Services.AddScoped<INewsletterService, NewsletterService>();
builder.Services.AddScoped<IHomeStatisticsService, HomeStatisticsService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddSingleton<ICatalogRealtimeService, CatalogRealtimeService>();
builder.Services.AddSingleton<IStatisticsRealtimeService, StatisticsRealtimeService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImageService, ProductImageService>();
builder.Services.AddScoped<IProductImageProcessingService, ProductImageProcessingService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddHttpClient<ITranslationService, TranslationService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IAdminOrderService, AdminOrderService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddHttpClient("googleJwks", c =>
{
    c.Timeout = TimeSpan.FromSeconds(25);
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Cairo Bags API",
        Version = "v1",
        Description = "Cairo Bags e-commerce backend — catalog, cart, checkout, orders, payments, and recommendations."
    });
    option.IgnoreObsoleteActions();
    option.IgnoreObsoleteProperties();
    option.CustomSchemaIds(type => type.FullName);

    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer"
                }
            },
            new string[]{}
        }
    });
});

// Database
builder.Services.AddDbContext<CairoBagsContext>(option =>
{
    option.UseSqlServer(builder.Configuration.GetConnectionString("conn"));
});

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;

    options.User.AllowedUserNameCharacters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+ ";

    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 9;
})
.AddEntityFrameworkStores<CairoBagsContext>()
.AddDefaultTokenProviders();

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
    options.DefaultChallengeScheme =
    options.DefaultForbidScheme =
    options.DefaultScheme =
    options.DefaultSignInScheme =
    options.DefaultSignOutScheme = JwtBearerDefaults.AuthenticationScheme;

})
.AddJwtBearer(options =>
{
    // Map JWT "sub" to NameIdentifier so SignalR IUserIdProvider and [Authorize] work consistently.
    options.MapInboundClaims = true;

    var signingKey = builder.Configuration["JWT:SigningKey"];
    if (string.IsNullOrWhiteSpace(signingKey))
    {
        if (!builder.Environment.IsDevelopment())
            throw new InvalidOperationException("JWT:SigningKey is required in non-Development environments.");
        Console.Error.WriteLine("WARNING: Missing JWT:SigningKey — using dev-only fallback. Set user-secrets or environment variables.");
        signingKey = "DEV_ONLY_JWT_SIGNING_KEY_CHANGE_BEFORE_PRODUCTION";
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JWT:Issuer"],

        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:Audience"],

        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(signingKey)),
    };
    // SignalR: accept JWT from query string (WebSocket doesn't send Authorization header)
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/hubs/notifications") ||
                 path.StartsWithSegments("/notificationsHub")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            // Catalog hub is public — a bad/expired token must not block the connection.
            if (context.Request.Path.StartsWithSegments("/hubs/catalog") ||
                context.Request.Path.StartsWithSegments("/hubs/statistics"))
                context.NoResult();
            return Task.CompletedTask;
        }
    };
});

var disableAuthorization = TestingAuthorization.IsAuthorizationDisabled(builder.Configuration);
if (disableAuthorization)
{
    builder.Services.AddSingleton<IAuthorizationHandler, AllowAllAuthorizationHandler>();
    Console.Error.WriteLine("WARNING: Testing:DisableAuthorization=true — all [Authorize] checks are bypassed.");
}

// SignalR: maps HubConnectionContext.UserIdentifier to JWT sub (NameIdentifier). Required for [Authorize] + user groups.
// .NET 10 registers this via DI (same behavior as HubOptions.UserIdProvider in older templates).
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddSingleton<IUserIdProvider, NameIdentifierUserIdProvider>();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<CairoBagsContext>();
    var connectionString = context.Database.GetConnectionString() ?? "(null)";
    try
    {
        var canConnect = await context.Database.CanConnectAsync();
        app.Logger.LogInformation(
            "Database connectivity: CanConnect={CanConnect}, ConnectionString={ConnectionString}",
            canConnect,
            connectionString);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(
            ex,
            "Database connectivity failed. ConnectionString={ConnectionString}",
            connectionString);
    }
}


// Migrations removed in Phase 1 — CairoBags greenfield schema will be added in a later phase.

// معالج استثناءات عام — يمنع أي استثناء من إيقاف التطبيق أو فتح فيجوال ستوديو
app.UseExceptionHandler(err =>
{
    err.Run(async ctx =>
    {
        var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;

        if (ex is OperationCanceledException)
        {
            if (!ctx.Response.HasStarted)
            {
                ctx.Response.StatusCode = StatusCodes.Status499ClientClosedRequest;
            }
            return;
        }

        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        var msg = ex?.Message ?? "An error occurred.";
        var isDev = app.Environment.IsDevelopment();
        if (isDev)
            await ctx.Response.WriteAsJsonAsync(new { message = msg, detail = ex?.ToString() });
        else
            await ctx.Response.WriteAsJsonAsync(new { message = "An error occurred while processing your request." });
    });
});

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // In development we often run the React app on HTTP (localhost:3000) and API on HTTP (localhost:5073).
    // Redirecting HTTP->HTTPS can break browser preflight requests (e.g., PUT) and appear as "Failed to fetch".
    app.UseHttpsRedirection();
}

var storageFolder = app.Configuration["FileStorage:Path"] ?? "FileStorage";
var storagePath = Path.Combine(app.Environment.ContentRootPath, storageFolder);
if (!Directory.Exists(storagePath))
{
    Directory.CreateDirectory(storagePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(storagePath),
    RequestPath = $"/{storageFolder}",
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value ?? "";
        if (path.Contains("/verification/", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.StatusCode = StatusCodes.Status404NotFound;
            ctx.Context.Response.ContentLength = 0;
        }
    }
});

app.UseRouting();

app.UseCors("ReactPolicy");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.UseClientCancellationHandling();

app.MapControllers();

app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<NotificationHub>("/notificationsHub");
app.MapHub<CatalogHub>("/hubs/catalog");
app.MapHub<StatisticsHub>("/hubs/statistics");

app.Run();
