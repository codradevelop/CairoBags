using System.Net;
using System.Text;

namespace CairoBags.Service;

/// <summary>
/// Luxury gold + black HTML templates for newsletter and product launch emails.
/// </summary>
public static class NewsletterEmailTemplates
{
    public const string BrandName = "Cairo Bags";

    private static string H(string? s) => WebUtility.HtmlEncode(s ?? string.Empty);

    private static string Href(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return "#";
        return WebUtility.HtmlEncode(url.Trim());
    }

    private static string EmailDocument(string pageTitle, string preheader, string innerHtml, string unsubscribeUrl)
    {
        var title = H(pageTitle);
        var pre = H(preheader);
        var unsub = Href(unsubscribeUrl);
        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
<meta charset=""utf-8""/>
<meta name=""viewport"" content=""width=device-width,initial-scale=1""/>
<meta name=""x-apple-disable-message-reformatting""/>
<title>{title}</title>
<style>
@media only screen and (max-width: 600px) {{
  .cb-pad {{ padding: 20px 12px !important; }}
  .cb-card {{ padding: 24px 18px !important; border-radius: 16px !important; }}
  .cb-h1 {{ font-size: 22px !important; }}
  .cb-product-img {{ border-radius: 14px !important; }}
}}
a.cb-btn:hover {{ filter: brightness(1.1); }}
</style>
</head>
<body style=""margin:0;padding:0;background:#0c0b0a;"">
<div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">{pre}</div>
<table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background:#0c0b0a;"">
<tr><td align=""center"" class=""cb-pad"" style=""padding:36px 16px;background:linear-gradient(180deg,#0c0b0a 0%,#141311 50%,#0c0b0a 100%);"">
<table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""max-width:600px;border-collapse:separate;"">
<tr><td class=""cb-card"" style=""background:#141311;border-radius:20px;border:1px solid rgba(197,155,39,0.28);box-shadow:0 16px 56px rgba(0,0,0,0.55);padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#f6f3ed;line-height:1.65;"">
<div style=""height:3px;border-radius:3px;background:linear-gradient(90deg,#a87e14,#c59b27,#ebd494,#c59b27,#a87e14);margin:-36px -32px 28px -32px;""></div>
<div style=""text-align:center;margin:0 0 24px;"">
<p style=""margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;color:#c59b27;"">{H(BrandName)}</p>
</div>
{innerHtml}
<hr style=""border:none;border-top:1px solid rgba(197,155,39,0.18);margin:28px 0 16px;""/>
<p style=""margin:0 0 10px;font-size:11px;color:#736b5e;text-align:center;"">© {H(BrandName)}</p>
<p style=""margin:0;font-size:11px;text-align:center;""><a href=""{unsub}"" style=""color:#a39c91;text-decoration:underline;"">Unsubscribe</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>";
    }

    private static string GoldCta(string href, string buttonLabel)
    {
        var u = Href(href);
        var l = H(buttonLabel);
        return $@"<table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""margin:28px 0 8px;width:100%;"">
<tr><td align=""center"">
<a class=""cb-btn"" href=""{u}"" style=""display:inline-block;padding:15px 36px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:0.04em;text-decoration:none;color:#0c0b0a !important;background:linear-gradient(135deg,#ebd494,#c59b27,#a87e14);box-shadow:0 6px 24px rgba(197,155,39,0.35);"">{l}</a>
</td></tr></table>";
    }

    public static (string Subject, string Html) BuildWelcomeEmail(string shopUrl, string unsubscribeUrl)
    {
        const string subject = "Welcome to Cairo Bags";
        var inner = $@"
<h1 class=""cb-h1"" style=""margin:0 0 16px;font-size:26px;font-weight:700;color:#faf8f5;text-align:center;letter-spacing:-0.02em;"">Welcome to {H(BrandName)}</h1>
<p style=""margin:0 0 18px;color:#e8ded1;text-align:center;"">You're now subscribed to our newsletter.</p>
<p style=""margin:0 0 14px;color:#c9b896;text-align:center;"">You'll receive emails whenever we launch:</p>
<ul style=""margin:0 auto 24px;max-width:320px;padding-left:20px;color:#e8ded1;"">
<li style=""margin:10px 0;"">New Products</li>
<li style=""margin:10px 0;"">New Collections</li>
<li style=""margin:10px 0;"">Exclusive Offers</li>
<li style=""margin:10px 0;"">Seasonal Discounts</li>
</ul>
<p style=""margin:0 0 8px;color:#a39c91;text-align:center;font-size:14px;"">Thank you for joining our community.</p>
{GoldCta(shopUrl, "Visit Store")}";
        return (subject, EmailDocument(subject, subject, inner, unsubscribeUrl));
    }

    public static (string Subject, string Html) BuildProductLaunchEmail(
        string productName,
        string price,
        string category,
        string shortDescription,
        string? imageUrl,
        string productUrl,
        string unsubscribeUrl)
    {
        const string subject = "New Arrival at Cairo Bags";
        var img = string.IsNullOrWhiteSpace(imageUrl)
            ? ProductImagePlaceholder()
            : $@"<div style=""text-align:center;margin:0 0 24px;"">
<img class=""cb-product-img"" src=""{Href(imageUrl)}"" alt=""{H(productName)}"" width=""520"" style=""width:100%;max-width:520px;height:auto;border-radius:18px;border:1px solid rgba(197,155,39,0.25);display:block;margin:0 auto;""/>
</div>";

        var inner = $@"
<p style=""margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#c59b27;text-align:center;"">New Arrival</p>
<h1 class=""cb-h1"" style=""margin:0 0 20px;font-size:24px;font-weight:700;color:#faf8f5;text-align:center;"">{H(productName)}</h1>
{img}
<table role=""presentation"" width=""100%"" style=""background:rgba(12,11,10,0.65);border-radius:14px;border:1px solid rgba(197,155,39,0.2);margin:0 0 20px;"" cellpadding=""0"" cellspacing=""0"">
<tr><td style=""padding:18px 20px;color:#e8ded1;"">
<p style=""margin:8px 0;""><span style=""color:#c59b27;font-weight:600;"">Price:</span> {H(price)}</p>
<p style=""margin:8px 0;""><span style=""color:#c59b27;font-weight:600;"">Category:</span> {H(category)}</p>
<p style=""margin:8px 0 0;color:#a39c91;font-size:14px;line-height:1.6;"">{H(shortDescription)}</p>
</td></tr></table>
{GoldCta(productUrl, "Shop Now")}";
        return (subject, EmailDocument(subject, $"{productName} — now at {BrandName}", inner, unsubscribeUrl));
    }

    private static string ProductImagePlaceholder() =>
        $@"<div style=""text-align:center;margin:0 0 24px;"">
<div class=""cb-product-img"" style=""width:100%;max-width:520px;margin:0 auto;border-radius:18px;border:1px solid rgba(197,155,39,0.25);background:linear-gradient(180deg,#1a1814 0%,#0c0b0a 100%);padding:56px 24px;"">
<p style=""margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#c59b27;"">{H(BrandName)}</p>
</div>
</div>";
}
