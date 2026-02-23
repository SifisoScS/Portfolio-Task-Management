using Application.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace TaskManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TaskController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks()
        {
            var tasks = await _taskService.GetTasks();
            return Ok(tasks);
        }

        [HttpPost]
        public async Task<IActionResult> AddTask(TaskEntity task)
        {
            var created = await _taskService.AddTask(task);
            return CreatedAtAction(nameof(GetTasks), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, TaskEntity task)
        {
            var updated = await _taskService.UpdateTask(id, task);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            await _taskService.DeleteTask(id);
            return NoContent();
        }
    }
}
