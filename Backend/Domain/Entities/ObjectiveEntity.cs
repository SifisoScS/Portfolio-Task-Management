namespace Domain.Entities
{
    public class ObjectiveEntity
    {
        public int Id { get; set; }
        public int GoalId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string>? KeyResults { get; set; }
    }
}
