using CairoBags.Dto.Catalog;

namespace CairoBags.Service;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryDto>> GetAllCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryTreeNodeDto>> GetActiveCategoryTreeAsync(CancellationToken cancellationToken = default);

    Task<CategoryDto?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);

    Task<CategoryDto?> GetBySlugAsync(string slug, bool includeInactive, CancellationToken cancellationToken = default);

    Task<ServiceResult<CategoryDto>> CreateAsync(CreateCategoryRequest request, string? userId, CancellationToken cancellationToken = default);

    Task<ServiceResult<CategoryDto>> UpdateAsync(int id, UpdateCategoryRequest request, string? userId, CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(int id, string? userId, CancellationToken cancellationToken = default);
}

public sealed class ServiceResult<T>
{
    public bool Succeeded { get; init; }

    public T? Data { get; init; }

    public string? ErrorCode { get; init; }

    public string? Message { get; init; }

    public int? StatusCode { get; init; }

    public static ServiceResult<T> Ok(T data) => new() { Succeeded = true, Data = data };

    public static ServiceResult<T> Fail(string errorCode, string message, int statusCode = 400) =>
        new() { Succeeded = false, ErrorCode = errorCode, Message = message, StatusCode = statusCode };
}
