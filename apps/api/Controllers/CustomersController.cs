using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;
using WahanaTravel.WebApi.DTOs;
using WahanaTravel.WebApi.Infrastructure;

namespace WahanaTravel.WebApi.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<CustomerDto>>> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] string? customerType,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Customers
            .Include(c => c.Invoices)
            .Where(c => !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c =>
                c.CustomerNo.ToLower().Contains(s) ||
                c.Name.ToLower().Contains(s) ||
                (c.Alias != null && c.Alias.ToLower().Contains(s)) ||
                (c.EmailAddress != null && c.EmailAddress.ToLower().Contains(s)) ||
                (c.PhoneNo != null && c.PhoneNo.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(customerType))
        {
            query = query.Where(c => c.CustomerType == customerType);
        }

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerDto(
                c.Id,
                c.CustomerNo,
                c.Name,
                c.Alias,
                c.CustomerType,
                c.BusinessType,
                c.BusinessNature,
                c.EmailAddress,
                c.PhoneNo,
                c.OfficeAddress,
                c.OfficeCity,
                c.OfficePostalCode,
                c.OfficeCountry,
                c.CustomBillingAddress,
                c.BillingAddress,
                c.BillingCity,
                c.BillingPostalCode,
                c.BillingCountry,
                c.BillingEmailAddress,
                c.BillingPhoneNo,
                c.TaxIdType,
                c.TaxIdNo,
                c.CreditLimit,
                c.DueDays,
                c.IsActive,
                c.Notes,
                c.AssignedOfficer,
                c.Invoices.Where(i => !i.IsDeleted && i.InvoiceStatus != "Voided").Sum(i => i.BillingAmount),
                c.Invoices.Where(i => !i.IsDeleted && i.InvoiceStatus != "Voided").Sum(i => i.PaidAmount),
                c.Invoices.Where(i => !i.IsDeleted && i.InvoiceStatus != "Voided").Sum(i => i.RemainingAmount)
            ))
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        return Ok(new PagedResult<CustomerDto>(items, totalCount, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> GetCustomer(Guid id)
    {
        var c = await _context.Customers
            .Include(c => c.Invoices)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

        if (c == null) return NotFound(new { message = "Customer not found." });

        var totalInvoiced = c.Invoices.Where(i => !i.IsDeleted && i.InvoiceStatus != "Voided").Sum(i => i.BillingAmount);
        var totalPaid = c.Invoices.Where(i => !i.IsDeleted && i.InvoiceStatus != "Voided").Sum(i => i.PaidAmount);
        var outstanding = totalInvoiced - totalPaid;

        return Ok(new CustomerDto(
            c.Id,
            c.CustomerNo,
            c.Name,
            c.Alias,
            c.CustomerType,
            c.BusinessType,
            c.BusinessNature,
            c.EmailAddress,
            c.PhoneNo,
            c.OfficeAddress,
            c.OfficeCity,
            c.OfficePostalCode,
            c.OfficeCountry,
            c.CustomBillingAddress,
            c.BillingAddress,
            c.BillingCity,
            c.BillingPostalCode,
            c.BillingCountry,
            c.BillingEmailAddress,
            c.BillingPhoneNo,
            c.TaxIdType,
            c.TaxIdNo,
            c.CreditLimit,
            c.DueDays,
            c.IsActive,
            c.Notes,
            c.AssignedOfficer,
            totalInvoiced,
            totalPaid,
            outstanding
        ));
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        var count = await _context.Customers.CountAsync();
        var customerNo = $"CUST-{(count + 1):D4}";

        var customer = new Customer
        {
            CustomerNo = customerNo,
            Name = request.Name,
            Alias = request.Alias,
            CustomerType = request.CustomerType,
            BusinessType = request.BusinessType,
            BusinessNature = request.BusinessNature,
            EmailAddress = request.EmailAddress,
            PhoneNo = request.PhoneNo,
            OfficeAddress = request.OfficeAddress,
            OfficeCity = request.OfficeCity,
            OfficePostalCode = request.OfficePostalCode,
            CustomBillingAddress = request.CustomBillingAddress,
            BillingAddress = request.CustomBillingAddress ? request.BillingAddress : request.OfficeAddress,
            BillingCity = request.CustomBillingAddress ? request.BillingCity : request.OfficeCity,
            BillingPostalCode = request.CustomBillingAddress ? request.BillingPostalCode : request.OfficePostalCode,
            BillingEmailAddress = request.BillingEmailAddress,
            BillingPhoneNo = request.BillingPhoneNo,
            TaxIdType = request.TaxIdType,
            TaxIdNo = request.TaxIdNo,
            CreditLimit = request.CreditLimit,
            DueDays = request.DueDays,
            Notes = request.Notes,
            AssignedOfficer = request.AssignedOfficer,
            IsActive = true
        };

        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, new CustomerDto(
            customer.Id,
            customer.CustomerNo,
            customer.Name,
            customer.Alias,
            customer.CustomerType,
            customer.BusinessType,
            customer.BusinessNature,
            customer.EmailAddress,
            customer.PhoneNo,
            customer.OfficeAddress,
            customer.OfficeCity,
            customer.OfficePostalCode,
            customer.OfficeCountry,
            customer.CustomBillingAddress,
            customer.BillingAddress,
            customer.BillingCity,
            customer.BillingPostalCode,
            customer.BillingCountry,
            customer.BillingEmailAddress,
            customer.BillingPhoneNo,
            customer.TaxIdType,
            customer.TaxIdNo,
            customer.CreditLimit,
            customer.DueDays,
            customer.IsActive,
            customer.Notes,
            customer.AssignedOfficer,
            0, 0, 0
        ));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateCustomer(Guid id, [FromBody] UpdateCustomerRequest request)
    {
        var c = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        if (c == null) return NotFound(new { message = "Customer not found." });

        c.Name = request.Name;
        c.Alias = request.Alias;
        c.CustomerType = request.CustomerType;
        c.BusinessType = request.BusinessType;
        c.BusinessNature = request.BusinessNature;
        c.EmailAddress = request.EmailAddress;
        c.PhoneNo = request.PhoneNo;
        c.OfficeAddress = request.OfficeAddress;
        c.OfficeCity = request.OfficeCity;
        c.OfficePostalCode = request.OfficePostalCode;
        c.CustomBillingAddress = request.CustomBillingAddress;
        c.BillingAddress = request.BillingAddress;
        c.BillingCity = request.BillingCity;
        c.BillingPostalCode = request.BillingPostalCode;
        c.BillingEmailAddress = request.BillingEmailAddress;
        c.BillingPhoneNo = request.BillingPhoneNo;
        c.TaxIdType = request.TaxIdType;
        c.TaxIdNo = request.TaxIdNo;
        c.CreditLimit = request.CreditLimit;
        c.DueDays = request.DueDays;
        c.IsActive = request.IsActive;
        c.Notes = request.Notes;
        c.AssignedOfficer = request.AssignedOfficer;
        c.ModifiedDate = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> ArchiveCustomer(Guid id)
    {
        var c = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        if (c == null) return NotFound(new { message = "Customer not found." });

        c.IsDeleted = true;
        c.DeletedDate = DateTimeOffset.UtcNow;
        c.IsActive = false;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
