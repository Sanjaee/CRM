namespace WahanaTravel.WebApi.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset CreatedDate { get; set; } = DateTimeOffset.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset? ModifiedDate { get; set; }
    public Guid? ModifiedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedDate { get; set; }
    public Guid? DeletedBy { get; set; }
}

public class Department : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ParentDepartmentCode { get; set; }
    public Department? ParentDepartment { get; set; }
    public List<Department> ChildDepartments { get; set; } = new();
    public List<AdminUser> Users { get; set; } = new();
}

public class Branch : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Address { get; set; } = default!;
    public bool IsHeadOffice { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public List<AdminUser> Users { get; set; } = new();
}

public class User : AuditableEntity
{
    public string UserNo { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? PhoneNo { get; set; }
    public bool IsAdminUser { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsLoggedIn { get; set; }
    public DateTimeOffset? LastLogin { get; set; }
    public AdminUser? AdminUser { get; set; }
}

public class AdminUser : AuditableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public string LoginId { get; set; } = default!;
    public string Role { get; set; } = default!; // Administrator, Director, Manager, Staff, Auditor, Contributor
    public string? DepartmentCode { get; set; }
    public Department? Department { get; set; }
    public string? BranchCode { get; set; }
    public Branch? Branch { get; set; }
    public DateTimeOffset? JoinDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResignDate { get; set; }
    public string? ResignNotes { get; set; }
    public string PasswordHash { get; set; } = default!;
    public string PasswordSalt { get; set; } = default!;
    public List<UserPermissionOverride> PermissionOverrides { get; set; } = new();
}

public class RolePermission : AuditableEntity
{
    public string Role { get; set; } = default!;
    public string PermissionCode { get; set; } = default!;
    public string? Module { get; set; }
}

public class UserPermissionOverride : AuditableEntity
{
    public Guid AdminUserId { get; set; }
    public AdminUser AdminUser { get; set; } = default!;
    public string PermissionCode { get; set; } = default!;
    public bool IsGranted { get; set; } = true; // true = grant, false = explicit deny
}

public class Customer : AuditableEntity
{
    public string CustomerNo { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Alias { get; set; }
    public string CustomerType { get; set; } = "Corporate"; // Corporate, Individual, Government, B2B
    public string? Group { get; set; }
    public string? BusinessType { get; set; } // PT, CV, Individual
    public string? BusinessNature { get; set; }
    public string? EmailAddress { get; set; }
    public string? PhoneNo { get; set; }
    public string? Website { get; set; }
    public string? OfficeAddress { get; set; }
    public string? OfficeCity { get; set; }
    public string? OfficePostalCode { get; set; }
    public string? OfficeCountry { get; set; } = "Indonesia";

    public bool CustomBillingAddress { get; set; } = false;
    public string? BillingAddress { get; set; }
    public string? BillingCity { get; set; }
    public string? BillingPostalCode { get; set; }
    public string? BillingCountry { get; set; } = "Indonesia";
    public string? BillingEmailAddress { get; set; }
    public string? BillingPhoneNo { get; set; }

    public string? TaxIdType { get; set; } = "NPWP";
    public string? TaxIdNo { get; set; }
    public decimal CreditLimit { get; set; } = 0;
    public int DueDays { get; set; } = 30;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public string? AssignedOfficer { get; set; }

    public List<Invoice> Invoices { get; set; } = new();
}

public class Invoice : AuditableEntity
{
    public string InvoiceNo { get; set; } = default!;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;
    public string CustomerNo { get; set; } = default!;
    public string CustomerName { get; set; } = default!;
    public string ProductGroup { get; set; } = "FLIGHT"; // FLIGHT, TOUR, HOTEL, TRAVEL_DOC
    public string ProductCode { get; set; } = "DOM_AIRLINE";
    public string CurrencyCode { get; set; } = "IDR";
    public string PaymentType { get; set; } = "Credit"; // Cash, Credit
    public string InvoiceType { get; set; } = "Regular"; // Regular, Proforma, CreditNote
    public string InvoiceStatus { get; set; } = "Draft"; // Draft, Submitted, Confirmed, Finalized, VoidRequested, Voided, Cancelled
    public string BillingStatus { get; set; } = "Unpaid"; // Unpaid, PartiallyPaid, Paid, Overdue

    public int DueDays { get; set; } = 30;
    public DateTime? DueDate { get; set; }

    public decimal NetFare { get; set; } = 0;
    public decimal ServiceFee { get; set; } = 0;
    public decimal Discount { get; set; } = 0;
    public bool EnableGST { get; set; } = true;
    public decimal GST { get; set; } = 0; // PPN 1.1% or 11%
    public bool EnableStampDuty { get; set; } = false;
    public decimal StampDutyFee { get; set; } = 0; // Rp 10,000 for >= Rp 5M
    public decimal BillingAmount { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public decimal RemainingAmount { get; set; } = 0;

    public Guid? SubmittedByUserId { get; set; }
    public DateTimeOffset? SubmittedDate { get; set; }
    public Guid? ConfirmedByUserId { get; set; }
    public DateTimeOffset? ConfirmedDate { get; set; }
    public string? ConfirmedRemarks { get; set; }
    public DateTimeOffset? FinalizedDate { get; set; }
    public Guid? FinalizedByUserId { get; set; }

    public bool TaxInvoiceRequested { get; set; } = false;
    public string TaxInvoiceStatus { get; set; } = "NotRequested"; // NotRequested, Requested, Uploaded, Validated
    public string? TaxInvoiceNo { get; set; }
    public DateTimeOffset? TaxInvoiceDate { get; set; }
    public string ApStatus { get; set; } = "Pending"; // Pending, Validated, Rejected

    public List<InvoiceItem> Items { get; set; } = new();
    public List<InvoicePayment> InvoicePayments { get; set; } = new();
    public List<InvoiceAuditLog> AuditLogs { get; set; } = new();
}

public class InvoiceItem : AuditableEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;
    public string ItemDescription { get; set; } = default!;
    public string? PnrCode { get; set; }
    public string? PassengerName { get; set; }
    public string? Route { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal Discount { get; set; } = 0;
    public decimal SubTotal { get; set; } = 0;
}

public class Payment : AuditableEntity
{
    public string PaymentNo { get; set; } = default!;
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
    public string ReceivedAccount { get; set; } = "BCA 088-2918888";
    public string ReceivedAccountDesc { get; set; } = "BCA Wahana Travel IDR";
    public string CurrencyCode { get; set; } = "IDR";
    public decimal ReceivedAmount { get; set; } = 0;
    public decimal AllocatedAmount { get; set; } = 0;
    public decimal UnallocatedAmount { get; set; } = 0;
    public string AllocationStatus { get; set; } = "Unallocated"; // Unallocated, PartiallyAllocated, FullyAllocated
    public string? ReferenceNo { get; set; }
    public string? Notes { get; set; }

    public List<InvoicePayment> InvoicePayments { get; set; } = new();
}

public class InvoicePayment : AuditableEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = default!;
    public decimal AllocatedAmount { get; set; } = 0;
    public DateTimeOffset AllocatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? AllocatedByUserId { get; set; }
}

public class InvoiceAuditLog : AuditableEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = default!;
    public string Action { get; set; } = default!;
    public string? Details { get; set; }
    public string PerformedBy { get; set; } = default!;
}
