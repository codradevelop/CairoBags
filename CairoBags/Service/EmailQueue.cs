using System.Threading.Channels;

namespace CairoBags.Service;

public class EmailQueue : IEmailQueue
{
    private readonly Channel<int> _channel;

    public EmailQueue()
    {
        _channel = Channel.CreateUnbounded<int>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });
    }

    public ChannelReader<int> Reader => _channel.Reader;

    public void Enqueue(int jobId) => _channel.Writer.TryWrite(jobId);
}
