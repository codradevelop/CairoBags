namespace CairoBags.Service;

public interface IEmailQueue
{
    void Enqueue(int jobId);
}
