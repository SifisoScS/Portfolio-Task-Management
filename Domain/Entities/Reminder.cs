using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class Reminder
{
    public Guid Id { get; set; }

    public Guid TaskId { get; set; }

    public DateTime ScheduledAt { get; set; }

    public ReminderChannel Channel { get; set; }

    public ReminderStatus Status { get; set; } = ReminderStatus.Pending;

    // Navigation properties
    public Task Task { get; set; } = null!;
}
