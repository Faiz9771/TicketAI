
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTickets, mockKnowledgeBase } from "../utils/mockData";
import TicketForm from "../components/TicketForm";
import { Ticket } from "../types/ticket";
import KnowledgeBase from "../components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerTicketList from "../components/CustomerTicketList";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>(
    // Filter mock tickets to only show those belonging to this customer
    mockTickets.filter((ticket) => ticket.userEmail === "john@example.com")
  );
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
    setActiveTab("mytickets");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Support Portal</h1>
          <p className="text-muted-foreground">Submit and track your support requests</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <Card className="mb-8">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle>Support Dashboard</CardTitle>
          <CardDescription>
            Submit new tickets or check the status of your existing tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="create" className="flex-1">Submit a Ticket</TabsTrigger>
              <TabsTrigger value="mytickets" className="flex-1">My Tickets</TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1">Knowledge Base</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-0">
              <TicketForm onSubmit={handleTicketSubmit} />
            </TabsContent>
            
            <TabsContent value="mytickets" className="mt-0">
              <CustomerTicketList tickets={tickets} />
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
