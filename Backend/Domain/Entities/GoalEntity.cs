namespace Domain.Entities
{
    public class GoalEntity
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? TargetDate { get; set; }
        public string? OwnerId { get; set; }
    }
}
