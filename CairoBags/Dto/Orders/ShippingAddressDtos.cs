using System.ComponentModel.DataAnnotations;

namespace CairoBags.Dto.Orders;

public class ShippingAddressDto
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Governorate { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string AddressLine1 { get; set; } = string.Empty;

    public string? AddressLine2 { get; set; }

    public string? PostalCode { get; set; }

    public bool IsDefault { get; set; }
}

public class CreateShippingAddressRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Governorate { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string AddressLine1 { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? AddressLine2 { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    public bool IsDefault { get; set; }
}

public class UpdateShippingAddressRequest : CreateShippingAddressRequest
{
}
