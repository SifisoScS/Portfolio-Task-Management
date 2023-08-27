namespace TaskManagementApi.Models
{
    public class UpdateTaskItem
    {
        public string? Name { get; set; }

        public string? Description { get; set; }

        public bool IsCompleted { get; set; }
    }
}
