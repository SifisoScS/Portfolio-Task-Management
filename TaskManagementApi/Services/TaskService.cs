using TaskManagementApi.Services;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Services
{
    public class TaskService : ITaskService
    {
        private readonly TaskManagementContext _context;

        public TaskService(TaskManagementContext context)
        {
            _context = context;
        }

        public List<TaskItem> GetTasks()
        {
            return _context.Tasks.ToList();
        }

        public TaskItem AddTask(TaskItem task)
        {
            if (task == null)
            {
                throw new ArgumentNullException(nameof(task));
            }

            _context.Tasks.Add(task);
            _context.SaveChanges();

            return task;
        }

        public TaskItem UpdateTask(int id, TaskItem task)
        {
            var existingTask = _context.Tasks.Find(id);
            if (existingTask == null)
            {
                throw new InvalidOperationException("Task not found.");
            }

            existingTask.Name = task.Name;
            existingTask.Description = task.Description;
            existingTask.IsCompleted = task.IsCompleted;

            _context.SaveChanges();
            return existingTask;
        }


        public void DeleteTask(int id)
        {
            var existingTask = _context.Tasks.Find(id);
            if (existingTask != null)
            {
                _context.Tasks.Remove(existingTask);
                _context.SaveChanges();
            }
        }

        public TaskItem GetTaskById(int id)
        {
            var task = _context.Tasks.Find(id);
            if (task == null)
            {
                // Handle the case where the task is not found
                throw new InvalidOperationException("Task not found");
            }
            return task;
        }

    }
}
