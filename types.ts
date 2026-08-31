
export type UserRole = 'Admin' | 'Manager' | 'Sales' | 'Viewer' | 'SystemOwner';

export enum DealStage {
  INTAKE = 'Intake',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED = 'Closed',
  LOST = 'Lost'
}

export interface SystemConfig {
  modules: {
    leadAcquisition: boolean;
    compliance: boolean;
    bulkSms: boolean;
    telegram: boolean;
    whatsapp: boolean;
    googleChat: boolean;
  };
  crm: {
    autoConvert: boolean;
    stagnationAlertDays: number;
    defaultView: 'board' | 'list';
  };
  finance: {
    vatRate: number;
    invoiceDueDays: number;
    currency: string;
  };
  security: {
    require2FA: boolean;
    sessionTimeout: number; // minutes
    passwordExpiry?: number; // days
  };
  notifications: {
    leadAssigned: { email: boolean; sms: boolean; inApp: boolean };
    invoicePaid: { email: boolean; sms: boolean; inApp: boolean };
    taskDue: { email: boolean; sms: boolean; inApp: boolean };
    systemUpdate: { email: boolean; sms: boolean; inApp: boolean };
  };
  workspace: {
    companyName: string;
    timezone: string;
    dateFormat: string;
    primaryColor: string;
    kraPin?: string;
    logoUrl?: string;
    address?: string;
  };
  googleWorkspace?: {
    clientId: string;
    allowedDomain: string;
    chatEnabled: boolean;
  };
  telegramConfig?: {
    botToken: string;
    chatId: string;
    botName?: string;
  };
  mpesaConfig?: {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
  };
  paystackConfig?: {
    publicKey: string;
    secretKey: string;
  };
  mobiwaveConfig?: {
    apiKey: string;
    senderId: string;
  };
  dashboardWidgets?: {
    overview: boolean;
    performance: boolean;
    activity: boolean;
    revenue: boolean;
  };
}

export interface ActivityLog {
  id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'System';
  content: string;
  date: string; // ISO String
  performedBy?: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: DealStage;
  lastContact: string; // ISO date
  probability: number;
  avatar: string;
  email?: string;
  phone?: string;
  notes?: string;
  ownerId?: string; // ID of the sales rep
  proposalStatus?: 'None' | 'Draft' | 'Sent' | 'Accepted';
  qualificationScore?: number;
  qualificationSummary?: string;
  source?: 'Manual' | 'AI Search' | 'AI Maps' | 'Referral' | 'WhatsApp Bot' | 'Copilot';
  socials?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
  };
  address?: string;
  activityLogs?: ActivityLog[];
  growthPotential?: string;
  riskAssessment?: string;
  
  // Deep Insights
  painPoints?: string[];
  socialHighlights?: string;
  suggestedSolution?: string;
  engagementStrategy?: string;
  nextSteps?: string[];
  
  order: number;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending';
  lastOrder: string;
  totalRevenue: number;
  avatar: string;
  industry: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'client';
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  clientName: string;
  lastMessage: string;
  unreadCount: number;
  avatar: string;
  messages: Message[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  status: 'Active' | 'Offline' | 'Away';
  phone?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Done';
  reminderSet?: boolean;
  reminderTime?: string;
  reminderPhone?: string;
}

export interface CatalogueItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Product' | 'Service';
  sku?: string;
  image?: string;
  status: 'Active' | 'Draft' | 'Archived';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: CatalogueItem[];
  
  // eTIMS Fields
  etimsCompliant: boolean;
  cuSerialNumber?: string; // e.g., KRA0012345
  etimsDate?: string;
  qrCodeUrl?: string;
  transmissionStatus?: 'Pending' | 'Submitted' | 'Verified' | 'Failed';

  // Payment Fields
  paymentLink?: string;
}

export interface Transaction {
  id: string;
  code: string; // M-Pesa Code e.g., RHI89...
  amount: number;
  sender: string;
  date: string;
  method: 'M-Pesa' | 'Bank' | 'Cash';
  status: 'Verified' | 'Unreconciled';
}

export interface Tenant {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Past Due';
  nextBillingDate: string;
  usersCount: number;
  monthlyFee: number;
}

export type ViewState = 
  | 'dashboard' 
  | 'pipeline' 
  | 'proposals' 
  | 'bulksms' 
  | 'telegram'
  | 'tasks' 
  | 'settings' 
  | 'profile' 
  | 'clients' 
  | 'catalogue' 
  | 'financials' 
  | 'compliance'
  | 'system-overview'
  | 'system-tenants'
  | 'system-financials'
  | 'system-approvals'
  | 'lead-acquisition'
  | 'whatsapp'
  | 'channels';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  catalogueItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Proposal {
  id: string;
  leadId: string;
  title: string;
  content: string;
  total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  conditions?: string;
  actions: string;
  enabled: boolean;
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppSession {
  id: string;
  instanceName: string;
  phone?: string;
  status: 'created' | 'connected' | 'disconnected' | 'expired';
  qrCodeUrl?: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  botName?: string;
  webhookUrl?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  actor?: string;
  action: string;
  status: string;
  details: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
}
