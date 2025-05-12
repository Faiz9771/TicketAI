
export type TicketPriority = "high" | "medium" | "low";

export type TicketStatus = "open" | "in-progress" | "resolved";

export type TicketCategory = 
  | "technical" 
  | "billing" 
  | "account" 
  | "general";

export type UserRole = "customer" | "employee" | "admin";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  userEmail: string;
  userName: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isAIGenerated: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: TicketCategory;
  tags: string[];
}

