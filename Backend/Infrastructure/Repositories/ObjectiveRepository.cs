using Domain.Entities;
using Application.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class ObjectiveRepository : IRepository<ObjectiveEntity>
    {
        private readonly AppDbContext _context;

        public ObjectiveRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ObjectiveEntity>> GetAllAsync()
            => await _context.Objectives.ToListAsync();

        public async Task<ObjectiveEntity?> GetByIdAsync(int id)
            => await _context.Objectives.FindAsync(id);

        public async Task<ObjectiveEntity> AddAsync(ObjectiveEntity entity)
        {
            _context.Objectives.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(ObjectiveEntity entity)
        {
            _context.Objectives.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Objectives.FindAsync(id);
            if (entity != null)
            {
                _context.Objectives.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
