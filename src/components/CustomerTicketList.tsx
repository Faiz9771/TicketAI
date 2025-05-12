
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
    high: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border-red-200 dark:border-red-800/40",
    medium: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    low: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border-green-200 dark:border-green-800/40",
  };

  const statusClasses = {
    "open": "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    "in-progress": "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
    "resolved": "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-800/40",
  };

  const toggleExpand = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
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
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your tickets..."
          className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full w-8 h-8 inline-flex items-center justify-center mr-2 text-sm">
            {filteredTickets.length}
          </span>
          <span>
            {filteredTickets.length === 1 ? 'Ticket' : 'Tickets'}
          </span>
        </h2>
        
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700">
            <p className="text-muted-foreground">You haven't submitted any tickets yet</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className={`mb-5 border-l-4 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-900/80 ${borderColors[ticket.priority]}`}>
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
              
              <CardContent>
                <div className="flex flex-col space-y-3 pt-2">
                  <div className={`${expandedTicket === ticket.id ? "" : "line-clamp-2"} bg-gray-50/70 dark:bg-gray-800/30 p-3 rounded-md border border-gray-100 dark:border-gray-800/50`}>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{ticket.description}</p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleExpand(ticket.id)}
                    className="w-fit text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {expandedTicket === ticket.id ? "Show Less" : "Show More"}
                  </Button>

                  {expandedTicket === ticket.id && ticket.responses && ticket.responses.length > 0 && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Responses:</h4>
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
