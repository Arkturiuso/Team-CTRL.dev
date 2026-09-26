namespace Server_RoboCode.Services
{
    public interface ILoggerService
    {
        void LogInfo(string message, object data = null);
        void LogError(string message, Exception exception = null);
        void LogWarning(string message);
        void LogRequest(string endpoint, string method, object requestData = null);
        void LogResponse(string endpoint, int statusCode, object responseData = null);
    }
}
