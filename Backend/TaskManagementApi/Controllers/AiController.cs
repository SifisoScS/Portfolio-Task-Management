using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace TaskManagementApi.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;
    private readonly ILogger<AiController> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AiController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AiController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _apiKey = configuration["Anthropic:ApiKey"]
            ?? throw new InvalidOperationException(
                "Anthropic:ApiKey is not configured. Add it to appsettings.Development.json.");
    }

    /// <summary>
    /// POST /api/ai/reflect
    /// Accepts a pre-built prompt from the frontend and calls Claude.
    /// Returns a ReflectionResponse JSON object.
    /// </summary>
    [HttpPost("reflect")]
    public async Task<IActionResult> Reflect(
        [FromBody] JsonElement body,
        CancellationToken cancellationToken)
    {
        if (!body.TryGetProperty("prompt", out var promptEl) ||
            promptEl.GetString() is not { Length: > 0 } prompt)
        {
            return BadRequest(new { error = "prompt is required and must be non-empty." });
        }

        var client = _httpClientFactory.CreateClient("anthropic");

        var requestBody = JsonSerializer.Serialize(new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 4096,
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages")
        {
            Content = new StringContent(requestBody, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-api-key", _apiKey);

        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reach Anthropic API");
            return StatusCode(502, new { error = "AI service unreachable. Using fallback." });
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Anthropic API returned {Status}: {Body}",
                (int)response.StatusCode, errorBody);
            return StatusCode((int)response.StatusCode,
                new { error = "AI API error", details = errorBody });
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        JsonElement anthropicResponse;
        try
        {
            anthropicResponse = JsonSerializer.Deserialize<JsonElement>(responseJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Anthropic response");
            return StatusCode(500, new { error = "Failed to parse AI response." });
        }

        // Extract the text content block
        var textContent = anthropicResponse
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;

        // Strip optional markdown code fences the model may add
        var jsonText = textContent.Trim();
        if (jsonText.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
            jsonText = jsonText[7..];
        if (jsonText.StartsWith("```"))
            jsonText = jsonText[3..];
        if (jsonText.EndsWith("```"))
            jsonText = jsonText[..^3];
        jsonText = jsonText.Trim();

        try
        {
            var result = JsonSerializer.Deserialize<JsonElement>(jsonText, _jsonOptions);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI response was not valid JSON. Raw: {Raw}", textContent);
            return StatusCode(500, new
            {
                error = "AI response could not be parsed as JSON.",
                raw = textContent
            });
        }
    }
}
