using Application.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace TaskManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GoalController : ControllerBase
    {
        private readonly IGoalService _goalService;

        public GoalController(IGoalService goalService)
        {
            _goalService = goalService;
        }

        [HttpGet]
        public async Task<IActionResult> GetGoals()
        {
            var goals = await _goalService.GetAllAsync();
            return Ok(goals);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGoalById(int id)
        {
            var goal = await _goalService.GetByIdAsync(id);
            if (goal == null) return NotFound();
            return Ok(goal);
        }

        [HttpPost]
        public async Task<IActionResult> AddGoal(GoalEntity goal)
        {
            var created = await _goalService.AddAsync(goal);
            return CreatedAtAction(nameof(GetGoals), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGoal(int id, GoalEntity goal)
        {
            if (await _goalService.GetByIdAsync(id) == null) return NotFound();
            goal.Id = id;
            await _goalService.UpdateAsync(goal);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            await _goalService.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("{id}/objectives")]
        public async Task<IActionResult> GetObjectives(int id)
        {
            var objectives = await _goalService.GetObjectivesAsync(id);
            return Ok(objectives);
        }

        [HttpPost("{id}/objectives")]
        public async Task<IActionResult> AddObjective(int id, ObjectiveEntity objective)
        {
            if (await _goalService.GetByIdAsync(id) == null) return NotFound();
            objective.GoalId = id;
            var created = await _goalService.AddObjectiveAsync(objective);
            return CreatedAtAction(nameof(GetObjectives), new { id }, created);
        }

        [HttpDelete("objectives/{id}")]
        public async Task<IActionResult> DeleteObjective(int id)
        {
            await _goalService.DeleteObjectiveAsync(id);
            return NoContent();
        }
    }
}
