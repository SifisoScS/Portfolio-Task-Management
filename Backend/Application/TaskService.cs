using Domain.Entities;
using Application.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IRepository<TaskEntity> _repository;

        public TaskService(IRepository<TaskEntity> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<TaskEntity>> GetTasks()
            => await _repository.GetAllAsync();

        public async Task<TaskEntity> AddTask(TaskEntity task)
            => await _repository.AddAsync(task);

        public async Task<TaskEntity?> UpdateTask(int id, TaskEntity task)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = task.Name;
            existing.Description = task.Description;
            existing.IsCompleted = task.IsCompleted;
            await _repository.UpdateAsync(existing);
            return existing;
        }

        public async Task DeleteTask(int id)
            => await _repository.DeleteAsync(id);

        public async Task<TaskEntity?> GetTaskById(int id)
            => await _repository.GetByIdAsync(id);
    }
}
