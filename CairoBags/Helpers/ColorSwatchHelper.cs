using System.Text.RegularExpressions;

namespace CairoBags.Helpers;

public static partial class ColorSwatchHelper
{
    private const string NeutralFallback = "#9ca3af";

    private static readonly (string[] Keywords, string Hex)[] ColorEntries =
    {
        (new[] { "off white", "off-white", "أبيض عاجي", "كريمي فاتح" }, "#f4f0e8"),
        (new[] { "dark brown", "dark chocolate", "بني غامق", "بني داكن" }, "#3d2914"),
        (new[] { "light brown", "بني فاتح" }, "#a67c52"),
        (new[] { "burgundy", "maroon", "wine", "عنابي", "خمري" }, "#722f37"),
        (new[] { "navy", "dark blue", "كحلي", "أزرق غامق" }, "#1e3a5f"),
        (new[] { "olive", "زيتي", "أخضر زيتوني" }, "#556b2f"),
        (new[] { "gold", "golden", "ذهبي", "ذهب" }, "#c9a962"),
        (new[] { "silver", "فضي", "فضة" }, "#c0c0c0"),
        (new[] { "rose", "blush", "وردي", "زهري" }, "#d4a5a5"),
        (new[] { "pink", "pinkish" }, "#e8b4b8"),
        (new[] { "red", "crimson", "أحمر" }, "#b91c1c"),
        (new[] { "orange", "rust", "برتقالي", "صدأ" }, "#c45c26"),
        (new[] { "yellow", "mustard", "أصفر" }, "#d4a017"),
        (new[] { "green", "emerald", "أخضر" }, "#2d6a4f"),
        (new[] { "blue", "sky", "أزرق" }, "#3b82c6"),
        (new[] { "purple", "violet", "بنفسجي", "موف" }, "#6b4c9a"),
        (new[] { "grey", "gray", "charcoal", "رمادي", "فحمي" }, "#6b7280"),
        (new[] { "black", "أسود", "noir" }, "#111111"),
        (new[] { "white", "ivory", "أبيض", "عاجي" }, "#f5f5f5"),
        (new[] { "cream", "beige", "nude", "sand", "بيج", "كريم", "رملي", "لون البشرة" }, "#e8dcc8"),
        (new[] { "tan", "camel", "caramel", "جملي", "قهوة بالحليب" }, "#c4a574"),
        (new[] { "brown", "chocolate", "cognac", "coffee", "mocha", "بني", "شوكولاتة" }, "#6b4423"),
        (new[] { "chestnut", "walnut", "كستنائي" }, "#5c4033"),
        (new[] { "taupe", "taupey" }, "#8b7d6b"),
    };

    public static string GetHexFromName(string? colorName)
    {
        var normalized = NormalizeColorName(colorName);
        if (string.IsNullOrWhiteSpace(normalized))
            return NeutralFallback;

        var sorted = ColorEntries
            .OrderByDescending(entry => entry.Keywords.Max(keyword => keyword.Length));

        foreach (var (keywords, hex) in sorted)
        {
            foreach (var keyword in keywords)
            {
                var normalizedKeyword = NormalizeColorName(keyword);
                if (normalized == normalizedKeyword || normalized.Contains(normalizedKeyword, StringComparison.Ordinal))
                    return hex;
            }
        }

        return NeutralFallback;
    }

    private static string NormalizeColorName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var normalized = value.Trim().ToLowerInvariant();
        normalized = normalized.Replace('\'', ' ').Replace('`', ' ').Replace('´', ' ');
        normalized = WhitespaceRegex().Replace(normalized, " ").Trim();
        return normalized;
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
