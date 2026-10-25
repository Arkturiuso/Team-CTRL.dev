using Microsoft.EntityFrameworkCore;
using Server_RoboCode.Models.Data;
using Server_RoboCode.Models.DTO;
using Server_RoboCode.Models;

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
            var all = await _context.Commands
                .OrderBy(c => c.CommandId)
                .ToListAsync();

            var unlockedIds = await _context.KnowledgeBases
                .Where(kb => kb.UserId == userId)
                .Select(kb => kb.CommandId)
                .ToListAsync();

            var unlockedSet = unlockedIds.ToHashSet();

            static CommandDto Map(Command c) => new()
            {
                CommandId = c.CommandId,
                Name = c.Name,
                Syntax = c.Syntax,
                Description = c.Description
            };

            return new KnowledgeBaseResponse
            {
                Unlocked = all.Where(c => unlockedSet.Contains(c.CommandId)).Select(Map).ToList(),
                Locked = all.Where(c => !unlockedSet.Contains(c.CommandId)).Select(Map).ToList()
            };
        }
    }
}
