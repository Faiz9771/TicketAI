
import { useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, TicketStatus } from "../types/ticket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTickets } from "../utils/mockData";
import TicketForm from "../components/TicketForm";
import TicketList from "../components/TicketList";
import KnowledgeBase from "../components/KnowledgeBase";
import { mockKnowledgeBase } from "../utils/mockData";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Index() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [activeTab, setActiveTab] = useState("create");

  const handleTicketSubmit = (newTicketData: Omit<Ticket, "id" | "status" | "createdAt" | "updatedAt">) => {
    const newTicket: Ticket = {
      ...newTicketData,
      id: `TKT-${1000 + tickets.length + 1}`,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTickets([newTicket, ...tickets]);
    setActiveTab("view");
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
          : ticket
      )
    );
  };
  
  const handleAddResponse = (ticketId: string, content: string, isAIGenerated: boolean) => {
    setTickets(
      tickets.map((ticket) => {
        if (ticket.id === ticketId) {
          const responses = ticket.responses || [];
          return {
            ...ticket,
            responses: [
              ...responses,
              {
                id: `RESP-${Date.now()}`,
                ticketId: ticket.id,
                content,
                createdAt: new Date().toISOString(),
                createdBy: isAIGenerated ? "AI Assistant" : "Support Agent",
                isAIGenerated,
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return ticket;
      })
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Support Ticket System</h1>
          <p className="text-muted-foreground max-w-2xl">
            Submit and manage support tickets efficiently. Get help from our knowledge base or create a new ticket for personalized support.
          </p>
        </div>
        <Button variant="outline" className="hover-scale bg-white/70 dark:bg-gray-800/70" asChild>
          <Link to="/admin">
            <User className="h-4 w-4 mr-2" /> Switch to Employee View
          </Link>
        </Button>
      </header>

      <Card className="mb-8 glass-card animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-gradient">Support Dashboard</CardTitle>
              <CardDescription>
                Submit, view, and manage support requests
              </CardDescription>
            </div>
            <div className="hidden md:flex md:space-x-2">
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                onClick={() => setActiveTab("create")}
                className="hover-scale"
              >
                Submit Ticket
              </Button>
              <Button
                variant={activeTab === "view" ? "default" : "outline"}
                onClick={() => setActiveTab("view")}
                className="hover-scale"
              >
                View Tickets
              </Button>
              <Button
                variant={activeTab === "knowledge" ? "default" : "outline"}
                onClick={() => setActiveTab("knowledge")}
                className="hover-scale"
              >
                Knowledge Base
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="md:hidden mb-6 w-full bg-muted/50">
              <TabsTrigger value="create" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Submit</TabsTrigger>
              <TabsTrigger value="view" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">View</TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Knowledge</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-0">
              <TicketForm onSubmit={handleTicketSubmit} />
            </TabsContent>
            
            <TabsContent value="view" className="mt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Support Tickets</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real app, this would refresh from the server
                        console.log("Refreshing tickets...");
                      }}
                      className="hover-scale bg-white dark:bg-gray-800"
                    >
                      <ChevronsUpDown className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <TicketList 
                  tickets={tickets} 
                  onStatusChange={handleStatusChange}
                  onAddResponse={handleAddResponse}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="knowledge" className="mt-0">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Knowledge Base</h2>
                <p className="text-muted-foreground">
                  Browse our articles to find answers to common questions and issues.
                </p>
                <KnowledgeBase articles={mockKnowledgeBase} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <footer className="text-center text-sm text-muted-foreground">
        <p>Support Ticket System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
