
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
import TicketResponseForm from "./TicketResponseForm";

interface TicketItemProps {
  ticket: Ticket;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onAddResponse: (ticketId: string, content: string, isAIGenerated: boolean) => void;
}

export default function TicketItem({ ticket, onStatusChange, onAddResponse }: TicketItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(ticket.id, newStatus as TicketStatus);
    toast(`Ticket ${ticket.id} status updated to ${newStatus}`);
  };

  const priorityClasses = {
    high: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border-red-200 dark:border-red-800/40",
    medium: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    low: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border-green-200 dark:border-green-800/40",
  };

  const statusClasses = {
    "open": "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    "in-progress": "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
    "resolved": "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-800/40",
  };

  const categoryClasses = {
    "technical": "bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
    "billing": "bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 dark:from-cyan-900/40 dark:to-cyan-800/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
    "account": "bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 dark:from-teal-900/40 dark:to-teal-800/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
    "general": "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-800/40",
  };

  const formattedDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const borderColors = {
    high: "border-l-red-500",
    medium: "border-l-amber-500",
    low: "border-l-green-500"
  };

  return (
    <Card className={`mb-5 border-l-4 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-900/80 ${borderColors[ticket.priority]}`}>
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{ticket.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center">
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs mr-1">{ticket.id}</span> 
              <span className="mx-1">•</span> 
              {formattedDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={`px-2.5 py-1 border ${priorityClasses[ticket.priority]}`}>
              {ticket.priority}
            </Badge>
            <Badge className={`px-2.5 py-1 border ${statusClasses[ticket.status]}`}>
              {ticket.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`pt-4 ${isExpanded ? "" : ""}`}>
        <div className="flex flex-col space-y-3">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-full px-3 py-1">
              <User className="h-3 w-3 mr-1.5" />
              <span>{ticket.userName}</span>
            </div>
            
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/60 rounded-full px-3 py-1">
              <Tag className="h-3 w-3 mr-1.5" />
              <span>{ticket.category}</span>
            </div>
          </div>
          
          <div className={`mt-3 ${isExpanded ? "" : "line-clamp-2"} bg-gray-50/70 dark:bg-gray-800/30 p-3 rounded-md border border-gray-100 dark:border-gray-800/50`}>
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{ticket.description}</p>
          </div>

          {isExpanded && ticket.responses && ticket.responses.length > 0 && (
            <div className="mt-6 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Responses
              </h4>
              {ticket.responses.map((response) => (
                <div key={response.id} className={`p-4 rounded-md ${response.isAIGenerated ? 'bg-gradient-to-r from-purple-50/70 to-indigo-50/70 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-900/30' : 'bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/30'}`}>
                  <p className="text-sm mb-2 whitespace-pre-line">{response.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <span className="font-medium">{response.createdBy}</span>
                      <span className="mx-1.5">•</span>
                      <span>{formattedDate(response.createdAt)}</span>
                    </div>
                    {response.isAIGenerated && (
                      <Badge variant="outline" className="ml-2 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">AI Generated</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isExpanded && showResponseForm && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <TicketResponseForm 
                ticketId={ticket.id}
                ticketContent={ticket.description}
                onAddResponse={onAddResponse}
              />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        
        <div className="flex items-center space-x-2 flex-wrap">
          <Select defaultValue={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          {isExpanded ? (
            <Button 
              size="sm" 
              variant={showResponseForm ? "default" : "outline"}
              onClick={() => setShowResponseForm(!showResponseForm)}
              className={showResponseForm ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "border-gray-200 dark:border-gray-700"}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> 
              {showResponseForm ? "Cancel Reply" : "Reply"}
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsExpanded(true);
                setShowResponseForm(true);
              }}
              className="border-gray-200 dark:border-gray-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Reply
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
