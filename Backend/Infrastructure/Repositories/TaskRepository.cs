using Domain.Entities;
using Application.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class TaskRepository : IRepository<TaskEntity>
    {
        private readonly AppDbContext _context;

        public TaskRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TaskEntity>> GetAllAsync()
        {
            return await _context.Tasks.ToListAsync();
        }

        public async Task<TaskEntity?> GetByIdAsync(int id)
        {
            return await _context.Tasks.FindAsync(id);
        }

        public async Task<TaskEntity> AddAsync(TaskEntity entity)
        {
            _context.Tasks.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(TaskEntity entity)
        {
            _context.Tasks.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Tasks.FindAsync(id);
            if (entity != null)
            {
                _context.Tasks.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
