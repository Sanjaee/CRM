using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _context.AdminUsers
            .Include(a => a.User)
            .Include(a => a.Department)
            .Include(a => a.Branch)
            .Where(a => !a.IsDeleted && !a.User.IsDeleted)
            .Select(a => new UserDto(
                a.Id,
                a.UserId,
                a.User.UserNo,
                a.User.FullName,
                a.User.Email,
                a.User.PhoneNo,
                a.LoginId,
                a.Role,
                a.DepartmentCode,
                a.Department != null ? a.Department.Name : null,
                a.BranchCode,
                a.Branch != null ? a.Branch.Name : null,
                a.JoinDate,
                a.User.IsActive
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (await _context.AdminUsers.AnyAsync(a => a.LoginId.ToLower() == request.LoginId.ToLower() && !a.IsDeleted))
        {
            return BadRequest(new { message = $"Login ID '{request.LoginId}' is already in use." });
        }

        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && !u.IsDeleted))
        {
            return BadRequest(new { message = $"Email '{request.Email}' is already registered." });
        }

        var count = await _context.Users.CountAsync();
        var userNo = $"USR-{(count + 1):D4}";

        var saltBytes = Encoding.UTF8.GetBytes(Guid.NewGuid().ToString("N"));
        var saltString = Convert.ToBase64String(saltBytes);
        var passwordHash = DbSeeder.HashPassword(request.Password, saltBytes);

        var user = new User
        {
            UserNo = userNo,
            FullName = request.FullName,
            Email = request.Email,
            PhoneNo = request.PhoneNo,
            IsAdminUser = true,
            IsActive = true
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var adminUser = new AdminUser
        {
            UserId = user.Id,
            LoginId = request.LoginId,
            Role = request.Role,
            DepartmentCode = request.DepartmentCode,
            BranchCode = request.BranchCode,
            PasswordHash = passwordHash,
            PasswordSalt = saltString,
            JoinDate = DateTimeOffset.UtcNow
        };
        await _context.AdminUsers.AddAsync(adminUser);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), new { id = adminUser.Id }, new UserDto(
            adminUser.Id,
            user.Id,
            user.UserNo,
            user.FullName,
            user.Email,
            user.PhoneNo,
            adminUser.LoginId,
            adminUser.Role,
            adminUser.DepartmentCode,
            null,
            adminUser.BranchCode,
            null,
            adminUser.JoinDate,
            user.IsActive
        ));
    }

    [HttpGet("roles/permissions")]
    public async Task<ActionResult<List<RolePermissionDto>>> GetRolePermissions()
    {
        var grouped = await _context.RolePermissions
            .Where(r => !r.IsDeleted)
            .GroupBy(r => r.Role)
            .Select(g => new RolePermissionDto(
                g.Key,
                g.Select(p => p.PermissionCode).ToList()
            ))
            .ToListAsync();

        return Ok(grouped);
    }

    [HttpPut("roles/{role}/permissions")]
    public async Task<ActionResult> UpdateRolePermissions(string role, [FromBody] UpdateRolePermissionsRequest request)
    {
        var existing = await _context.RolePermissions
            .Where(r => r.Role == role)
            .ToListAsync();

        _context.RolePermissions.RemoveRange(existing);

        foreach (var perm in request.Permissions)
        {
            await _context.RolePermissions.AddAsync(new RolePermission
            {
                Role = role,
                PermissionCode = perm,
                Module = "Configured"
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Permissions updated for role '{role}'." });
    }
}
