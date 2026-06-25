using System.ComponentModel.DataAnnotations;

namespace CairoBags.Dto.Translation;

public class TranslateRequestDto
{
    [Required]
    public string Text { get; set; } = string.Empty;

    public string From { get; set; } = "ar";

    public string To { get; set; } = "en";
}

public class TranslateResponseDto
{
    public string TranslatedText { get; set; } = string.Empty;
}
