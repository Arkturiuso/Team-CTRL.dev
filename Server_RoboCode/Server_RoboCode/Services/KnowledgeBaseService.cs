using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server_RoboCode.Services
{
    public class KnowledgeBaseService : IKnowledgeBaseService
    {
        private readonly RobocodeContext _context;

        public KnowledgeBaseService(RobocodeContext context)
        {
            _context = context;
        }

        public async Task<KnowledgeBaseResponse> GetForUserAsync(int userId)
        {
            var unlocked = await _context.KnowledgeBases
                .Where(kb => kb.UserId == userId)
                .Join(_context.Commands, kb => kb.CommandId, c => c.CommandId, (kb, c) => new CommandDto 
                { 
                    CommandId = c.CommandId, 
                    Name = c.Name, 
                    Syntax = c.Syntax, 
                    Description = c.Description 
                })
                .ToListAsync();

            var allCommands = await _context.Commands
                .Select(c => new CommandDto 
                { 
                    CommandId = c.CommandId, 
                    Name = c.Name, 
                    Syntax = c.Syntax, 
                    Description = c.Description 
                })
                .ToListAsync();

            var locked = allCommands.Where(c => !unlocked.Any(u => u.CommandId == c.CommandId)).ToList();

            return new KnowledgeBaseResponse { Unlocked = unlocked, Locked = locked };
        }
        
        public async Task<List<CommandDto>> GetAllCommandsAsync()
        {
            return await _context.Commands
                .Select(c => new CommandDto
                {
                    CommandId = c.CommandId,
                    Name = c.Name,
                    Syntax = c.Syntax,
                    Description = c.Description
                })
                .OrderBy(c => c.CommandId)
                .ToListAsync();
        }
    }
}