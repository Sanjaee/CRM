using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/branches")]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly AppDbContext _context;

    public BranchesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<BranchDto>>> GetBranches()
    {
        var branches = await _context.Branches
            .Include(b => b.Users)
            .Where(b => !b.IsDeleted)
            .OrderBy(b => b.Code)
            .Select(b => new BranchDto(
                b.Id,
                b.Code,
                b.Name,
                b.Address,
                b.IsHeadOffice,
                b.IsActive,
                b.Users.Count(u => !u.IsDeleted)
            ))
            .ToListAsync();

        return Ok(branches);
    }

    [HttpPost]
    public async Task<ActionResult<BranchDto>> CreateBranch([FromBody] CreateBranchRequest request)
    {
        if (await _context.Branches.AnyAsync(b => b.Code == request.Code && !b.IsDeleted))
        {
            return BadRequest(new { message = $"Branch code '{request.Code}' already exists." });
        }

        var branch = new Branch
        {
            Code = request.Code.ToUpper(),
            Name = request.Name,
            Address = request.Address,
            IsHeadOffice = request.IsHeadOffice,
            IsActive = true
        };

        await _context.Branches.AddAsync(branch);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBranches), new { id = branch.Id }, new BranchDto(
            branch.Id,
            branch.Code,
            branch.Name,
            branch.Address,
            branch.IsHeadOffice,
            branch.IsActive,
            0
        ));
    }
}
