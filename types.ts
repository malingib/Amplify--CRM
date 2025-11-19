
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
  role: 'Admin' | 'Manager' | 'Sales' | 'Viewer';
  email: string;
  avatar: string;
  status: 'Active' | 'Offline' | 'Away';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Done';
}

export type ViewState = 'dashboard' | 'pipeline' | 'proposals' | 'whatsapp' | 'tasks' | 'settings' | 'profile';
