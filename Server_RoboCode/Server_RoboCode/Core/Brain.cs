using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Services;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Server_RoboCode.Core
{
    /// <summary>
    /// Центральный обработчик всех запросов API
    /// Логирует, обрабатывает ошибки, замеряет время выполнения
    /// </summary>
    public class Brain
    {
        private readonly ILoggerService _logger;
        private readonly ResponseSender _sender;

        public Brain(ILoggerService logger, ResponseSender sender)
        {
            _logger = logger;
            _sender = sender;
        }

        /// <summary>
        /// Обрабатывает запрос с параметрами
        /// </summary>
        public async Task<IActionResult> ProcessAsync<T>(
            Func<T, IActionResult> action,
            T requestData,
            string endpoint,
            string httpMethod = "POST")
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Логируем входящий запрос
                _logger.LogRequest(endpoint, httpMethod, requestData);

                // Выполняем бизнес-логику
                var result = action(requestData);

                // Замеряем время
                stopwatch.Stop();
                _logger.LogInfo($"Обработка {endpoint} заняла {stopwatch.ElapsedMilliseconds} мс");

                // Отправляем ответ через ResponseSender
                return _sender.PrepareResponse(result, endpoint);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError($"Ошибка в {endpoint} ({stopwatch.ElapsedMilliseconds} мс)", ex);
                return _sender.SendError("Внутренняя ошибка сервера", ex.Message);
            }
        }

        /// <summary>
        /// Обрабатывает запрос без параметров
        /// </summary>
        public async Task<IActionResult> ProcessAsync(
            Func<IActionResult> action,
            string endpoint,
            string httpMethod = "GET",
            object requestData = null)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // Логируем входящий запрос
                _logger.LogRequest(endpoint, httpMethod, requestData);

                // Выполняем бизнес-логику
                var result = action();

                // Замеряем время
                stopwatch.Stop();
                _logger.LogInfo($"Обработка {endpoint} заняла {stopwatch.ElapsedMilliseconds} мс");

                // Отправляем ответ через ResponseSender
                return _sender.PrepareResponse(result, endpoint);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError($"Ошибка в {endpoint} ({stopwatch.ElapsedMilliseconds} мс)", ex);
                return _sender.SendError("Внутренняя ошибка сервера", ex.Message);
            }
        }
    }
}