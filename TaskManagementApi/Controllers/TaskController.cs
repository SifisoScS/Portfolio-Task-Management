using Microsoft.AspNetCore.Mvc;

namespace TaskManagementApi.Controllers
{
    [ApiController]
    [Route("api/tasks")]
    public class TaskController : ControllerBase
    {
        private static List<TaskItem> tasks = new List<TaskItem>();

        [HttpPost]
        public IActionResult AddTask([FromBody] TaskItem task)
        {
            if (task == null)
            {
                return BadRequest("Task data is null.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            task.Id = tasks.Count + 1; // Assign a new ID
            tasks.Add(task);

            return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTask(int id, TaskItem task)
        {
            var existingTask = tasks.FirstOrDefault(t => t.Id == id);
            if (existingTask == null)
            {
                return NotFound();
            }

            existingTask.Name = task.Name;
            existingTask.Description = task.Description;
            existingTask.IsCompleted = task.IsCompleted;

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTask(int id)
        {
            var existingTask = tasks.FirstOrDefault(t => t.Id == id);
            if (existingTask == null)
            {
                return NotFound();
            }

            tasks.Remove(existingTask);

            return NoContent();
        }

        /// <summary>
        /// Retrieves a specific task by ID.
        /// </summary>
        /// <param name="id">The ID of the task.</param>
        /// <returns>The task details.</returns>
        [HttpGet("{id}")]
        public IActionResult GetTaskById(int id)
        {
            var task = tasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }
    }
}
