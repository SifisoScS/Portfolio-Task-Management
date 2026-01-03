using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class User
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [MaxLength(20)]
    public string? Phone { get; set; }

    public Role Role { get; set; } = Role.User;

    // Navigation properties
    public ICollection<Workspace> OwnedWorkspaces { get; set; } = new List<Workspace>();
    public ICollection<Task> AssignedTasks { get; set; } = new List<Task>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
