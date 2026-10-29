using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<LoginResponse?> AuthenticateAdminAsync(string loginId, string password)
    {
        var admin = await _context.AdminUsers
            .Include(a => a.User)
            .Include(a => a.Department)
            .Include(a => a.Branch)
            .Include(a => a.PermissionOverrides)
            .FirstOrDefaultAsync(a => !a.IsDeleted && a.LoginId.ToLower() == loginId.ToLower());

        if (admin == null || !admin.User.IsActive || admin.User.IsDeleted)
        {
            return null;
        }

        if (!DbSeeder.VerifyPassword(password, admin.PasswordHash, admin.PasswordSalt))
        {
            return null;
        }

        // Resolve Permissions
        var rolePermissions = await _context.RolePermissions
            .Where(r => r.Role == admin.Role)
            .Select(r => r.PermissionCode)
            .ToListAsync();

        var overrides = admin.PermissionOverrides;
        var granted = overrides.Where(o => o.IsGranted).Select(o => o.PermissionCode);
        var denied = overrides.Where(o => !o.IsGranted).Select(o => o.PermissionCode);

        var finalPermissions = rolePermissions
            .Union(granted)
            .Except(denied)
            .Distinct()
            .ToList();

        // Update login state
        admin.User.IsLoggedIn = true;
        admin.User.LastLogin = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        // Generate JWT
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "WahanaTravelSuperSecureEnterpriseJwtSecretKey2026!!");
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, admin.UserId.ToString()),
            new(ClaimTypes.Name, admin.LoginId),
            new(ClaimTypes.Role, admin.Role),
            new("AdminUserId", admin.Id.ToString()),
            new("DepartmentCode", admin.DepartmentCode ?? ""),
            new("BranchCode", admin.BranchCode ?? "")
        };

        foreach (var perm in finalPermissions)
        {
            claims.Add(new Claim("Permission", perm));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _config["Jwt:Issuer"] ?? "WahanaTravel",
            Audience = _config["Jwt:Audience"] ?? "WahanaTravelApp",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return new LoginResponse(
            tokenString,
            "Bearer",
            604800,
            new UserProfileDto(
                admin.UserId,
                admin.User.UserNo,
                admin.LoginId,
                admin.User.FullName,
                admin.User.Email,
                admin.User.PhoneNo,
                admin.Role,
                admin.DepartmentCode,
                admin.Department?.Name,
                admin.BranchCode,
                admin.Branch?.Name,
                finalPermissions
            )
        );
    }
}
