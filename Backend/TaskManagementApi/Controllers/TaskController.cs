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
        public IActionResult GetTasks() => Ok(_taskService.GetTasks());

        [HttpPost]
        public IActionResult AddTask(TaskEntity task)
        {
            var created = _taskService.AddTask(task);
            return CreatedAtAction(nameof(GetTasks), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTask(int id, TaskEntity task)
        {
            var updated = _taskService.UpdateTask(id, task);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTask(int id)
        {
            _taskService.DeleteTask(id);
            return NoContent();
        }
    }
}
