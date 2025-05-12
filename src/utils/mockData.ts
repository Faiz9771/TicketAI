
import { Ticket, KnowledgeArticle } from "../types/ticket";

export const mockTickets: Ticket[] = [
  {
    id: "TKT-1001",
    title: "Cannot access my account",
    description: "I'm trying to log in but keep getting an error message saying 'Invalid credentials'.",
    userEmail: "john.doe@example.com",
    userName: "John Doe",
    category: "account",
    priority: "high",
    status: "open",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "TKT-1002",
    title: "Billing discrepancy on latest invoice",
    description: "The amount charged on my last invoice doesn't match my service plan. I should be paying $49.99 but was charged $59.99.",
    userEmail: "sarah.smith@example.com",
    userName: "Sarah Smith",
    category: "billing",
    priority: "medium",
    status: "in-progress",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3200000).toISOString(),
  },
  {
    id: "TKT-1003",
    title: "Feature request: Dark mode",
    description: "Would love to have a dark mode option for your application. It would be easier on the eyes during night time use.",
    userEmail: "dev.user@example.com",
    userName: "Alex Johnson",
    category: "general",
    priority: "low",
    status: "open",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "TKT-1004",
    title: "Application crashes on startup",
    description: "After the latest update, the desktop application crashes immediately when I try to open it. I've tried reinstalling but the issue persists.",
    userEmail: "tech.savvy@example.com",
    userName: "Michael Chen",
    category: "technical",
    priority: "high",
    status: "open",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: "TKT-1005",
    title: "How to export data?",
    description: "I need to export my usage data for the last quarter. How can I generate a comprehensive report?",
    userEmail: "business.user@example.com",
    userName: "Emma Rodriguez",
    category: "technical",
    priority: "medium",
    status: "resolved",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  }
];

export const mockKnowledgeBase: KnowledgeArticle[] = [
  {
    id: "KB-001",
    title: "How to reset your password",
    content: "If you're having trouble logging in, you can reset your password by clicking 'Forgot Password' on the login screen and following the instructions sent to your email.",
    category: "account",
    tags: ["login", "password", "access"]
  },
  {
    id: "KB-002",
    title: "Understanding your monthly bill",
    content: "Your monthly bill consists of your base subscription fee plus any additional services used. Usage beyond your plan's limits will incur extra charges.",
    category: "billing",
    tags: ["invoice", "charges", "payment"]
  },
  {
    id: "KB-003",
    title: "Troubleshooting application crashes",
    content: "If the application crashes on startup, try clearing the cache, ensuring your system meets minimum requirements, and checking for conflicting software.",
    category: "technical",
    tags: ["crash", "error", "troubleshooting"]
  },
  {
    id: "KB-004",
    title: "How to export data reports",
    content: "To export data, navigate to 'Reports' in the dashboard, select the date range, choose your preferred format (CSV, PDF, or Excel), and click 'Generate Report'.",
    category: "technical",
    tags: ["export", "reports", "data"]
  }
];
