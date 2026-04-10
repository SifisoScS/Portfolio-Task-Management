using Domain.Entities;
using Application.Repositories;

namespace Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IRepository<TaskEntity> _repository;

        public TaskService(IRepository<TaskEntity> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<TaskEntity>> GetAllAsync()
            => await _repository.GetAllAsync();

        public async Task<TaskEntity?> GetByIdAsync(int id)
            => await _repository.GetByIdAsync(id);

        public async Task<TaskEntity> AddAsync(TaskEntity task)
            => await _repository.AddAsync(task);

        public async Task UpdateAsync(TaskEntity task)
        {
            var existing = await _repository.GetByIdAsync(task.Id);
            if (existing == null) return;

            existing.Name = task.Name;
            existing.Description = task.Description;
            existing.IsCompleted = task.IsCompleted;
            existing.ParentId = task.ParentId;
            existing.DueDate = task.DueDate;
            existing.Tags = task.Tags;
            existing.OrderIndex = task.OrderIndex;
            await _repository.UpdateAsync(existing);
        }

        public async Task DeleteAsync(int id)
            => await _repository.DeleteAsync(id);
    }
}
