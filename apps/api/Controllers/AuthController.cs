using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Services;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.AuthenticateAdminAsync(request.LoginId, request.Password);
        if (response == null)
        {
            return Unauthorized(new { message = "Invalid login credentials or inactive account." });
        }

        return Ok(response);
    }
}
