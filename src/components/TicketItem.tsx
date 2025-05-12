
import { useState } from "react";
import { Ticket, TicketStatus } from "../types/ticket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TicketItemProps {
  ticket: Ticket;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export default function TicketItem({ ticket, onStatusChange }: TicketItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(ticket.id, newStatus as TicketStatus);
    toast(`Ticket ${ticket.id} status updated to ${newStatus}`);
  };

  const priorityClasses = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  const statusClasses = {
    "open": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "resolved": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const categoryClasses = {
    "technical": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    "billing": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    "account": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    "general": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const formattedDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  return (
    <Card className="mb-4 border-l-4" style={{ 
      borderLeftColor: 
        ticket.priority === "high" ? "rgb(239, 68, 68)" : 
        ticket.priority === "medium" ? "rgb(245, 158, 11)" : 
        "rgb(34, 197, 94)" 
    }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">{ticket.title}</h3>
            <p className="text-sm text-muted-foreground">
              {ticket.id} • {formattedDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={priorityClasses[ticket.priority]}>
              {ticket.priority}
            </Badge>
            <Badge className={statusClasses[ticket.status]}>
              {ticket.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={isExpanded ? "" : "truncate"}>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span>{ticket.userName}</span>
            <span className="mx-2">•</span>
            <span>{ticket.userEmail}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Tag className="h-4 w-4 mr-1" />
            <Badge className={categoryClasses[ticket.category]} variant="outline">
              {ticket.category}
            </Badge>
          </div>
          
          <p className="mt-2">{ticket.description}</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        
        <div className="flex items-center space-x-2">
          <Select defaultValue={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          <Button size="sm" variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" /> Reply
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
