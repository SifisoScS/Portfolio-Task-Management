using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using TaskManagementApi.Controllers;

namespace TaskManagementApi.Tests
{
    [TestFixture]
    public class TaskControllerTests
    {
        [Test]
        public void AddTask_ValidTask_ReturnsCreatedAtActionResult()
        {
            // Arrange
            var controller = new TaskController();

            var task = new TaskItem { /* ... initialize task data ... */ };

            // Act
            var result = controller.AddTask(task) as CreatedAtActionResult;

            // Assert
            Assert.NotNull(result);
            Assert.That(result.StatusCode, Is.EqualTo(201));
            Assert.NotNull(result.Value);
        }

        [Test]
        public void AddTask_InvalidTask_ReturnsBadRequest()
        {
            // Arrange
            var controller = new TaskController();
            controller.ModelState.AddModelError("Name", "Name is required."); // Simulate invalid model state

            var task = new TaskItem { /* ... initialize task data ... */ };

            // Act
            var result = controller.AddTask(task) as BadRequestObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.That(result.StatusCode, Is.EqualTo(400));
        }

        [Test]
        public void GetTaskById_ExistingId_ReturnsOkResult()
        {
            // Arrange
            var controller = new TaskController();
            // Initialize tasks or use Moq to mock data

            var taskId = 1; // Existing task ID

            // Act
            var result = controller.GetTaskById(taskId) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.That(result.StatusCode, Is.EqualTo(200));
            Assert.NotNull(result.Value);
        }

        [Test]
        public void GetTaskById_NonExistingId_ReturnsNotFound()
        {
            // Arrange
            var controller = new TaskController();
            // Initialize tasks or use Moq to mock data

            var taskId = 100; // Non-existing task ID

            // Act
            var result = controller.GetTaskById(taskId) as NotFoundResult;

            // Assert
            Assert.NotNull(result);
            Assert.That(result.StatusCode, Is.EqualTo(404));
        }

        // Will add more test cases for other controller actions...

    }
}
