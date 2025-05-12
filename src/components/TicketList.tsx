
import { useState } from "react";
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from "../types/ticket";
import TicketItem from "./TicketItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TicketListProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onAddResponse: (ticketId: string, content: string, isAIGenerated: boolean) => void;
}

export default function TicketList({ tickets, onStatusChange, onAddResponse }: TicketListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredTickets = tickets.filter(ticket => {
    // Apply search filter
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Apply status filter
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    // Apply priority filter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    // Apply category filter
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tickets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setPriorityFilter("all");
            setCategoryFilter("all");
          }}>
            Clear
          </Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {filteredTickets.length} {filteredTickets.length === 1 ? 'Ticket' : 'Tickets'}
        </h2>
        
        {filteredTickets.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No tickets match your filters</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketItem 
              key={ticket.id} 
              ticket={ticket} 
              onStatusChange={onStatusChange}
              onAddResponse={onAddResponse}
            />
          ))
        )}
      </div>
    </div>
  );
}
