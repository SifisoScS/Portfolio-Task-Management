using Domain.Entities;
using Infrastructure.Persistence;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly AppDbContext _context;

        public TaskService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<TaskEntity> GetTasks() => _context.Tasks.ToList();

        public TaskEntity AddTask(TaskEntity task)
        {
            _context.Tasks.Add(task);
            _context.SaveChanges();
            return task;
        }

        public TaskEntity UpdateTask(int id, TaskEntity task)
        {
            var existing = _context.Tasks.Find(id);
            if (existing == null) return null;

            existing.Name = task.Name;
            existing.Description = task.Description;
            existing.IsCompleted = task.IsCompleted;
            _context.SaveChanges();
            return existing;
        }

        public void DeleteTask(int id)
        {
            var existing = _context.Tasks.Find(id);
            if (existing != null)
            {
                _context.Tasks.Remove(existing);
                _context.SaveChanges();
            }
        }

        public TaskEntity GetTaskById(int id) => _context.Tasks.Find(id);
    }
}
