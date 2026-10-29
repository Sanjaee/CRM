using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PaymentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<PaymentDto>>> GetPayments(
        [FromQuery] string? search,
        [FromQuery] string? allocationStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Payments
            .Include(p => p.InvoicePayments)
                .ThenInclude(ip => ip.Invoice)
            .Where(p => !p.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p =>
                p.PaymentNo.ToLower().Contains(s) ||
                (p.ReferenceNo != null && p.ReferenceNo.ToLower().Contains(s)) ||
                (p.ReceivedAccount != null && p.ReceivedAccount.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(allocationStatus))
        {
            query = query.Where(p => p.AllocationStatus == allocationStatus);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.ReceivedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PaymentDto(
                p.Id,
                p.PaymentNo,
                p.ReceivedAt,
                p.ReceivedAccount,
                p.ReceivedAccountDesc,
                p.CurrencyCode,
                p.ReceivedAmount,
                p.AllocatedAmount,
                p.UnallocatedAmount,
                p.AllocationStatus,
                p.ReferenceNo,
                p.Notes,
                p.InvoicePayments.Select(ip => new InvoicePaymentDto(
                    ip.Id,
                    ip.InvoiceId,
                    ip.Invoice.InvoiceNo,
                    ip.Invoice.CustomerName,
                    ip.AllocatedAmount,
                    ip.AllocatedAt
                )).ToList()
            ))
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        return Ok(new PagedResult<PaymentDto>(items, totalCount, page, pageSize, totalPages));
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> RecordPayment([FromBody] RecordPaymentRequest request)
    {
        var now = DateTime.UtcNow;
        var count = await _context.Payments.CountAsync();
        var paymentNo = $"PAY-{now:yyyyMM}-{(count + 1):D4}";

        var payment = new Payment
        {
            PaymentNo = paymentNo,
            ReceivedAt = request.ReceivedAt,
            ReceivedAccount = request.ReceivedAccount,
            ReceivedAccountDesc = request.ReceivedAccountDesc,
            ReceivedAmount = request.ReceivedAmount,
            AllocatedAmount = 0,
            UnallocatedAmount = request.ReceivedAmount,
            AllocationStatus = "Unallocated",
            ReferenceNo = request.ReferenceNo,
            Notes = request.Notes
        };

        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPayments), new { id = payment.Id }, new PaymentDto(
            payment.Id,
            payment.PaymentNo,
            payment.ReceivedAt,
            payment.ReceivedAccount,
            payment.ReceivedAccountDesc,
            payment.CurrencyCode,
            payment.ReceivedAmount,
            payment.AllocatedAmount,
            payment.UnallocatedAmount,
            payment.AllocationStatus,
            payment.ReferenceNo,
            payment.Notes,
            new List<InvoicePaymentDto>()
        ));
    }

    [HttpPost("{id:guid}/allocate")]
    public async Task<ActionResult> AllocatePayment(Guid id, [FromBody] AllocatePaymentRequest request)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        var payment = await _context.Payments
            .Include(p => p.InvoicePayments)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (payment == null) return NotFound(new { message = "Payment record not found." });

        var sumRequested = request.Allocations.Sum(a => a.Amount);
        if (sumRequested > payment.UnallocatedAmount)
        {
            return BadRequest(new { message = $"Cannot allocate {sumRequested:N0} because remaining unallocated balance is only {payment.UnallocatedAmount:N0}." });
        }

        foreach (var item in request.Allocations)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == item.InvoiceId && !i.IsDeleted);
            if (invoice == null)
            {
                return BadRequest(new { message = $"Invoice {item.InvoiceId} not found." });
            }

            if (invoice.InvoiceStatus != "Finalized")
            {
                return BadRequest(new { message = $"Invoice {invoice.InvoiceNo} must be Finalized before payment can be allocated." });
            }

            if (item.Amount > invoice.RemainingAmount)
            {
                return BadRequest(new { message = $"Allocation amount {item.Amount:N0} exceeds invoice {invoice.InvoiceNo} remaining balance {invoice.RemainingAmount:N0}." });
            }

            var alloc = new InvoicePayment
            {
                InvoiceId = invoice.Id,
                PaymentId = payment.Id,
                AllocatedAmount = item.Amount,
                AllocatedAt = DateTimeOffset.UtcNow
            };
            await _context.InvoicePayments.AddAsync(alloc);

            // Update Invoice Paid & Remaining
            invoice.PaidAmount += item.Amount;
            invoice.RemainingAmount -= item.Amount;
            if (invoice.RemainingAmount <= 0)
            {
                invoice.BillingStatus = "Paid";
                invoice.RemainingAmount = 0;
            }
            else
            {
                invoice.BillingStatus = "PartiallyPaid";
            }

            payment.AllocatedAmount += item.Amount;
            payment.UnallocatedAmount -= item.Amount;
        }

        if (payment.UnallocatedAmount <= 0)
        {
            payment.AllocationStatus = "FullyAllocated";
            payment.UnallocatedAmount = 0;
        }
        else
        {
            payment.AllocationStatus = "PartiallyAllocated";
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { message = "Payment allocations confirmed successfully." });
    }
}
