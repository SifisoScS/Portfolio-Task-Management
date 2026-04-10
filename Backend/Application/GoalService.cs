using Domain.Entities;
using Application.Repositories;

namespace Application.Services
{
    public class GoalService : IGoalService
    {
        private readonly IRepository<GoalEntity> _goalRepo;
        private readonly IRepository<ObjectiveEntity> _objectiveRepo;

        public GoalService(IRepository<GoalEntity> goalRepo, IRepository<ObjectiveEntity> objectiveRepo)
        {
            _goalRepo = goalRepo;
            _objectiveRepo = objectiveRepo;
        }

        public async Task<IEnumerable<GoalEntity>> GetAllAsync()
            => await _goalRepo.GetAllAsync();

        public async Task<GoalEntity?> GetByIdAsync(int id)
            => await _goalRepo.GetByIdAsync(id);

        public async Task<GoalEntity> AddAsync(GoalEntity goal)
            => await _goalRepo.AddAsync(goal);

        public async Task UpdateAsync(GoalEntity goal)
        {
            var existing = await _goalRepo.GetByIdAsync(goal.Id);
            if (existing == null) return;

            existing.Title = goal.Title;
            existing.Description = goal.Description;
            existing.TargetDate = goal.TargetDate;
            existing.OwnerId = goal.OwnerId;
            await _goalRepo.UpdateAsync(existing);
        }

        public async Task DeleteAsync(int id)
            => await _goalRepo.DeleteAsync(id);

        public async Task<IEnumerable<ObjectiveEntity>> GetObjectivesAsync(int goalId)
        {
            var all = await _objectiveRepo.GetAllAsync();
            return all.Where(o => o.GoalId == goalId);
        }

        public async Task<ObjectiveEntity> AddObjectiveAsync(ObjectiveEntity objective)
            => await _objectiveRepo.AddAsync(objective);

        public async Task DeleteObjectiveAsync(int id)
            => await _objectiveRepo.DeleteAsync(id);
    }
}
