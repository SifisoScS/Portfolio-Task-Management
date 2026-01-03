using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class Task
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public TaskStatus Status { get; set; } = TaskStatus.ToDo;

    public Priority Priority { get; set; } = Priority.Medium;

    public DateTime? DueDate { get; set; }

    public Guid? AssignedUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public User? AssignedUser { get; set; }
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
}
