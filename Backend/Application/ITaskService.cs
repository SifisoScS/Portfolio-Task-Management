using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Services
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskEntity>> GetTasks();
        Task<TaskEntity> AddTask(TaskEntity task);
        Task<TaskEntity?> UpdateTask(int id, TaskEntity task);
        Task DeleteTask(int id);
        Task<TaskEntity?> GetTaskById(int id);
    }
}
