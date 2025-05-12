
import { useState } from "react";
import { Ticket } from "../types/ticket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CustomerTicketListProps {
  tickets: Ticket[];
}

export default function CustomerTicketList({ tickets }: CustomerTicketListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const toggleExpand = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  const formattedDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your tickets..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {filteredTickets.length} {filteredTickets.length === 1 ? 'Ticket' : 'Tickets'}
        </h2>
        
        {filteredTickets.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">You haven't submitted any tickets yet</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="mb-4 border-l-4" style={{ 
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
              
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <p className={expandedTicket === ticket.id ? "" : "truncate"}>{ticket.description}</p>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleExpand(ticket.id)}
                    className="w-fit"
                  >
                    {expandedTicket === ticket.id ? "Show Less" : "Show More"}
                  </Button>

                  {expandedTicket === ticket.id && ticket.responses && ticket.responses.length > 0 && (
                    <div className="mt-4 space-y-4">
                      <h4 className="text-sm font-semibold">Responses:</h4>
                      {ticket.responses.map((response) => (
                        <div key={response.id} className="bg-muted p-3 rounded-md">
                          <p className="text-sm mb-1">{response.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {response.createdBy} • {formattedDate(response.createdAt)}
                            {response.isAIGenerated && (
                              <Badge variant="outline" className="ml-2 text-xs">AI Generated</Badge>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
