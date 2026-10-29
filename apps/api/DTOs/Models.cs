namespace WahanaTravel.WebApi.DTOs;

public record LoginRequest(string LoginId, string Password);

public record LoginResponse(
    string AccessToken,
    string TokenType,
    int ExpiresIn,
    UserProfileDto Profile
);

public record UserProfileDto(
    Guid UserId,
    string UserNo,
    string LoginId,
    string FullName,
    string Email,
    string? PhoneNo,
    string Role,
    string? DepartmentCode,
    string? DepartmentName,
    string? BranchCode,
    string? BranchName,
    List<string> Permissions
);

public record PagedResult<T>(
    List<T> Items,
    int TotalCount,
    int PageIndex,
    int PageSize,
    int TotalPages
);

public record CustomerDto(
    Guid Id,
    string CustomerNo,
    string Name,
    string? Alias,
    string CustomerType,
    string? BusinessType,
    string? BusinessNature,
    string? EmailAddress,
    string? PhoneNo,
    string? OfficeAddress,
    string? OfficeCity,
    string? OfficePostalCode,
    string? OfficeCountry,
    bool CustomBillingAddress,
    string? BillingAddress,
    string? BillingCity,
    string? BillingPostalCode,
    string? BillingCountry,
    string? BillingEmailAddress,
    string? BillingPhoneNo,
    string? TaxIdType,
    string? TaxIdNo,
    decimal CreditLimit,
    int DueDays,
    bool IsActive,
    string? Notes,
    string? AssignedOfficer,
    decimal TotalInvoiced,
    decimal TotalPaid,
    decimal OutstandingBalance
);

public record CreateCustomerRequest(
    string Name,
    string? Alias,
    string CustomerType,
    string? BusinessType,
    string? BusinessNature,
    string? EmailAddress,
    string? PhoneNo,
    string? OfficeAddress,
    string? OfficeCity,
    string? OfficePostalCode,
    bool CustomBillingAddress,
    string? BillingAddress,
    string? BillingCity,
    string? BillingPostalCode,
    string? BillingEmailAddress,
    string? BillingPhoneNo,
    string? TaxIdType,
    string? TaxIdNo,
    decimal CreditLimit,
    int DueDays,
    string? Notes,
    string? AssignedOfficer
);

public record UpdateCustomerRequest(
    string Name,
    string? Alias,
    string CustomerType,
    string? BusinessType,
    string? BusinessNature,
    string? EmailAddress,
    string? PhoneNo,
    string? OfficeAddress,
    string? OfficeCity,
    string? OfficePostalCode,
    bool CustomBillingAddress,
    string? BillingAddress,
    string? BillingCity,
    string? BillingPostalCode,
    string? BillingEmailAddress,
    string? BillingPhoneNo,
    string? TaxIdType,
    string? TaxIdNo,
    decimal CreditLimit,
    int DueDays,
    bool IsActive,
    string? Notes,
    string? AssignedOfficer
);

public record InvoiceItemDto(
    Guid? Id,
    string ItemDescription,
    string? PnrCode,
    string? PassengerName,
    string? Route,
    int Quantity,
    decimal UnitPrice,
    decimal Discount,
    decimal SubTotal
);

public record InvoiceDto(
    Guid Id,
    string InvoiceNo,
    Guid CustomerId,
    string CustomerNo,
    string CustomerName,
    string ProductGroup,
    string ProductCode,
    string CurrencyCode,
    string PaymentType,
    string InvoiceType,
    string InvoiceStatus,
    string BillingStatus,
    int DueDays,
    DateTime? DueDate,
    decimal NetFare,
    decimal ServiceFee,
    decimal Discount,
    bool EnableGST,
    decimal GST,
    bool EnableStampDuty,
    decimal StampDutyFee,
    decimal BillingAmount,
    decimal PaidAmount,
    decimal RemainingAmount,
    DateTimeOffset CreatedDate,
    DateTimeOffset? SubmittedDate,
    DateTimeOffset? ConfirmedDate,
    string? ConfirmedRemarks,
    DateTimeOffset? FinalizedDate,
    bool TaxInvoiceRequested,
    string TaxInvoiceStatus,
    string? TaxInvoiceNo,
    DateTimeOffset? TaxInvoiceDate,
    string ApStatus,
    List<InvoiceItemDto> Items
);

public record CreateInvoiceRequest(
    Guid CustomerId,
    string ProductGroup,
    string ProductCode,
    string PaymentType,
    string InvoiceType,
    int DueDays,
    bool EnableGST,
    bool EnableStampDuty,
    List<InvoiceItemDto> Items
);

public record UpdateInvoiceRequest(
    string PaymentType,
    string InvoiceType,
    int DueDays,
    bool EnableGST,
    bool EnableStampDuty,
    List<InvoiceItemDto> Items
);

public record ApproveInvoiceRequest(
    bool Approved,
    string? Remarks
);

public record PaymentDto(
    Guid Id,
    string PaymentNo,
    DateTimeOffset ReceivedAt,
    string ReceivedAccount,
    string ReceivedAccountDesc,
    string CurrencyCode,
    decimal ReceivedAmount,
    decimal AllocatedAmount,
    decimal UnallocatedAmount,
    string AllocationStatus,
    string? ReferenceNo,
    string? Notes,
    List<InvoicePaymentDto> Allocations
);

public record InvoicePaymentDto(
    Guid Id,
    Guid InvoiceId,
    string InvoiceNo,
    string CustomerName,
    decimal AllocatedAmount,
    DateTimeOffset AllocatedAt
);

public record RecordPaymentRequest(
    DateTimeOffset ReceivedAt,
    string ReceivedAccount,
    string ReceivedAccountDesc,
    decimal ReceivedAmount,
    string? ReferenceNo,
    string? Notes
);

public record AllocationItem(
    Guid InvoiceId,
    decimal Amount
);

public record AllocatePaymentRequest(
    List<AllocationItem> Allocations
);

public record DepartmentDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    string? ParentDepartmentCode,
    int UserCount,
    List<DepartmentDto> ChildDepartments
);

public record CreateDepartmentRequest(
    string Code,
    string Name,
    string? Description,
    string? ParentDepartmentCode
);

public record BranchDto(
    Guid Id,
    string Code,
    string Name,
    string Address,
    bool IsHeadOffice,
    bool IsActive,
    int UserCount
);

public record CreateBranchRequest(
    string Code,
    string Name,
    string Address,
    bool IsHeadOffice
);

public record UserDto(
    Guid Id,
    Guid UserId,
    string UserNo,
    string FullName,
    string Email,
    string? PhoneNo,
    string LoginId,
    string Role,
    string? DepartmentCode,
    string? DepartmentName,
    string? BranchCode,
    string? BranchName,
    DateTimeOffset? JoinDate,
    bool IsActive
);

public record CreateUserRequest(
    string FullName,
    string Email,
    string? PhoneNo,
    string LoginId,
    string Password,
    string Role,
    string? DepartmentCode,
    string? BranchCode
);

public record RolePermissionDto(
    string Role,
    List<string> Permissions
);

public record UpdateRolePermissionsRequest(
    List<string> Permissions
);

public record DashboardStatsDto(
    int TotalCustomers,
    int ActiveInvoices,
    decimal TotalReceivables,
    decimal TotalCollectedMonth,
    int PendingApprovals,
    int OverdueInvoices,
    int TotalDepartments,
    int TotalBranches
);
