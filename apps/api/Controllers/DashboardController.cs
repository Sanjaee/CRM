using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var totalCustomers = await _context.Customers.CountAsync(c => !c.IsDeleted);
        var activeInvoices = await _context.Invoices.CountAsync(i => !i.IsDeleted && i.InvoiceStatus != "Voided");

        var totalReceivables = await _context.Invoices
            .Where(i => !i.IsDeleted && i.InvoiceStatus != "Voided")
            .SumAsync(i => i.RemainingAmount);

        var startOfMonth = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var totalCollectedMonth = await _context.InvoicePayments
            .Where(ip => ip.AllocatedAt >= startOfMonth)
            .SumAsync(ip => ip.AllocatedAmount);

        var pendingApprovals = await _context.Invoices.CountAsync(i => !i.IsDeleted && i.InvoiceStatus == "Submitted");
        var overdueInvoices = await _context.Invoices.CountAsync(i => !i.IsDeleted && i.BillingStatus != "Paid" && i.DueDate.HasValue && i.DueDate.Value < DateTime.UtcNow);

        var totalDepartments = await _context.Departments.CountAsync(d => !d.IsDeleted);
        var totalBranches = await _context.Branches.CountAsync(b => !b.IsDeleted);

        return Ok(new DashboardStatsDto(
            totalCustomers,
            activeInvoices,
            totalReceivables,
            totalCollectedMonth,
            pendingApprovals,
            overdueInvoices,
            totalDepartments,
            totalBranches
        ));
    }
}
