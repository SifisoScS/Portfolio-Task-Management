using Domain.Entities;
using System.Collections.Generic;

namespace Application.Services
{
    public interface ITaskService
    {
        IEnumerable<TaskEntity> GetTasks();
        TaskEntity AddTask(TaskEntity task);
        TaskEntity UpdateTask(int id, TaskEntity task);
        void DeleteTask(int id);
        TaskEntity GetTaskById(int id);
    }
}
