using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Core;
using Server_RoboCode.Models;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Models.Data;

namespace Server_RoboCode.Controllers;

[Route("api/commands")] // ✅ Маршрут верный
[ApiController]
[Authorize(Roles = "admin")]
public class CommandController : ControllerBase
{
    private readonly RobocodeContext _context;
    private readonly Brain _brain;

    public CommandController(RobocodeContext context, Brain brain)
    {
        _context = context;
        _brain = brain;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return await _brain.ProcessAsync(
            () => HandleGetAll(),
            "/api/commands",
            "GET"
        );
    }

    private IActionResult HandleGetAll()
    {
        var commands = _context.Commands
            .Select(c => new CommandDto 
            { 
                CommandId = c.CommandId, 
                Name = c.Name, 
                Syntax = c.Syntax, 
                Description = c.Description 
            })
            .OrderBy(c => c.CommandId)
            .ToList();

        return Ok(new ApiResponse { Success = true, Data = commands });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommandDto dto)
    {
        return await _brain.ProcessAsync(
            () => HandleCreate(dto),
            "/api/commands",
            "POST"
        );
    }

    private IActionResult HandleCreate(CreateCommandDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Syntax))
            return BadRequest(new ApiResponse { Success = false, Message = "Name и Syntax обязательны" });

        if (_context.Commands.Any(c => c.Name == dto.Name))
            return BadRequest(new ApiResponse { Success = false, Message = "Команда с таким именем уже существует" });

        var command = new Command { Name = dto.Name, Syntax = dto.Syntax, Description = dto.Description };
        _context.Commands.Add(command);
        _context.SaveChanges();

        return Ok(new ApiResponse
        {
            Success = true,
            Message = "Команда создана",
            Data = new CommandDto { CommandId = command.CommandId, Name = command.Name, Syntax = command.Syntax, Description = command.Description }
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCommandDto dto)
    {
        return await _brain.ProcessAsync(
            () => HandleUpdate(id, dto),
            $"/api/commands/{id}",
            "PUT"
        );
    }

    private IActionResult HandleUpdate(int id, UpdateCommandDto dto)
    {
        var command = _context.Commands.Find(id);
        if (command == null) return NotFound(new ApiResponse { Success = false, Message = "Команда не найдена" });

        if (dto.Syntax != null) command.Syntax = dto.Syntax;
        if (dto.Description != null) command.Description = dto.Description;

        _context.SaveChanges();
        return Ok(new ApiResponse { Success = true, Message = "Команда обновлена" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await _brain.ProcessAsync(
            () => HandleDelete(id),
            $"/api/commands/{id}",
            "DELETE"
        );
    }

    private IActionResult HandleDelete(int id)
    {
        var command = _context.Commands.Find(id);
        if (command == null) return NotFound(new ApiResponse { Success = false, Message = "Команда не найдена" });

        if (_context.LevelCommands.Any(lc => lc.CommandId == id))
            return BadRequest(new ApiResponse { Success = false, Message = "Нельзя удалить команду, используемую в уровнях" });

        if (_context.KnowledgeBases.Any(kb => kb.CommandId == id))
            return BadRequest(new ApiResponse { Success = false, Message = "Нельзя удалить команду, выданную пользователям" });

        _context.Commands.Remove(command);
        _context.SaveChanges();

        return Ok(new ApiResponse { Success = true, Message = "Команда удалена" });
    }
}