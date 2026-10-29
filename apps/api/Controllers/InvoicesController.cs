using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InvoicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<InvoiceDto>>> GetInvoices(
        [FromQuery] string? search,
        [FromQuery] string? invoiceStatus,
        [FromQuery] string? billingStatus,
        [FromQuery] Guid? customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Invoices
            .Include(i => i.Items)
            .Where(i => !i.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(i =>
                i.InvoiceNo.ToLower().Contains(s) ||
                i.CustomerName.ToLower().Contains(s) ||
                i.CustomerNo.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(invoiceStatus))
        {
            query = query.Where(i => i.InvoiceStatus == invoiceStatus);
        }

        if (!string.IsNullOrWhiteSpace(billingStatus))
        {
            query = query.Where(i => i.BillingStatus == billingStatus);
        }

        if (customerId.HasValue)
        {
            query = query.Where(i => i.CustomerId == customerId.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new InvoiceDto(
                i.Id,
                i.InvoiceNo,
                i.CustomerId,
                i.CustomerNo,
                i.CustomerName,
                i.ProductGroup,
                i.ProductCode,
                i.CurrencyCode,
                i.PaymentType,
                i.InvoiceType,
                i.InvoiceStatus,
                i.BillingStatus,
                i.DueDays,
                i.DueDate,
                i.NetFare,
                i.ServiceFee,
                i.Discount,
                i.EnableGST,
                i.GST,
                i.EnableStampDuty,
                i.StampDutyFee,
                i.BillingAmount,
                i.PaidAmount,
                i.RemainingAmount,
                i.CreatedDate,
                i.SubmittedDate,
                i.ConfirmedDate,
                i.ConfirmedRemarks,
                i.FinalizedDate,
                i.TaxInvoiceRequested,
                i.TaxInvoiceStatus,
                i.TaxInvoiceNo,
                i.TaxInvoiceDate,
                i.ApStatus,
                i.Items.Select(item => new InvoiceItemDto(
                    item.Id,
                    item.ItemDescription,
                    item.PnrCode,
                    item.PassengerName,
                    item.Route,
                    item.Quantity,
                    item.UnitPrice,
                    item.Discount,
                    item.SubTotal
                )).ToList()
            ))
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        return Ok(new PagedResult<InvoiceDto>(items, totalCount, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(Guid id)
    {
        var i = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (i == null) return NotFound(new { message = "Invoice not found." });

        return Ok(new InvoiceDto(
            i.Id,
            i.InvoiceNo,
            i.CustomerId,
            i.CustomerNo,
            i.CustomerName,
            i.ProductGroup,
            i.ProductCode,
            i.CurrencyCode,
            i.PaymentType,
            i.InvoiceType,
            i.InvoiceStatus,
            i.BillingStatus,
            i.DueDays,
            i.DueDate,
            i.NetFare,
            i.ServiceFee,
            i.Discount,
            i.EnableGST,
            i.GST,
            i.EnableStampDuty,
            i.StampDutyFee,
            i.BillingAmount,
            i.PaidAmount,
            i.RemainingAmount,
            i.CreatedDate,
            i.SubmittedDate,
            i.ConfirmedDate,
            i.ConfirmedRemarks,
            i.FinalizedDate,
            i.TaxInvoiceRequested,
            i.TaxInvoiceStatus,
            i.TaxInvoiceNo,
            i.TaxInvoiceDate,
            i.ApStatus,
            i.Items.Select(item => new InvoiceItemDto(
                item.Id,
                item.ItemDescription,
                item.PnrCode,
                item.PassengerName,
                item.Route,
                item.Quantity,
                item.UnitPrice,
                item.Discount,
                item.SubTotal
            )).ToList()
        ));
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId && !c.IsDeleted);
        if (customer == null) return BadRequest(new { message = "Invalid customer specified." });

        var now = DateTime.UtcNow;
        var invoiceCount = await _context.Invoices.CountAsync();
        var invoiceNo = $"INV-{now:yyyyMM}-{(invoiceCount + 1):D4}";

        decimal netFare = 0;
        decimal totalDiscount = 0;
        var items = new List<InvoiceItem>();

        foreach (var it in request.Items)
        {
            var lineTotal = (it.UnitPrice * it.Quantity) - it.Discount;
            netFare += (it.UnitPrice * it.Quantity);
            totalDiscount += it.Discount;

            items.Add(new InvoiceItem
            {
                ItemDescription = it.ItemDescription,
                PnrCode = it.PnrCode,
                PassengerName = it.PassengerName,
                Route = it.Route,
                Quantity = it.Quantity,
                UnitPrice = it.UnitPrice,
                Discount = it.Discount,
                SubTotal = lineTotal
            });
        }

        decimal serviceFee = 350000;
        decimal taxableBase = (netFare - totalDiscount);
        decimal gst = request.EnableGST ? Math.Round(taxableBase * 0.011m, 0) : 0; // PPN 1.1% on travel
        decimal stampDuty = (request.EnableStampDuty && (taxableBase >= 5000000)) ? 10000 : 0;
        decimal billingAmount = taxableBase + serviceFee + gst + stampDuty;

        var invoice = new Invoice
        {
            InvoiceNo = invoiceNo,
            CustomerId = customer.Id,
            CustomerNo = customer.CustomerNo,
            CustomerName = customer.Name,
            ProductGroup = request.ProductGroup,
            ProductCode = request.ProductCode,
            PaymentType = request.PaymentType,
            InvoiceType = request.InvoiceType,
            InvoiceStatus = "Draft",
            BillingStatus = "Unpaid",
            DueDays = request.DueDays,
            DueDate = now.AddDays(request.DueDays),
            NetFare = netFare,
            ServiceFee = serviceFee,
            Discount = totalDiscount,
            EnableGST = request.EnableGST,
            GST = gst,
            EnableStampDuty = request.EnableStampDuty,
            StampDutyFee = stampDuty,
            BillingAmount = billingAmount,
            PaidAmount = 0,
            RemainingAmount = billingAmount,
            Items = items
        };

        await _context.Invoices.AddAsync(invoice);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, new InvoiceDto(
            invoice.Id,
            invoice.InvoiceNo,
            invoice.CustomerId,
            invoice.CustomerNo,
            invoice.CustomerName,
            invoice.ProductGroup,
            invoice.ProductCode,
            invoice.CurrencyCode,
            invoice.PaymentType,
            invoice.InvoiceType,
            invoice.InvoiceStatus,
            invoice.BillingStatus,
            invoice.DueDays,
            invoice.DueDate,
            invoice.NetFare,
            invoice.ServiceFee,
            invoice.Discount,
            invoice.EnableGST,
            invoice.GST,
            invoice.EnableStampDuty,
            invoice.StampDutyFee,
            invoice.BillingAmount,
            invoice.PaidAmount,
            invoice.RemainingAmount,
            invoice.CreatedDate,
            invoice.SubmittedDate,
            invoice.ConfirmedDate,
            invoice.ConfirmedRemarks,
            invoice.FinalizedDate,
            invoice.TaxInvoiceRequested,
            invoice.TaxInvoiceStatus,
            invoice.TaxInvoiceNo,
            invoice.TaxInvoiceDate,
            invoice.ApStatus,
            invoice.Items.Select(item => new InvoiceItemDto(
                item.Id,
                item.ItemDescription,
                item.PnrCode,
                item.PassengerName,
                item.Route,
                item.Quantity,
                item.UnitPrice,
                item.Discount,
                item.SubTotal
            )).ToList()
        ));
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<ActionResult> SubmitInvoice(Guid id)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (invoice == null) return NotFound(new { message = "Invoice not found." });

        if (invoice.InvoiceStatus != "Draft")
        {
            return BadRequest(new { message = $"Cannot submit invoice with status '{invoice.InvoiceStatus}'." });
        }

        invoice.InvoiceStatus = "Submitted";
        invoice.SubmittedDate = DateTimeOffset.UtcNow;
        
        await _context.InvoiceAuditLogs.AddAsync(new InvoiceAuditLog
        {
            InvoiceId = invoice.Id,
            Action = "Submitted",
            Details = "Invoice submitted for managerial approval",
            PerformedBy = User.Identity?.Name ?? "User"
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Invoice submitted successfully." });
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult> ApproveInvoice(Guid id, [FromBody] ApproveInvoiceRequest request)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (invoice == null) return NotFound(new { message = "Invoice not found." });

        if (invoice.InvoiceStatus != "Submitted")
        {
            return BadRequest(new { message = $"Cannot approve invoice with status '{invoice.InvoiceStatus}'." });
        }

        if (request.Approved)
        {
            invoice.InvoiceStatus = "Confirmed";
            invoice.ConfirmedDate = DateTimeOffset.UtcNow;
            invoice.ConfirmedRemarks = request.Remarks;
            // Also auto-finalize or allow finalize step
            invoice.FinalizedDate = DateTimeOffset.UtcNow;
            invoice.InvoiceStatus = "Finalized";

            await _context.InvoiceAuditLogs.AddAsync(new InvoiceAuditLog
            {
                InvoiceId = invoice.Id,
                Action = "ApprovedAndFinalized",
                Details = request.Remarks ?? "Invoice approved and confirmed",
                PerformedBy = User.Identity?.Name ?? "Approver"
            });
        }
        else
        {
            invoice.InvoiceStatus = "Draft"; // Returned to draft for amendments
            invoice.ConfirmedRemarks = request.Remarks;
            await _context.InvoiceAuditLogs.AddAsync(new InvoiceAuditLog
            {
                InvoiceId = invoice.Id,
                Action = "RejectedToDraft",
                Details = request.Remarks ?? "Invoice rejected back to draft",
                PerformedBy = User.Identity?.Name ?? "Approver"
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Invoice approval processed.", status = invoice.InvoiceStatus });
    }

}
