
import { useState } from "react";
import { Ticket, TicketStatus } from "../types/ticket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTickets } from "../utils/mockData";
import TicketForm from "../components/TicketForm";
import TicketList from "../components/TicketList";
import KnowledgeBase from "../components/KnowledgeBase";
import { mockKnowledgeBase } from "../utils/mockData";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
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

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Support Ticket System</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Submit and manage support tickets efficiently. Get help from our knowledge base or create a new ticket for personalized support.
        </p>
      </header>

      <Card className="mb-8">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Support Dashboard</CardTitle>
              <CardDescription>
                Submit, view, and manage support requests
              </CardDescription>
            </div>
            <div className="hidden md:block">
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                onClick={() => setActiveTab("create")}
                className="mr-2"
              >
                Submit Ticket
              </Button>
              <Button
                variant={activeTab === "view" ? "default" : "outline"}
                onClick={() => setActiveTab("view")}
                className="mr-2"
              >
                View Tickets
              </Button>
              <Button
                variant={activeTab === "knowledge" ? "default" : "outline"}
                onClick={() => setActiveTab("knowledge")}
              >
                Knowledge Base
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="md:hidden mb-6 w-full">
              <TabsTrigger value="create" className="flex-1">Submit</TabsTrigger>
              <TabsTrigger value="view" className="flex-1">View</TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1">Knowledge</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-0">
              <TicketForm onSubmit={handleTicketSubmit} />
            </TabsContent>
            
            <TabsContent value="view" className="mt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Support Tickets</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real app, this would refresh from the server
                        console.log("Refreshing tickets...");
                      }}
                    >
                      <ChevronsUpDown className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <TicketList 
                  tickets={tickets} 
                  onStatusChange={handleStatusChange} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="knowledge" className="mt-0">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Knowledge Base</h2>
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
