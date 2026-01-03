using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class Project
{
    public Guid Id { get; set; }

    public Guid WorkspaceId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    // Navigation properties
    public Workspace Workspace { get; set; } = null!;
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
}
