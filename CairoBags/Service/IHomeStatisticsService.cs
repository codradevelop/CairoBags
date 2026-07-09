using CairoBags.Dto.Home;

namespace CairoBags.Service;

public interface IHomeStatisticsService
{
    Task<HomeStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default);
}
