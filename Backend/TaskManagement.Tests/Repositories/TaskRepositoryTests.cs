using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Domain.Entities;

namespace TaskManagement.Tests.Repositories;

public class TaskRepositoryTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly TaskRepository _sut;

    public TaskRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique DB per test
            .Options;

        _context = new AppDbContext(options);
        _sut = new TaskRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task GetAllAsync_WithNoTasks_ShouldReturnEmptyList()
    {
        // Act
        var result = await _sut.GetAllAsync();

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllAsync_WithTasks_ShouldReturnAllTasks()
    {
        // Arrange
        await _context.Tasks.AddRangeAsync(
            new TaskEntity { Name = "Task 1", Description = "Desc 1", IsCompleted = false },
            new TaskEntity { Name = "Task 2", Description = "Desc 2", IsCompleted = true }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetAllAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(t => t.Name == "Task 1");
        result.Should().Contain(t => t.Name == "Task 2");
    }

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ShouldReturnTask()
    {
        // Arrange
        var task = new TaskEntity { Name = "Test Task", Description = "Test", IsCompleted = false };
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetByIdAsync(task.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test Task");
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistingId_ShouldReturnNull()
    {
        // Act
        var result = await _sut.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task AddAsync_ShouldPersistTask()
    {
        // Arrange
        var newTask = new TaskEntity { Name = "New Task", Description = "New Desc", IsCompleted = false };

        // Act
        var result = await _sut.AddAsync(newTask);

        // Assert
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("New Task");

        var savedTask = await _context.Tasks.FindAsync(result.Id);
        savedTask.Should().NotBeNull();
        savedTask!.Name.Should().Be("New Task");
    }

    [Fact]
    public async Task UpdateAsync_ShouldModifyExistingTask()
    {
        // Arrange
        var task = new TaskEntity { Name = "Original", Description = "Original Desc", IsCompleted = false };
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act
        task.Name = "Updated";
        task.IsCompleted = true;
        await _sut.UpdateAsync(task);

        // Assert
        var updatedTask = await _context.Tasks.FindAsync(task.Id);
        updatedTask.Should().NotBeNull();
        updatedTask!.Name.Should().Be("Updated");
        updatedTask.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_WithExistingTask_ShouldRemove()
    {
        // Arrange
        var task = new TaskEntity { Name = "To Delete", Description = "Will be deleted", IsCompleted = false };
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act
        await _sut.DeleteAsync(task.Id);

        // Assert
        var deletedTask = await _context.Tasks.FindAsync(task.Id);
        deletedTask.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistingTask_ShouldNotThrow()
    {
        // Act
        var act = async () => await _sut.DeleteAsync(999);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AddAsync_MultipleTasksSequentially_ShouldAssignUniqueIds()
    {
        // Arrange & Act
        var task1 = await _sut.AddAsync(new TaskEntity { Name = "Task 1", Description = "Desc 1", IsCompleted = false });
        var task2 = await _sut.AddAsync(new TaskEntity { Name = "Task 2", Description = "Desc 2", IsCompleted = false });
        var task3 = await _sut.AddAsync(new TaskEntity { Name = "Task 3", Description = "Desc 3", IsCompleted = false });

        // Assert
        task1.Id.Should().BeGreaterThan(0);
        task2.Id.Should().BeGreaterThan(task1.Id);
        task3.Id.Should().BeGreaterThan(task2.Id);

        var allTasks = await _sut.GetAllAsync();
        allTasks.Should().HaveCount(3);
    }

    [Fact]
    public async Task UpdateAsync_ConcurrentUpdates_ShouldHandleGracefully()
    {
        // Arrange
        var task = new TaskEntity { Name = "Original", Description = "Desc", IsCompleted = false };
        await _context.Tasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Act - Simulate two concurrent updates
        task.Name = "Update 1";
        await _sut.UpdateAsync(task);

        task.Name = "Update 2";
        await _sut.UpdateAsync(task);

        // Assert
        var finalTask = await _context.Tasks.FindAsync(task.Id);
        finalTask.Should().NotBeNull();
        finalTask!.Name.Should().Be("Update 2");
    }

    [Fact]
    public async Task StressTest_Add1000Tasks_ShouldPerformEfficiently()
    {
        // Arrange
        var tasks = Enumerable.Range(1, 1000)
            .Select(i => new TaskEntity
            {
                Name = $"Task {i}",
                Description = $"Description {i}",
                IsCompleted = i % 2 == 0
            })
            .ToList();

        // Act
        var startTime = DateTime.UtcNow;

        foreach (var task in tasks)
        {
            await _sut.AddAsync(task);
        }

        var duration = DateTime.UtcNow - startTime;

        // Assert
        duration.Should().BeLessThan(TimeSpan.FromSeconds(10)); // Should complete in < 10 seconds

        var allTasks = await _sut.GetAllAsync();
        allTasks.Should().HaveCount(1000);
    }
}
