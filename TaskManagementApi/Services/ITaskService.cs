namespace TaskManagementApi.Services
{
    public interface ITaskService
    {
        TaskItem AddTask(TaskItem task);
        TaskItem UpdateTask(int id, TaskItem task);
        void DeleteTask(int id);
        TaskItem GetTaskById(int id);
        // Define other methods as needed
    }
}
