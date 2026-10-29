using Microsoft.EntityFrameworkCore;
using WahanaTravel.WebApi.Domain;

namespace WahanaTravel.WebApi.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermissionOverride> UserPermissionOverrides => Set<UserPermissionOverride>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<InvoicePayment> InvoicePayments => Set<InvoicePayment>();
    public DbSet<InvoiceAuditLog> InvoiceAuditLogs => Set<InvoiceAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Departments
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();

            entity.HasOne(e => e.ParentDepartment)
                  .WithMany(p => p.ChildDepartments)
                  .HasPrincipalKey(p => p.Code)
                  .HasForeignKey(e => e.ParentDepartmentCode)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Branches
        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
        });

        // Users
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserNo).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // AdminUsers
        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.LoginId).IsUnique();
            entity.Property(e => e.Role).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.User)
                  .WithOne(u => u.AdminUser)
                  .HasForeignKey<AdminUser>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Department)
                  .WithMany(d => d.Users)
                  .HasPrincipalKey(d => d.Code)
                  .HasForeignKey(e => e.DepartmentCode)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Branch)
                  .WithMany(b => b.Users)
                  .HasPrincipalKey(b => b.Code)
                  .HasForeignKey(e => e.BranchCode)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // RolePermissions
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Role, e.PermissionCode }).IsUnique();
        });

        // Customers
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CustomerNo).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CreditLimit).HasPrecision(18, 2);
        });

        // Invoices
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvoiceNo).IsUnique();

            entity.Property(e => e.NetFare).HasPrecision(18, 2);
            entity.Property(e => e.ServiceFee).HasPrecision(18, 2);
            entity.Property(e => e.Discount).HasPrecision(18, 2);
            entity.Property(e => e.GST).HasPrecision(18, 2);
            entity.Property(e => e.StampDutyFee).HasPrecision(18, 2);
            entity.Property(e => e.BillingAmount).HasPrecision(18, 2);
            entity.Property(e => e.PaidAmount).HasPrecision(18, 2);
            entity.Property(e => e.RemainingAmount).HasPrecision(18, 2);

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Invoices)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // InvoiceItems
        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Discount).HasPrecision(18, 2);
            entity.Property(e => e.SubTotal).HasPrecision(18, 2);

            entity.HasOne(e => e.Invoice)
                  .WithMany(i => i.Items)
                  .HasForeignKey(e => e.InvoiceId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Payments
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PaymentNo).IsUnique();
            entity.Property(e => e.ReceivedAmount).HasPrecision(18, 2);
            entity.Property(e => e.AllocatedAmount).HasPrecision(18, 2);
            entity.Property(e => e.UnallocatedAmount).HasPrecision(18, 2);
        });

        // InvoicePayments
        modelBuilder.Entity<InvoicePayment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AllocatedAmount).HasPrecision(18, 2);

            entity.HasOne(e => e.Invoice)
                  .WithMany(i => i.InvoicePayments)
                  .HasForeignKey(e => e.InvoiceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Payment)
                  .WithMany(p => p.InvoicePayments)
                  .HasForeignKey(e => e.PaymentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
