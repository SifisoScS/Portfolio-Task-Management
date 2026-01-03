using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string EntityType { get; set; } = string.Empty;

    public Guid EntityId { get; set; }

    public AuditAction Action { get; set; }

    public Guid? ActorUserId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(2000)]
    public string? Metadata { get; set; }

    // Navigation properties
    public User? ActorUser { get; set; }
}
