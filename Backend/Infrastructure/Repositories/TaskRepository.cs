using Domain.Entities;
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

        public async Task<IEnumerable<TaskEntity>> FindAsync(System.Linq.Expressions.Expression<System.Func<TaskEntity, bool>> predicate)
        {
            return await _context.Tasks.Where(predicate).ToListAsync();
        }

        public async Task UpdateAsync(TaskEntity entity)
        {
            _context.Tasks.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(TaskEntity entity)
        {
            _context.Tasks.Remove(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
