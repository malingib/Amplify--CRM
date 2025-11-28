

export type UserRole = 'Admin' | 'Manager' | 'Sales' | 'Viewer';

export enum DealStage {
  INTAKE = 'Intake',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED = 'Closed'
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
  proposalStatus?: 'None' | 'Draft' | 'Sent' | 'Accepted';
  qualificationScore?: number;
  qualificationSummary?: string;
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
  etimsCompliant: boolean;
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

export type ViewState = 'dashboard' | 'pipeline' | 'proposals' | 'bulksms' | 'tasks' | 'settings' | 'profile' | 'clients' | 'catalogue' | 'financials';