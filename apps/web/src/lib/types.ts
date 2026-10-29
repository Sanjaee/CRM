export interface UserProfile {
  userId: string;
  userNo: string;
  loginId: string;
  fullName: string;
  email: string;
  phoneNo?: string;
  role: string;
  departmentCode?: string;
  departmentName?: string;
  branchCode?: string;
  branchName?: string;
  permissions: string[];
}

export interface Customer {
  id: string;
  customerNo: string;
  name: string;
  alias?: string;
  customerType: string;
  businessType?: string;
  businessNature?: string;
  emailAddress?: string;
  phoneNo?: string;
  officeAddress?: string;
  officeCity?: string;
  officePostalCode?: string;
  customBillingAddress: boolean;
  billingAddress?: string;
  billingCity?: string;
  taxIdType?: string;
  taxIdNo?: string;
  creditLimit: number;
  dueDays: number;
  isActive: boolean;
  notes?: string;
  assignedOfficer?: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface InvoiceItem {
  id?: string;
  itemDescription: string;
  pnrCode?: string;
  passengerName?: string;
  route?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerNo: string;
  customerName: string;
  productGroup: string;
  productCode: string;
  currencyCode: string;
  paymentType: string;
  invoiceType: string;
  invoiceStatus: "Draft" | "Submitted" | "Confirmed" | "Finalized" | "Voided";
  billingStatus: "Unpaid" | "PartiallyPaid" | "Paid" | "Overdue";
  dueDays: number;
  dueDate?: string;
  netFare: number;
  serviceFee: number;
  discount: number;
  enableGST: boolean;
  gst: number;
  enableStampDuty: boolean;
  stampDutyFee: number;
  billingAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdDate: string;
  submittedDate?: string;
  confirmedDate?: string;
  confirmedRemarks?: string;
  finalizedDate?: string;
  taxInvoiceRequested: boolean;
  taxInvoiceStatus: string;
  taxInvoiceNo?: string;
  apStatus: string;
  items: InvoiceItem[];
}

export interface PaymentAllocation {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customerName: string;
  allocatedAmount: number;
  allocatedAt: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  receivedAt: string;
  receivedAccount: string;
  receivedAccountDesc: string;
  currencyCode: string;
  receivedAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocationStatus: "Unallocated" | "PartiallyAllocated" | "FullyAllocated";
  referenceNo?: string;
  notes?: string;
  allocations: PaymentAllocation[];
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  parentDepartmentCode?: string;
  userCount: number;
  childDepartments: Department[];
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  isHeadOffice: boolean;
  isActive: boolean;
  userCount: number;
}

export interface UserItem {
  id: string;
  userId: string;
  userNo: string;
  fullName: string;
  email: string;
  phoneNo?: string;
  loginId: string;
  role: string;
  departmentCode?: string;
  departmentName?: string;
  branchCode?: string;
  branchName?: string;
  joinDate?: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalCustomers: number;
  activeInvoices: number;
  totalReceivables: number;
  totalCollectedMonth: number;
  pendingApprovals: number;
  overdueInvoices: number;
  totalDepartments: number;
  totalBranches: number;
}

export interface RolePermission {
  role: string;
  permissions: string[];
}
