using Microsoft.AspNetCore.Mvc;
using Server_RoboCode.Models;
using System;

namespace Server_RoboCode.Services
{
    public class ResponseSender
    {
        private readonly ILoggerService _logger;

        public ResponseSender(ILoggerService logger)
        {
            _logger = logger;
        }

        public IActionResult PrepareResponse(IActionResult result, string endpoint)
        {
            int statusCode = result switch
            {
                OkObjectResult => 200,
                CreatedResult => 201,
                BadRequestObjectResult => 400,
                UnauthorizedResult => 401,
                ForbidResult => 403,
                NotFoundResult => 404,
                ConflictObjectResult => 409,
                ObjectResult objResult => objResult.StatusCode ?? 200,
                _ => 200
            };

            _logger.LogResponse(endpoint, statusCode, result);
            return result;
        }

        public IActionResult SendError(string message, string details = null, int statusCode = 500)
        {
            var response = new ApiResponse
            {
                Success = false,
                Message = message,
                Data = details != null ? new { Error = details } : null
            };

            _logger.LogError($"Отправка ошибки [{statusCode}]: {message}",
                details != null ? new Exception(details) : null);

            return new ObjectResult(response)
            {
                StatusCode = statusCode
            };
        }

        public IActionResult SendSuccess(object data, string message = "Операция выполнена успешно")
        {
            var response = new ApiResponse
            {
                Success = true,
                Message = message,
                Data = data
            };

            _logger.LogInfo($"Отправка успешного ответа", data);

            return new OkObjectResult(response);
        }
    }
}