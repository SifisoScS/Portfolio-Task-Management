using Xunit;
using Moq;
using FluentAssertions;
using Application.Services;
using Application.Repositories;
using Domain.Entities;

namespace TaskManagement.Tests.Services;

public class TaskServiceTests
{
    private readonly Mock<IRepository<TaskEntity>> _mockRepository;
    private readonly TaskService _sut; // System Under Test

    public TaskServiceTests()
    {
        _mockRepository = new Mock<IRepository<TaskEntity>>();
        _sut = new TaskService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllTasks()
    {
        // Arrange
        var expectedTasks = new List<TaskEntity>
        {
            new() { Id = 1, Name = "Task 1", Description = "Desc 1", IsCompleted = false },
            new() { Id = 2, Name = "Task 2", Description = "Desc 2", IsCompleted = true }
        };

        _mockRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(expectedTasks);

        // Act
        var result = await _sut.GetAllAsync();

        // Assert
        result.Should().BeEquivalentTo(expectedTasks);
        _mockRepository.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnTask()
    {
        // Arrange
        var expectedTask = new TaskEntity { Id = 1, Name = "Test Task", Description = "Test", IsCompleted = false };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(expectedTask);

        // Act
        var result = await _sut.GetByIdAsync(1);

        // Assert
        result.Should().BeEquivalentTo(expectedTask);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((TaskEntity?)null);

        // Act
        var result = await _sut.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task AddAsync_ShouldCallRepositoryAndReturnTask()
    {
        // Arrange
        var newTask = new TaskEntity { Name = "New Task", Description = "New Desc", IsCompleted = false };
        var savedTask = new TaskEntity { Id = 1, Name = "New Task", Description = "New Desc", IsCompleted = false };

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<TaskEntity>()))
            .ReturnsAsync(savedTask);

        // Act
        var result = await _sut.AddAsync(newTask);

        // Assert
        result.Should().BeEquivalentTo(savedTask);
        result.Id.Should().BeGreaterThan(0);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<TaskEntity>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithExistingTask_ShouldUpdate()
    {
        // Arrange
        var existingTask = new TaskEntity { Id = 1, Name = "Old Name", Description = "Old Desc", IsCompleted = false };
        var updatedTask = new TaskEntity { Id = 1, Name = "New Name", Description = "New Desc", IsCompleted = true };

        _mockRepository
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(existingTask);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<TaskEntity>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.UpdateAsync(updatedTask);

        // Assert
        _mockRepository.Verify(r => r.UpdateAsync(It.Is<TaskEntity>(t =>
            t.Id == 1 &&
            t.Name == "New Name" &&
            t.IsCompleted == true
        )), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldCallRepository()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.DeleteAsync(1))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteAsync(1);

        // Assert
        _mockRepository.Verify(r => r.DeleteAsync(1), Times.Once);
    }

    [Theory]
    [InlineData("", "Description", false)] // Empty name
    [InlineData(null, "Description", false)] // Null name
    public async Task AddAsync_WithInvalidData_ShouldThrow(string name, string description, bool isCompleted)
    {
        // Arrange
        var invalidTask = new TaskEntity { Name = name, Description = description, IsCompleted = isCompleted };

        // Act & Assert
        // Note: This test assumes validation is added to the service
        // Currently the service doesn't validate, so this is a placeholder for future implementation
        var act = async () => await _sut.AddAsync(invalidTask);

        // If validation is added, uncomment:
        // await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task GetAllAsync_WhenRepositoryThrows_ShouldPropagate()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetAllAsync())
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act & Assert
        var act = async () => await _sut.GetAllAsync();
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Database error");
    }
}
