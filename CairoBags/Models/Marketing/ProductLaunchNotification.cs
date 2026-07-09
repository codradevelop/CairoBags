namespace CairoBags.Models.Marketing;

public class ProductLaunchNotification
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public DateTime SentAt { get; set; }

    public int RecipientCount { get; set; }

    public DateTime CreatedAt { get; set; }
}
