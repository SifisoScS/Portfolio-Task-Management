using Domain.Entities;

namespace Application.Services
{
    public interface IGoalService
    {
        Task<IEnumerable<GoalEntity>> GetAllAsync();
        Task<GoalEntity?> GetByIdAsync(int id);
        Task<GoalEntity> AddAsync(GoalEntity goal);
        Task UpdateAsync(GoalEntity goal);
        Task DeleteAsync(int id);
        Task<IEnumerable<ObjectiveEntity>> GetObjectivesAsync(int goalId);
        Task<ObjectiveEntity> AddObjectiveAsync(ObjectiveEntity objective);
        Task DeleteObjectiveAsync(int id);
    }
}
