using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class Workspace
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public Guid OwnerId { get; set; }

    // Navigation properties
    public User Owner { get; set; } = null!;
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
