using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;

namespace WahanaTravel.WebApi.Infrastructure;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        // 1. Seed Departments (Official Wahana Reference)
        if (!await context.Departments.AnyAsync())
        {
            var fat = new Department { Code = "FAT", Name = "Finance, Accounting and Tax", Description = "Finance, Accounting and Tax Department", IsActive = true };
            var departments = new List<Department>
            {
                new() { Code = "TKT", Name = "Ticketing", Description = "Ticketing Operations Department", IsActive = true },
                new() { Code = "TUR", Name = "Tour", Description = "Tour & Travel Operations Department", IsActive = true },
                fat,
                new() { Code = "ACP", Name = "Accounts Payable", Description = "Handles company obligations to pay vendors and suppliers", IsActive = true, ParentDepartmentCode = "FAT" },
                new() { Code = "ACR", Name = "Accounts Receivable", Description = "Manages company receivables from customers and clients", IsActive = true, ParentDepartmentCode = "FAT" },
                new() { Code = "TAX", Name = "Tax", Description = "Handles company tax compliance, reporting, and regulatory obligations", IsActive = true, ParentDepartmentCode = "FAT" },
                new() { Code = "INV", Name = "Invoicing", Description = "Billing & Invoicing Department", IsActive = true, ParentDepartmentCode = "FAT" },
                new() { Code = "CNT", Name = "Content", Description = "Content & Media Management Department", IsActive = true },
                new() { Code = "IT", Name = "Information Technology", Description = "IT & System Administration Department", IsActive = true },
                new() { Code = "MGT", Name = "Management", Description = "Executive & Management Department", IsActive = true }
            };

            await context.Departments.AddRangeAsync(departments);
            await context.SaveChangesAsync();
        }

        // 2. Seed Branches (Official Wahana Reference)
        if (!await context.Branches.AnyAsync())
        {
            var branches = new List<Branch>
            {
                new() { Code = "PL", Name = "Wahana Pluit (Head Office)", Address = "Jl. Jembatan Tiga Blok IV No.4, Penjaringan, Jakarta Utara, 14440", IsHeadOffice = true, IsActive = true },
                new() { Code = "WK", Name = "Wahana Kuningan", Address = "Menara Kuningan Lantai 10. Unit D,E,F. Jl. H.R. Rasuna Said Blok X-7 Kav.5, Setiabudi, Jakarta Selatan, 12940", IsHeadOffice = false, IsActive = true },
                new() { Code = "PO", Name = "Wahana Palem", Address = "Taman Palem Lestari - Ruko 1000, Blok P. No 5. JL. Kamal Raya Outer Ring Road, Jakarta Barat, 11730", IsHeadOffice = false, IsActive = true },
                new() { Code = "KO", Name = "Wahana PU (Kebayoran)", Address = "Komplek Kementrian Pekerjaan Umum - Gedung Heritage. JL. Pattimura No. 20, Kebayoran Baru, Jakarta Selatan, 12110", IsHeadOffice = false, IsActive = true },
                new() { Code = "RO", Name = "Wahana Roxy", Address = "Komplek Ruko Roxy Mas, Blok D4/10, Jl. KH. Hasyim Ashari, Cideng, Gambir, Jakarta Pusat, 10150", IsHeadOffice = false, IsActive = true }
            };

            await context.Branches.AddRangeAsync(branches);
            await context.SaveChangesAsync();
        }

        // 3. Seed Standard Role Permissions
        if (!await context.RolePermissions.AnyAsync())
        {
            var permissions = new List<RolePermission>
            {
                // Administrator
                new() { Role = "Administrator", PermissionCode = "FullAccess", Module = "System" },
                new() { Role = "Administrator", PermissionCode = "customers.read", Module = "CRM" },
                new() { Role = "Administrator", PermissionCode = "customers.create", Module = "CRM" },
                new() { Role = "Administrator", PermissionCode = "customers.update", Module = "CRM" },
                new() { Role = "Administrator", PermissionCode = "customers.archive", Module = "CRM" },
                new() { Role = "Administrator", PermissionCode = "invoices.read", Module = "Invoicing" },
                new() { Role = "Administrator", PermissionCode = "invoices.create", Module = "Invoicing" },
                new() { Role = "Administrator", PermissionCode = "invoices.update", Module = "Invoicing" },
                new() { Role = "Administrator", PermissionCode = "invoices.approve", Module = "Invoicing" },
                new() { Role = "Administrator", PermissionCode = "invoices.issue", Module = "Invoicing" },
                new() { Role = "Administrator", PermissionCode = "invoices.cancel", Module = "Invoicing" },
                new() { Role = "Administrator", PermissionCode = "payments.read", Module = "Payments" },
                new() { Role = "Administrator", PermissionCode = "payments.record", Module = "Payments" },
                new() { Role = "Administrator", PermissionCode = "departments.manage", Module = "Departments" },
                new() { Role = "Administrator", PermissionCode = "branches.manage", Module = "Branches" },
                new() { Role = "Administrator", PermissionCode = "users.manage", Module = "Users" },
                new() { Role = "Administrator", PermissionCode = "roles.manage", Module = "RBAC" },
                new() { Role = "Administrator", PermissionCode = "audit.read", Module = "Audit" },
                new() { Role = "Administrator", PermissionCode = "reports.export", Module = "Reports" },

                // Director / Management
                new() { Role = "Director", PermissionCode = "customers.read", Module = "CRM" },
                new() { Role = "Director", PermissionCode = "invoices.read", Module = "Invoicing" },
                new() { Role = "Director", PermissionCode = "invoices.approve", Module = "Invoicing" },
                new() { Role = "Director", PermissionCode = "payments.read", Module = "Payments" },
                new() { Role = "Director", PermissionCode = "audit.read", Module = "Audit" },
                new() { Role = "Director", PermissionCode = "reports.export", Module = "Reports" },

                // Manager
                new() { Role = "Manager", PermissionCode = "customers.read", Module = "CRM" },
                new() { Role = "Manager", PermissionCode = "customers.create", Module = "CRM" },
                new() { Role = "Manager", PermissionCode = "customers.update", Module = "CRM" },
                new() { Role = "Manager", PermissionCode = "invoices.read", Module = "Invoicing" },
                new() { Role = "Manager", PermissionCode = "invoices.create", Module = "Invoicing" },
                new() { Role = "Manager", PermissionCode = "invoices.approve", Module = "Invoicing" },
                new() { Role = "Manager", PermissionCode = "payments.read", Module = "Payments" },
                new() { Role = "Manager", PermissionCode = "payments.record", Module = "Payments" },
                new() { Role = "Manager", PermissionCode = "reports.export", Module = "Reports" },

                // Staff (Ticketing / Invoicing)
                new() { Role = "Staff", PermissionCode = "customers.read", Module = "CRM" },
                new() { Role = "Staff", PermissionCode = "customers.create", Module = "CRM" },
                new() { Role = "Staff", PermissionCode = "customers.update", Module = "CRM" },
                new() { Role = "Staff", PermissionCode = "invoices.read", Module = "Invoicing" },
                new() { Role = "Staff", PermissionCode = "invoices.create", Module = "Invoicing" },
                new() { Role = "Staff", PermissionCode = "payments.read", Module = "Payments" },

                // Auditor
                new() { Role = "Auditor", PermissionCode = "customers.read", Module = "CRM" },
                new() { Role = "Auditor", PermissionCode = "invoices.read", Module = "Invoicing" },
                new() { Role = "Auditor", PermissionCode = "payments.read", Module = "Payments" },
                new() { Role = "Auditor", PermissionCode = "audit.read", Module = "Audit" },
                new() { Role = "Auditor", PermissionCode = "reports.export", Module = "Reports" }
            };

            await context.RolePermissions.AddRangeAsync(permissions);
            await context.SaveChangesAsync();
        }

        // 4. Seed Default Admin User
        if (!await context.AdminUsers.AnyAsync(a => a.LoginId == "admin"))
        {
            var saltBytes = Encoding.UTF8.GetBytes("WahanaSalt2026!SecureKey");
            var saltString = Convert.ToBase64String(saltBytes);
            var passwordHash = HashPassword("Admin123!", saltBytes);

            var user = new User
            {
                UserNo = "USR-0001",
                FullName = "System Administrator",
                Email = "admin@wahanatravel.id",
                PhoneNo = "081299998888",
                IsAdminUser = true,
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var adminUser = new AdminUser
            {
                UserId = user.Id,
                LoginId = "admin",
                Role = "Administrator",
                DepartmentCode = "IT",
                BranchCode = "PL",
                PasswordHash = passwordHash,
                PasswordSalt = saltString,
                JoinDate = DateTimeOffset.UtcNow
            };
            await context.AdminUsers.AddAsync(adminUser);

            // Add sample staff users for Department assignment testing
            var financeUser = new User
            {
                UserNo = "USR-0002",
                FullName = "Siti Rahmawati (Finance Mgr)",
                Email = "siti.rahma@wahanatravel.id",
                PhoneNo = "081288887777",
                IsAdminUser = true,
                IsActive = true
            };
            await context.Users.AddAsync(financeUser);
            await context.SaveChangesAsync();

            var financeAdmin = new AdminUser
            {
                UserId = financeUser.Id,
                LoginId = "siti.finance",
                Role = "Manager",
                DepartmentCode = "FAT",
                BranchCode = "PL",
                PasswordHash = passwordHash,
                PasswordSalt = saltString,
                JoinDate = DateTimeOffset.UtcNow
            };
            await context.AdminUsers.AddAsync(financeAdmin);

            var ticketingUser = new User
            {
                UserNo = "USR-0003",
                FullName = "Budi Santoso (Ticketing Specialist)",
                Email = "budi.santoso@wahanatravel.id",
                PhoneNo = "081377776666",
                IsAdminUser = true,
                IsActive = true
            };
            await context.Users.AddAsync(ticketingUser);
            await context.SaveChangesAsync();

            var ticketingAdmin = new AdminUser
            {
                UserId = ticketingUser.Id,
                LoginId = "budi.ticketing",
                Role = "Staff",
                DepartmentCode = "TKT",
                BranchCode = "WK",
                PasswordHash = passwordHash,
                PasswordSalt = saltString,
                JoinDate = DateTimeOffset.UtcNow
            };
            await context.AdminUsers.AddAsync(ticketingAdmin);

            await context.SaveChangesAsync();
        }

        // 5. Seed Sample CRM Customers
        if (!await context.Customers.AnyAsync())
        {
            var customers = new List<Customer>
            {
                new()
                {
                    CustomerNo = "CUST-0001",
                    Name = "PT Astra International Tbk",
                    Alias = "Astra Group",
                    CustomerType = "Corporate",
                    BusinessType = "PT",
                    BusinessNature = "Automotive & Conglomerate",
                    EmailAddress = "travel.corp@astra.co.id",
                    PhoneNo = "021-65306936",
                    OfficeAddress = "Menara Astra, Jl. Jend. Sudirman Kav. 5-6",
                    OfficeCity = "Jakarta Pusat",
                    OfficePostalCode = "10220",
                    TaxIdType = "NPWP",
                    TaxIdNo = "01.001.607.7-092.000",
                    CreditLimit = 500000000,
                    DueDays = 30,
                    IsActive = true,
                    AssignedOfficer = "budi.ticketing"
                },
                new()
                {
                    CustomerNo = "CUST-0002",
                    Name = "PT Bank Central Asia Tbk",
                    Alias = "BCA Corporate",
                    CustomerType = "Corporate",
                    BusinessType = "PT",
                    BusinessNature = "Banking & Financial Services",
                    EmailAddress = "procurement.flight@bca.co.id",
                    PhoneNo = "021-23588000",
                    OfficeAddress = "Menara BCA, Grand Indonesia, Jl. M.H. Thamrin No. 1",
                    OfficeCity = "Jakarta Pusat",
                    OfficePostalCode = "10310",
                    TaxIdType = "NPWP",
                    TaxIdNo = "01.308.449.6-091.000",
                    CreditLimit = 1000000000,
                    DueDays = 45,
                    IsActive = true,
                    AssignedOfficer = "siti.finance"
                },
                new()
                {
                    CustomerNo = "CUST-0003",
                    Name = "Dr. Hendra Wijaya, Sp.A",
                    Alias = "Dr. Hendra",
                    CustomerType = "Individual",
                    BusinessType = "Individual",
                    BusinessNature = "Medical Professional",
                    EmailAddress = "hendra.wijaya@gmail.com",
                    PhoneNo = "081122334455",
                    OfficeAddress = "Apartemen Mediterania Garden 2 Tower H, Tanjung Duren",
                    OfficeCity = "Jakarta Barat",
                    OfficePostalCode = "11470",
                    TaxIdType = "KTP",
                    TaxIdNo = "3173051203850002",
                    CreditLimit = 25000000,
                    DueDays = 7,
                    IsActive = true,
                    AssignedOfficer = "budi.ticketing"
                }
            };

            await context.Customers.AddRangeAsync(customers);
            await context.SaveChangesAsync();

            var defaultAdmin = await context.AdminUsers.FirstOrDefaultAsync(a => a.LoginId == "admin");
            var ticketingUser = await context.AdminUsers.FirstOrDefaultAsync(a => a.LoginId == "budi.ticketing");
            var adminId = defaultAdmin?.Id;
            var ticketingId = ticketingUser?.Id;

            // 6. Seed Sample Invoices & Items
            var astra = customers[0];
            var bca = customers[1];

            var inv1 = new Invoice
            {
                InvoiceNo = "INV-202610-0001",
                CustomerId = astra.Id,
                CustomerNo = astra.CustomerNo,
                CustomerName = astra.Name,
                ProductGroup = "FLIGHT",
                ProductCode = "DOM_AIRLINE",
                PaymentType = "Credit",
                InvoiceType = "Regular",
                InvoiceStatus = "Finalized",
                BillingStatus = "Unpaid",
                DueDays = 30,
                DueDate = DateTime.UtcNow.AddDays(30),
                NetFare = 15000000,
                ServiceFee = 350000,
                Discount = 0,
                EnableGST = true,
                GST = 165000,
                EnableStampDuty = true,
                StampDutyFee = 10000,
                BillingAmount = 15525000,
                PaidAmount = 0,
                RemainingAmount = 15525000,
                FinalizedDate = DateTimeOffset.UtcNow.AddDays(-2),
                FinalizedByUserId = adminId,
                Items = new List<InvoiceItem>
                {
                    new()
                    {
                        ItemDescription = "Garuda Indonesia GA-182 CGK - KNO (Jakarta - Medan)",
                        PnrCode = "W6HJ8K",
                        PassengerName = "Ir. Bambang Soeprapto",
                        Route = "CGK - KNO",
                        Quantity = 1,
                        UnitPrice = 7500000,
                        Discount = 0,
                        SubTotal = 7500000
                    },
                    new()
                    {
                        ItemDescription = "Garuda Indonesia GA-189 KNO - CGK (Medan - Jakarta)",
                        PnrCode = "W6HJ8K",
                        PassengerName = "Ir. Bambang Soeprapto",
                        Route = "KNO - CGK",
                        Quantity = 1,
                        UnitPrice = 7500000,
                        Discount = 0,
                        SubTotal = 7500000
                    }
                }
            };

            var inv2 = new Invoice
            {
                InvoiceNo = "INV-202610-0002",
                CustomerId = bca.Id,
                CustomerNo = bca.CustomerNo,
                CustomerName = bca.Name,
                ProductGroup = "FLIGHT",
                ProductCode = "INT_AIRLINE",
                PaymentType = "Credit",
                InvoiceType = "Regular",
                InvoiceStatus = "Submitted",
                BillingStatus = "Unpaid",
                DueDays = 45,
                DueDate = DateTime.UtcNow.AddDays(45),
                NetFare = 28000000,
                ServiceFee = 500000,
                Discount = 500000,
                EnableGST = true,
                GST = 308000,
                EnableStampDuty = true,
                StampDutyFee = 10000,
                BillingAmount = 28318000,
                PaidAmount = 0,
                RemainingAmount = 28318000,
                SubmittedDate = DateTimeOffset.UtcNow.AddHours(-6),
                SubmittedByUserId = ticketingId,
                Items = new List<InvoiceItem>
                {
                    new()
                    {
                        ItemDescription = "Singapore Airlines SQ-951 CGK - SIN (Jakarta - Singapore)",
                        PnrCode = "SQ98AZ",
                        PassengerName = "Michael Susanto",
                        Route = "CGK - SIN",
                        Quantity = 2,
                        UnitPrice = 14000000,
                        Discount = 500000,
                        SubTotal = 27500000
                    }
                }
            };

            await context.Invoices.AddRangeAsync(inv1, inv2);
            await context.SaveChangesAsync();

            // 7. Seed Sample Bank Payment
            var payment = new Payment
            {
                PaymentNo = "PAY-202610-0001",
                ReceivedAt = DateTimeOffset.UtcNow.AddDays(-1),
                ReceivedAccount = "BCA 088-2918888",
                ReceivedAccountDesc = "BCA Wahana Travel IDR (Head Office)",
                CurrencyCode = "IDR",
                ReceivedAmount = 15525000,
                AllocatedAmount = 15525000,
                UnallocatedAmount = 0,
                AllocationStatus = "FullyAllocated",
                ReferenceNo = "TRF-BCA-9921448",
                Notes = "Settlement for INV-202610-0001 Astra Group"
            };
            await context.Payments.AddAsync(payment);
            await context.SaveChangesAsync();

            // Link allocation
            var invoicePayment = new InvoicePayment
            {
                InvoiceId = inv1.Id,
                PaymentId = payment.Id,
                AllocatedAmount = 15525000,
                AllocatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                AllocatedByUserId = adminId
            };
            inv1.PaidAmount = 15525000;
            inv1.RemainingAmount = 0;
            inv1.BillingStatus = "Paid";

            await context.InvoicePayments.AddAsync(invoicePayment);
            await context.SaveChangesAsync();
        }
    }

    public static string HashPassword(string password, byte[] salt)
    {
        using var hmac = new HMACSHA512(salt);
        var computed = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(computed);
    }

    public static bool VerifyPassword(string password, string storedHash, string saltString)
    {
        var salt = Convert.FromBase64String(saltString);
        var hash = HashPassword(password, salt);
        return hash == storedHash;
    }
}
