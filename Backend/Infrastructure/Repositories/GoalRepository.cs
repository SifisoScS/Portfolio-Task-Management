using Domain.Entities;
using Application.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class GoalRepository : IRepository<GoalEntity>
    {
        private readonly AppDbContext _context;

        public GoalRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GoalEntity>> GetAllAsync()
            => await _context.Goals.ToListAsync();

        public async Task<GoalEntity?> GetByIdAsync(int id)
            => await _context.Goals.FindAsync(id);

        public async Task<GoalEntity> AddAsync(GoalEntity entity)
        {
            _context.Goals.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(GoalEntity entity)
        {
            _context.Goals.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Goals.FindAsync(id);
            if (entity != null)
            {
                _context.Goals.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
