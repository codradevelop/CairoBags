using System.Linq;
using CairoBags.Data;
using CairoBags.Helpers;
using CairoBags.Models.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using CairoBags.Dto.Account;
using Microsoft.EntityFrameworkCore;
using CairoBags.Service;
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace CairoBags.Controllers
{
   [Route("api/[controller]")]
   [ApiController]
   public class AccountController : ControllerBase
   {
       private readonly UserManager<ApplicationUser> _userManager;
       private readonly TokenService _Token;
       private readonly SignInManager<ApplicationUser> _signInManager;
       private readonly IConfiguration _configuration;
       private readonly GoogleSignInService _googleSignIn;
       private readonly PasswordResetService _passwordReset;
       private readonly IEmailService _emailService;
       private readonly ILogger<AccountController> _logger;
       private readonly CairoBagsContext _db;
       private readonly IStatisticsRealtimeService _statisticsRealtime;

       public AccountController(
           UserManager<ApplicationUser> userManager,
           TokenService Token,
           SignInManager<ApplicationUser> signInManager,
           IConfiguration configuration,
           GoogleSignInService googleSignIn,
           PasswordResetService passwordReset,
           IEmailService emailService,
           ILogger<AccountController> logger,
           CairoBagsContext db,
           IStatisticsRealtimeService statisticsRealtime)
       {
           _userManager = userManager;
           _Token = Token;
           _signInManager = signInManager;
           _configuration = configuration;
           _googleSignIn = googleSignIn;
           _passwordReset = passwordReset;
           _emailService = emailService;
           _logger = logger;
           _db = db;
           _statisticsRealtime = statisticsRealtime;
       }

       private static string GetDisplayName(ApplicationUser user) =>
           user.CustomerProfile?.DisplayName ?? user.UserName ?? string.Empty;

       private static string? GetProfileImageUrl(ApplicationUser user) =>
           user.CustomerProfile?.ProfileImageUrl;

       private async Task EnsureCustomerProfileAsync(
           ApplicationUser user,
           string? displayName = null,
           string? profileImageUrl = null)
       {
           var profile = await _db.CustomerProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
           if (profile == null)
           {
               profile = new CustomerProfile
               {
                   UserId = user.Id,
                   DisplayName = displayName?.Trim() ?? user.UserName,
                   ProfileImageUrl = string.IsNullOrWhiteSpace(profileImageUrl) ? null : profileImageUrl.Trim(),
                   CreatedAt = DateTime.UtcNow
               };
               _db.CustomerProfiles.Add(profile);
           }
           else
           {
               if (!string.IsNullOrWhiteSpace(displayName) && string.IsNullOrWhiteSpace(profile.DisplayName))
                   profile.DisplayName = displayName.Trim();
               if (!string.IsNullOrWhiteSpace(profileImageUrl) && string.IsNullOrWhiteSpace(profile.ProfileImageUrl))
                   profile.ProfileImageUrl = profileImageUrl.Trim();
               profile.UpdatedAt = DateTime.UtcNow;
           }

           await _db.SaveChangesAsync();
           user.CustomerProfile = profile;
       }

       private async Task SyncGoogleProfileAsync(ApplicationUser user, string? googleName, string? googlePicture)
       {
           var shouldSyncProfileImage = string.IsNullOrWhiteSpace(GetProfileImageUrl(user)) && !string.IsNullOrWhiteSpace(googlePicture);
           var shouldSyncName = string.IsNullOrWhiteSpace(GetDisplayName(user)) && !string.IsNullOrWhiteSpace(googleName);
           if (!shouldSyncProfileImage && !shouldSyncName) return;

           await EnsureCustomerProfileAsync(
               user,
               shouldSyncName ? googleName : null,
               shouldSyncProfileImage ? googlePicture : null);
       }

       private async Task TrySendCustomerWelcomeEmailAsync(ApplicationUser customer)
       {
           if (customer == null || string.IsNullOrWhiteSpace(customer.Email)) return;
           var to = customer.Email.Trim();
           if (string.IsNullOrWhiteSpace(_configuration["Email:SmtpHost"]) ||
               string.IsNullOrWhiteSpace(_configuration["Email:FromAddress"]))
           {
               _logger.LogWarning(
                   "Customer welcome email was not sent to {Email}: set Email:SmtpHost and Email:FromAddress (and credentials) in appsettings or User Secrets.",
                   to);
               return;
           }

           try
           {
               var baseUrl = (_configuration["App:FrontendBaseUrl"] ?? "").Trim().TrimEnd('/');
               var shopUrl = string.IsNullOrEmpty(baseUrl)
                   ? "http://localhost:3000"
                   : baseUrl;
               var (subject, html) = CairoBagsEmailTemplates.BuildCustomerWelcomeEmail(
                   customer.UserName ?? string.Empty,
                   to,
                   customer.PhoneNumber ?? string.Empty,
                   shopUrl);
               await _emailService.SendAsync(to, subject, html);
               _logger.LogInformation("Customer welcome email sent to {Email}", to);
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Customer welcome email could not be sent to {Email}", to);
           }
       }

       private IActionResult BadRequestDuplicateCustomerAccount() =>
           BadRequest(new
           {
               code = "DuplicateAccount",
               message =
                   "This email or username is already in use. Sign in if you already have an account, or use different details.",
               messageAr =
                   "هذا الحساب مستخدم مسبقًا (البريد أو الاسم). سجّل الدخول إن كان لديك حساب، أو استخدم بريدًا واسمًا آخر.",
           });

       private async Task<IActionResult?> ValidateCustomerCredentialsUniqueAsync(string? email, string? userName)
       {
           if (!string.IsNullOrWhiteSpace(email))
           {
               var trimmed = email.Trim();
               var normalizedEmail = _userManager.NormalizeEmail(trimmed);
               var emailLower = trimmed.ToLower();
               var emailTaken = await _userManager.Users.AnyAsync(u =>
                   (!string.IsNullOrEmpty(normalizedEmail) && u.NormalizedEmail == normalizedEmail)
                   || (u.Email != null && u.Email.ToLower() == emailLower));
               if (emailTaken) return BadRequestDuplicateCustomerAccount();
           }

           if (!string.IsNullOrWhiteSpace(userName))
           {
               var trimmed = userName.Trim();
               var normalizedUserName = _userManager.NormalizeName(trimmed);
               var nameLower = trimmed.ToLower();
               var nameTaken = await _userManager.Users.AnyAsync(u =>
                   (!string.IsNullOrEmpty(normalizedUserName) && u.NormalizedUserName == normalizedUserName)
                   || (u.UserName != null && u.UserName.ToLower() == nameLower));
               if (nameTaken) return BadRequestDuplicateCustomerAccount();
           }

           return null;
       }

       private static string GenerateRandomPassword()
       {
           Span<byte> bytes = stackalloc byte[10];
           Random.Shared.NextBytes(bytes);
           var hex = Convert.ToHexString(bytes);
           return $"Aa1!{hex}!Zx";
       }

       private static string DeriveUserNameFromGoogle(string email, string? displayName)
       {
           var local = email.Split('@')[0];
           if (string.IsNullOrWhiteSpace(displayName)) return local;
           var allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+ ";
           var cleaned = new string(displayName.Trim().Where(c => allowed.Contains(c)).ToArray());
           cleaned = cleaned.Replace(' ', '_');
           if (string.IsNullOrEmpty(cleaned)) return local;
           return cleaned.Length > 50 ? cleaned[..50] : cleaned;
       }

       private static readonly Regex UsernameRegex = new(@"^[a-zA-Z0-9_]{3,20}$", RegexOptions.Compiled);

       [AllowAnonymous]
       [HttpPost("create-admin")]
       public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
       {
           if (!ModelState.IsValid) return BadRequest(ModelState);

            var email = dto.Email?.Trim();
            var FullName = dto.FullName?.Trim();

            var password = dto.Password?.Trim();
           if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
               return BadRequest(new { message = "Email and password are required." });

           var adminExists = await _userManager.GetUsersInRoleAsync("Admin");
           var hasAnyAdmin = adminExists.Any();
           var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
           var disableAuthorization = TestingAuthorization.IsAuthorizationDisabled(_configuration);

           if (!disableAuthorization && hasAnyAdmin && !isAuthenticated)
               return Unauthorized(new { message = "Authentication is required." });

           if (!disableAuthorization && hasAnyAdmin && !User!.IsInRole("Admin"))
               return Forbid();

           var existingUser = await _userManager.FindByEmailAsync(email);
           if (existingUser != null)
               return BadRequest(new { message = "User already exists with this email." });

           var user = new ApplicationUser
           {
               Email = email,
               UserName = FullName,
               EmailConfirmed = true
           };

           var createResult = await _userManager.CreateAsync(user, password);
           if (!createResult.Succeeded)
               return BadRequest(createResult.Errors.Select(e => e.Description).ToList());

           var addRoleResult = await _userManager.AddToRoleAsync(user, "Admin");
           if (!addRoleResult.Succeeded)
           {
               await _userManager.DeleteAsync(user);
               return BadRequest(addRoleResult.Errors.Select(e => e.Description).ToList());
           }

           return Ok(new
           {
               message = "Admin user created successfully.",
               email = user.Email
           });
       }

       /// <summary>
       /// مسار بدون كلمة "google" في الـ URL لتفادي حظر بعض إضافات المتصفح لطلبات تحتوي /google
       /// </summary>
       [AllowAnonymous]
       [HttpPost("sign-in-google")]
       public Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto? dto)
       {
           return Task.FromResult<IActionResult>(
               StatusCode(StatusCodes.Status403Forbidden, new { message = "Google sign-in is disabled." }));
       }

       private async Task<string> PersistRefreshTokenAsync(ApplicationUser user)
       {
           var refresh = TokenService.CreateRefreshTokenValue();
           var refreshDays = _configuration.GetValue("JWT:RefreshTokenDays", 30);
           if (refreshDays < 1) refreshDays = 1;
           user.RefreshToken = CairoBags.Helpers.RefreshTokenHasher.Hash(refresh);
           user.RefreshTokenExpiresUtc = DateTime.UtcNow.AddDays(refreshDays);
           var r = await _userManager.UpdateAsync(user);
           if (!r.Succeeded)
           {
               var msg = string.Join("; ", r.Errors.Select(e => $"{e.Code}:{e.Description}"));
               _logger.LogError("Failed to persist refresh token. UserId={UserId} Email={Email} Errors={Errors} TraceId={TraceId}",
                   user.Id, user.Email, msg, HttpContext.TraceIdentifier);
               throw new InvalidOperationException(msg);
           }
           return refresh;
       }

       /// <summary>
       /// Controllers use Newtonsoft.Json for input/output; <c>UpdateMyProfileDto.NotificationSettings</c> binds as <see cref="JObject"/>.
       /// Saving with <c>System.Text.Json</c> on that graph produced broken JSON, so always use Newtonsoft here.
       /// </summary>
       private static object? ParseNotificationSettingsPayload(string json)
       {
           if (string.IsNullOrWhiteSpace(json)) return null;
           try
           {
               return JObject.Parse(json);
           }
           catch
           {
               return null;
           }
       }

       [AllowAnonymous]
       [HttpPost("register")]
       public async Task<IActionResult> Register([FromBody] RegisterDto registermodel)
       {
           try
           {
               if (!ModelState.IsValid) return BadRequest(ModelState);

               var duplicateCheck = await ValidateCustomerCredentialsUniqueAsync(registermodel.Email, registermodel.UserName);
               if (duplicateCheck != null) return duplicateCheck;

               var customer = new ApplicationUser
               {
                   UserName = registermodel.UserName,
                   Email = registermodel.Email,
                   PhoneNumber = registermodel.PhoneNumber,
                   AuthProvider = "Local",
                   HasPassword = true,
                   IsFirstLogin = false,
                   IsGoogleUser = false,
               };
               var createResult = await _userManager.CreateAsync(customer, registermodel.Password);
               if (createResult.Succeeded)
               {
                   var roleResult = await _userManager.AddToRoleAsync(customer, "Customer");
                   if (roleResult.Succeeded)
                   {
                       var persisted = await _userManager.Users.Include(u => u.CustomerProfile).FirstOrDefaultAsync(u => u.Id == customer.Id);
                       if (persisted != null) customer = persisted;
                       await EnsureCustomerProfileAsync(customer, registermodel.UserName);
                       await TrySendCustomerWelcomeEmailAsync(customer);
                       var refresh = await PersistRefreshTokenAsync(customer);
                       await _statisticsRealtime.NotifyStatisticsUpdatedAsync();
                       return Ok(
                       new NewUserDto
                       {
                           Email = customer.Email,
                           UserName = customer.UserName,
                           Name = GetDisplayName(customer),
                           Token = await _Token.CreateToken(customer),
                           RefreshToken = refresh,
                           Id = customer.Id,
                           Role = ["Customer"],
                           MustChangePassword = false,
                           AuthProvider = "Local",
                           HasPassword = true,
                           IsFirstLogin = false,
                           IsGoogleUser = false
                       });
                   }
                   else
                       return BadRequest(roleResult.Errors.Select(e => e.Description).ToList());
               }
               else
               {
                   if (createResult.Errors.Any(e =>
                           e.Code == "DuplicateUserName" || e.Code == "DuplicateEmail"))
                       return BadRequestDuplicateCustomerAccount();
                   return BadRequest(createResult.Errors.Select(e => e.Description).ToList());
               }


           }
           catch (Exception)
           {
               return StatusCode(500, "Something went wrong");
           }

       }


       [AllowAnonymous]
       [HttpPost("LogIn")]
       [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
       public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
       {

           if (!ModelState.IsValid) return BadRequest(ModelState);
           if (string.IsNullOrWhiteSpace(loginDto?.Email))
               return BadRequest("Email is required");

           var customer = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == loginDto.Email.ToLower());
           if (customer == null) return Unauthorized("User not found");
           var result = await _signInManager.CheckPasswordSignInAsync(customer, loginDto.Password, false);
           if (!result.Succeeded) return Unauthorized("Email and/or Password incorrect ");
           var refreshLogin = await PersistRefreshTokenAsync(customer);
               return Ok(
               new NewUserDto
               {
                   UserName = customer.UserName,
                   Name = GetDisplayName(customer),
                   Email = customer.Email,
                   Id=customer.Id,
                   PhoneNumber = customer.PhoneNumber,
                   ProfileImageUrl = GetProfileImageUrl(customer),
                   Token = await _Token.CreateToken(customer),
                   RefreshToken = refreshLogin,
                   Role = await _userManager.GetRolesAsync(customer),
                   MustChangePassword = customer.MustChangePassword,
                   AuthProvider = string.IsNullOrWhiteSpace(customer.AuthProvider) ? "Local" : customer.AuthProvider,
                   HasPassword = true,
                   IsFirstLogin = false,
                   IsGoogleUser = customer.IsGoogleUser || string.Equals(customer.AuthProvider, "Google", StringComparison.OrdinalIgnoreCase)
               }
               );
       }

       [AllowAnonymous]
       [HttpPost("refresh-token")]
       [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
       public async Task<IActionResult> RefreshAccessToken([FromBody] RefreshTokenRequestDto? body)
       {
           var submitted =
               (body?.RefreshToken)
               ?? Request.Cookies["refresh_token"];

           if (string.IsNullOrWhiteSpace(submitted))
               return Unauthorized(new { message = "Invalid refresh token" });

           var submittedHash = CairoBags.Helpers.RefreshTokenHasher.Hash(submitted);
           var user = await _userManager.Users.FirstOrDefaultAsync(u =>
               u.RefreshToken == submittedHash || u.RefreshToken == submitted);
           if (user == null || user.RefreshTokenExpiresUtc == null || user.RefreshTokenExpiresUtc < DateTime.UtcNow)
               return Unauthorized(new { message = "Invalid refresh token" });

           var newRefresh = TokenService.CreateRefreshTokenValue();
           var refreshDays = _configuration.GetValue("JWT:RefreshTokenDays", 30);
           user.RefreshToken = CairoBags.Helpers.RefreshTokenHasher.Hash(newRefresh);
           user.RefreshTokenExpiresUtc = DateTime.UtcNow.AddDays(refreshDays);
           var upd = await _userManager.UpdateAsync(user);
           if (!upd.Succeeded)
               return StatusCode(500, new { message = "Could not rotate refresh token" });

           var access = await _Token.CreateToken(user);

           // Optional: cookie for same-site / future use (SPA often uses body + storage).
           Response.Cookies.Append("refresh_token", newRefresh, new CookieOptions
           {
               HttpOnly = true,
               Secure = Request.IsHttps,
               SameSite = SameSiteMode.Lax,
               Path = "/",
               Expires = DateTimeOffset.UtcNow.AddDays(30),
           });

           return Ok(new { token = access, refreshToken = newRefresh, mustChangePassword = user.MustChangePassword });
       }

       [Authorize]
       [HttpGet("Me")]
       public async Task<IActionResult> Me()
       {
           var user = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(u => u.Id == _userManager.GetUserId(User));
           if (user == null) return Unauthorized();
           var roles = await _userManager.GetRolesAsync(user);
           object? notifSettings = null;
           if (!string.IsNullOrWhiteSpace(user.NotificationSettingsJson))
           {
               try
               {
                   notifSettings = ParseNotificationSettingsPayload(user.NotificationSettingsJson);
               }
               catch
               {
                   notifSettings = null;
               }
           }
           return Ok(new NewUserDto
           {
               Id = user.Id,
               UserName = user.UserName,
               Name = GetDisplayName(user),
               Email = user.Email,
               PhoneNumber = user.PhoneNumber,
               ProfileImageUrl = GetProfileImageUrl(user),
               Role = roles,
               Token = string.Empty,
               NotificationSettings = notifSettings,
               MustChangePassword = user.MustChangePassword,
               AuthProvider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "Local" : user.AuthProvider,
               HasPassword = user.HasPassword || !string.IsNullOrWhiteSpace(user.PasswordHash),
               IsFirstLogin = user.IsFirstLogin,
               IsGoogleUser = user.IsGoogleUser || string.Equals(user.AuthProvider, "Google", StringComparison.OrdinalIgnoreCase)
           });
       }

       [Authorize]
       [HttpPut("Me")]
       public async Task<IActionResult> UpdateMe([FromBody] UpdateMyProfileDto dto)
       {
           if (!ModelState.IsValid) return BadRequest(ModelState);
           var user = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(u => u.Id == _userManager.GetUserId(User));
           if (user == null) return Unauthorized();

           if (!string.IsNullOrWhiteSpace(dto.UserName) && dto.UserName != user.UserName)
           {
               var r = await _userManager.SetUserNameAsync(user, dto.UserName.Trim());
               if (!r.Succeeded) return BadRequest(r.Errors.Select(e => e.Description).ToList());
           }
           if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
           {
               var r = await _userManager.SetEmailAsync(user, dto.Email.Trim());
               if (!r.Succeeded) return BadRequest(r.Errors.Select(e => e.Description).ToList());
           }
           if (dto.PhoneNumber != null && dto.PhoneNumber != user.PhoneNumber)
           {
               var r = await _userManager.SetPhoneNumberAsync(user, dto.PhoneNumber.Trim());
               if (!r.Succeeded) return BadRequest(r.Errors.Select(e => e.Description).ToList());
           }

           // Only touch profile image when client sends the field (avoids wiping on partial / notification-only updates)
           if (dto.ProfileImageUrl != null)
           {
               await EnsureCustomerProfileAsync(
                   user,
                   profileImageUrl: string.IsNullOrWhiteSpace(dto.ProfileImageUrl) ? null : dto.ProfileImageUrl.Trim());
           }

           if (dto.NotificationSettings != null)
           {
               try
               {
                   user.NotificationSettingsJson = JsonConvert.SerializeObject(dto.NotificationSettings);
               }
               catch
               {
                   // ignore serialization errors, do not block profile update
               }
           }

           var updateRes = await _userManager.UpdateAsync(user);
           if (!updateRes.Succeeded) return BadRequest(updateRes.Errors.Select(e => e.Description).ToList());

           var roles = await _userManager.GetRolesAsync(user);
           object? notifSettings = null;
           if (!string.IsNullOrWhiteSpace(user.NotificationSettingsJson))
           {
               try
               {
                   notifSettings = ParseNotificationSettingsPayload(user.NotificationSettingsJson);
               }
               catch
               {
                   notifSettings = null;
               }
           }
           return Ok(new NewUserDto
           {
               Id = user.Id,
               UserName = user.UserName,
               Name = GetDisplayName(user),
               Email = user.Email,
               PhoneNumber = user.PhoneNumber,
               ProfileImageUrl = GetProfileImageUrl(user),
               Role = roles,
               Token = string.Empty,
               NotificationSettings = notifSettings,
               MustChangePassword = user.MustChangePassword,
               AuthProvider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "Local" : user.AuthProvider,
               HasPassword = user.HasPassword || !string.IsNullOrWhiteSpace(user.PasswordHash),
               IsFirstLogin = user.IsFirstLogin,
               IsGoogleUser = user.IsGoogleUser || string.Equals(user.AuthProvider, "Google", StringComparison.OrdinalIgnoreCase)
           });
       }

       [Authorize]
       [HttpPut("update-username")]
       public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameDto? dto)
       {
           if (dto == null || !ModelState.IsValid)
               return BadRequest(new { message = "Username is required." });

           var requested = (dto.Username ?? string.Empty).Trim();
           if (!UsernameRegex.IsMatch(requested))
           {
               return BadRequest(new
               {
                   message = "Username must be 3–20 characters and contain only letters, numbers, or underscores",
               });
           }

           var user = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(u => u.Id == _userManager.GetUserId(User));
           if (user == null) return Unauthorized();

           // Uniqueness check (case-insensitive using Identity normalization)
           var normalized = _userManager.NormalizeName(requested);
           if (!string.IsNullOrEmpty(normalized))
           {
               var exists = await _userManager.Users.AnyAsync(u =>
                   u.NormalizedUserName == normalized && u.Id != user.Id);
               if (exists)
                   return BadRequest(new { message = "Username already taken" });
           }

           if (string.Equals(user.UserName, requested, StringComparison.Ordinal))
               return Ok(new { message = "Username updated successfully", userName = user.UserName });

           try
           {
               var res = await _userManager.SetUserNameAsync(user, requested);
               if (!res.Succeeded)
               {
                   var msg = res.Errors.FirstOrDefault()?.Description ?? "Could not update username.";
                   // Surface duplicate nicely
                   if (res.Errors.Any(e => string.Equals(e.Code, "DuplicateUserName", StringComparison.OrdinalIgnoreCase)))
                       return BadRequest(new { message = "Username already taken" });
                   return BadRequest(new { message = msg });
               }

               // Keep display name in sync if user never set a separate Name (avoid overwriting Google name)
               if (string.IsNullOrWhiteSpace(GetDisplayName(user)) || GetDisplayName(user) == user.UserName)
               {
                   await EnsureCustomerProfileAsync(user, requested);
               }

               return Ok(new { message = "Username updated successfully", userName = user.UserName });
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "UpdateUsername failed. UserId={UserId} TraceId={TraceId}", user.Id, HttpContext.TraceIdentifier);
               return StatusCode(500, new { message = "Could not update username." });
           }
       }

       /// <summary>
       /// Any authenticated user may change password (current password verified by Identity).
       /// Also clears <see cref="ApplicationUser.MustChangePassword"/> when it was set (e.g. temp password flow).
       /// </summary>
       private static object SamePasswordChangePayload() => new
       {
           message = "The new password must be different from your current password.",
           messageAr = "أنت مستخدمها قبل كدا — اختر كلمة مرور مختلفة.",
       };

       private static bool IsSamePasswordIdentityError(IdentityError e)
       {
           if (e == null) return false;
           var desc = e.Description ?? string.Empty;
           var code = e.Code ?? string.Empty;
           return desc.Contains("not required", StringComparison.OrdinalIgnoreCase)
               || code.Contains("PasswordChangeNotRequired", StringComparison.OrdinalIgnoreCase);
       }

       /// <summary>Step 1: send 6-digit code to email (if account exists). Response is always generic.</summary>
       [AllowAnonymous]
       [HttpPost("forgot-password/request-code")]
       public async Task<IActionResult> ForgotPasswordRequestCode([FromBody] ForgotPasswordRequestCodeDto? dto)
       {
           if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
               return BadRequest(new { message = "Email is required.", messageAr = "البريد الإلكتروني مطلوب." });
           if (!ModelState.IsValid) return BadRequest(ModelState);
           await _passwordReset.RequestCodeAsync(dto.Email, HttpContext.RequestAborted);
           return Ok(new
           {
               message = "If an account exists for this email, we sent a reset code.",
               messageAr = "إن وُجد حساب بهذا البريد، فتم إرسال رمز التحقق إليه.",
           });
       }

       /// <summary>Step 2: verify code and set new password.</summary>
       [AllowAnonymous]
       [HttpPost("forgot-password/complete")]
       public async Task<IActionResult> ForgotPasswordComplete([FromBody] ForgotPasswordCompleteDto? dto)
       {
           if (dto == null || !ModelState.IsValid) return BadRequest(ModelState);
           var r = await _passwordReset.TryCompleteAsync(dto.Email, dto.Code, dto.NewPassword, HttpContext.RequestAborted);
           if (!r.Ok)
               return BadRequest(new { message = r.Message, messageAr = r.MessageAr });
           return Ok(new
           {
               message = "Your password was updated. You can sign in.",
               messageAr = "تم تحديث كلمة المرور. يمكنك تسجيل الدخول.",
           });
       }

       [Authorize]
       [HttpPost("change-password")]
       public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto? dto)
       {
           if (dto == null || !ModelState.IsValid) return BadRequest(ModelState);
           var user = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(u => u.Id == _userManager.GetUserId(User));
           if (user == null) return Unauthorized();

           var currentPwd = dto.CurrentPassword ?? string.Empty;
           var newPwd = dto.NewPassword ?? string.Empty;

           if (!await _userManager.CheckPasswordAsync(user, currentPwd))
           {
               return BadRequest(new
               {
                   message = "Current password is incorrect.",
                   messageAr = "كلمة المرور الحالية غير صحيحة.",
               });
           }

           if (string.Equals(currentPwd, newPwd, StringComparison.Ordinal))
               return BadRequest(SamePasswordChangePayload());

           // New password already verifies against the stored hash (same as current), e.g. before Identity returns "Password change not required."
           if (await _userManager.CheckPasswordAsync(user, newPwd))
               return BadRequest(SamePasswordChangePayload());

           var result = await _userManager.ChangePasswordAsync(user, currentPwd, newPwd);
           if (!result.Succeeded)
           {
               if (result.Errors.Any(IsSamePasswordIdentityError))
                   return BadRequest(SamePasswordChangePayload());
               return BadRequest(result.Errors.Select(e => e.Description));
           }

           if (user.MustChangePassword)
           {
               user.MustChangePassword = false;
               var upd = await _userManager.UpdateAsync(user);
               if (!upd.Succeeded)
                   return StatusCode(500, upd.Errors.Select(e => e.Description));
           }

           user = await _userManager.Users.Include(u => u.CustomerProfile).FirstOrDefaultAsync(u => u.Id == user.Id) ?? user;
           var refresh = await PersistRefreshTokenAsync(user);
           var roles = await _userManager.GetRolesAsync(user);
           return Ok(new NewUserDto
           {
               Id = user.Id,
               UserName = user.UserName,
               Name = GetDisplayName(user),
               Email = user.Email,
               PhoneNumber = user.PhoneNumber,
               ProfileImageUrl = GetProfileImageUrl(user),
               Token = await _Token.CreateToken(user),
               RefreshToken = refresh,
               Role = roles,
               MustChangePassword = false,
               AuthProvider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "Local" : user.AuthProvider,
               HasPassword = true,
               IsFirstLogin = false,
               IsGoogleUser = user.IsGoogleUser || string.Equals(user.AuthProvider, "Google", StringComparison.OrdinalIgnoreCase)
           });
       }

       /// <summary>
       /// Set an initial password for Google users (only when they don't have one yet).
       /// </summary>
       [Authorize]
       [HttpPost("set-password")]
       public async Task<IActionResult> SetPassword([FromBody] SetPasswordDto? dto)
       {
           if (dto == null || !ModelState.IsValid)
               return BadRequest(new { message = "NewPassword is required." });

           var user = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(u => u.Id == _userManager.GetUserId(User));
           if (user == null) return Unauthorized();

           var provider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "Local" : user.AuthProvider;
           if (!(user.IsGoogleUser || string.Equals(provider, "Google", StringComparison.OrdinalIgnoreCase)))
               return BadRequest(new { message = "Set password is only available for Google accounts." });

           // Identity is the source of truth.
           if (await _userManager.HasPasswordAsync(user))
           {
               if (!user.HasPassword)
               {
                   user.HasPassword = true;
                   await _userManager.UpdateAsync(user);
               }
               return Ok(new
               {
                   message = "Password is already set.",
                   hasPassword = true,
                   isFirstLogin = false,
                   isGoogleUser = true,
                   authProvider = "Google",
               });
           }

           if (user.HasPassword)
               return Ok(new
               {
                   message = "Password is already set.",
                   hasPassword = true,
                   isFirstLogin = false,
                   isGoogleUser = true,
                   authProvider = "Google",
               });

           try
           {
               var r = await _userManager.AddPasswordAsync(user, dto.NewPassword);
               if (!r.Succeeded)
                   return BadRequest(r.Errors.Select(e => e.Description).ToList());

               user.HasPassword = true;
               user.MustChangePassword = false;
               user.IsFirstLogin = false;
               user.IsGoogleUser = true;
               var upd = await _userManager.UpdateAsync(user);
               if (!upd.Succeeded)
                   return StatusCode(500, new { message = "Password was set but user state could not be updated." });

               return Ok(new
               {
                   message = "Password set successfully.",
                   hasPassword = true,
                   isFirstLogin = false,
                   authProvider = "Google",
                   isGoogleUser = true,
               });
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "SetPassword failed. UserId={UserId} TraceId={TraceId}", user.Id, HttpContext.TraceIdentifier);
               return BadRequest(new { message = "Google set password failed", error = ex.Message });
           }
       }

       [Authorize]
       [HttpPost("mark-first-login-done")]
       public async Task<IActionResult> MarkFirstLoginDone()
       {
           var user = await _userManager.Users
               .Include(u => u.CustomerProfile)
               .FirstOrDefaultAsync(u => u.Id == _userManager.GetUserId(User));
           if (user == null) return Unauthorized();

           if (user.IsFirstLogin)
           {
               user.IsFirstLogin = false;
               var upd = await _userManager.UpdateAsync(user);
               if (!upd.Succeeded)
                   return StatusCode(500, new { message = "Could not update first login status." });
           }

           return Ok(new { message = "First login marked done.", isFirstLogin = false });
       }

       
       [HttpPost("LogOut")]
       public async Task<IActionResult> LogOut()
       {
           await _signInManager.SignOutAsync();
           var user= await _userManager.GetUserAsync(User);
           if (user == null) return BadRequest("not found");
           user.RefreshToken = null;
           user.RefreshTokenExpiresUtc = null;
           await _userManager.UpdateAsync(user);
           await _userManager.UpdateSecurityStampAsync(user);
           Response.Cookies.Delete("refresh_token", new CookieOptions
           {
               Path = "/",
               HttpOnly = true,
               Secure = Request.IsHttps,
               SameSite = SameSiteMode.Lax,
           });
           return Ok("Logged out successfully");

       }
   }
}

