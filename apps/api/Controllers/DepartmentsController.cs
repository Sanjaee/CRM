using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public DepartmentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetDepartments()
    {
        var departments = await _context.Departments
            .Include(d => d.Users)
            .Include(d => d.ChildDepartments)
            .Where(d => !d.IsDeleted)
            .OrderBy(d => d.Code)
            .ToListAsync();

        var topLevel = departments
            .Where(d => string.IsNullOrEmpty(d.ParentDepartmentCode))
            .Select(d => MapToDto(d, departments))
            .ToList();

        // Also return full list flattened for cards
        var allDtos = departments.Select(d => new DepartmentDto(
            d.Id,
            d.Code,
            d.Name,
            d.Description,
            d.IsActive,
            d.ParentDepartmentCode,
            d.Users.Count(u => !u.IsDeleted),
            departments.Where(c => c.ParentDepartmentCode == d.Code).Select(c => new DepartmentDto(
                c.Id, c.Code, c.Name, c.Description, c.IsActive, c.ParentDepartmentCode, c.Users.Count(u => !u.IsDeleted), new()
            )).ToList()
        )).ToList();

        return Ok(allDtos);
    }

    private static DepartmentDto MapToDto(Department dept, List<Department> all)
    {
        var children = all
            .Where(c => c.ParentDepartmentCode == dept.Code)
            .Select(c => MapToDto(c, all))
            .ToList();

        return new DepartmentDto(
            dept.Id,
            dept.Code,
            dept.Name,
            dept.Description,
            dept.IsActive,
            dept.ParentDepartmentCode,
            dept.Users.Count(u => !u.IsDeleted),
            children
        );
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> CreateDepartment([FromBody] CreateDepartmentRequest request)
    {
        if (await _context.Departments.AnyAsync(d => d.Code == request.Code && !d.IsDeleted))
        {
            return BadRequest(new { message = $"Department code '{request.Code}' already exists." });
        }

        var dept = new Department
        {
            Code = request.Code.ToUpper(),
            Name = request.Name,
            Description = request.Description,
            ParentDepartmentCode = string.IsNullOrWhiteSpace(request.ParentDepartmentCode) ? null : request.ParentDepartmentCode.ToUpper(),
            IsActive = true
        };

        await _context.Departments.AddAsync(dept);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDepartments), new { id = dept.Id }, new DepartmentDto(
            dept.Id,
            dept.Code,
            dept.Name,
            dept.Description,
            dept.IsActive,
            dept.ParentDepartmentCode,
            0,
            new()
        ));
    }
}
