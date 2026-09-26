using System;
using System.Text.Json;

namespace Server_RoboCode.Services
{
    public class LoggerService : ILoggerService
    {
        private readonly string _logFilePath;
        private readonly object _lockObject = new object();

        public LoggerService(string logFilePath = "logs/api.log")
        {
            _logFilePath = logFilePath;
            Directory.CreateDirectory(Path.GetDirectoryName(_logFilePath) ?? "logs");
        }

        public void LogInfo(string message, object data = null)
        {
            WriteLog("INFO", message, data);
        }

        public void LogError(string message, Exception exception = null)
        {
            var logData = new { message, exception?.Message, exception?.StackTrace };
            WriteLog("ERROR", message, logData);
        }

        public void LogWarning(string message)
        {
            WriteLog("WARNING", message, null);
        }

        public void LogRequest(string endpoint, string method, object requestData = null)
        {
            var logData = new
            {
                endpoint,
                method,
                timestamp = DateTime.UtcNow,
                requestData
            };
            WriteLog("REQUEST", $"Запрос: {method} {endpoint}", logData);
        }

        public void LogResponse(string endpoint, int statusCode, object responseData = null)
        {
            var logData = new
            {
                endpoint,
                statusCode,
                timestamp = DateTime.UtcNow,
                responseData
            };
            WriteLog("RESPONSE", $"Ответ: {endpoint} [{statusCode}]", logData);
        }

        private void WriteLog(string level, string message, object data = null)
        {
            lock (_lockObject)
            {
                var logEntry = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss.fff}] [{level}] {message}";

                if (data != null)
                {
                    try
                    {
                        var jsonData = JsonSerializer.Serialize(data, new JsonSerializerOptions
                        {
                            WriteIndented = false,
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                        });
                        logEntry += $"\n{jsonData}";
                    }
                    catch
                    {
                        logEntry += $"\n[Ошибка сериализации данных]";
                    }
                }

                File.AppendAllText(_logFilePath, logEntry + Environment.NewLine);
            }
        }
    }
}