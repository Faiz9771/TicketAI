
export type TicketPriority = "high" | "medium" | "low";

export type TicketStatus = "open" | "in-progress" | "resolved";

export type TicketCategory = 
  | "technical" 
  | "billing" 
  | "account" 
  | "general";

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
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: TicketCategory;
  tags: string[];
}
