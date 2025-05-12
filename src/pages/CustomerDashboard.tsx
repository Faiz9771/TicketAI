
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTickets, mockKnowledgeBase } from "../utils/mockData";
import TicketForm from "../components/TicketForm";
import { Ticket } from "../types/ticket";
import KnowledgeBase from "../components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, MessageSquare, BookOpen, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerTicketList from "../components/CustomerTicketList";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    
    toast({
      title: "Ticket submitted successfully",
      description: `Ticket #${newTicket.id} has been created and is now pending review.`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Customer Support Portal</h1>
          <p className="text-muted-foreground">Submit and track your support requests</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="hover-scale bg-white/70 dark:bg-gray-800/70">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <div className="flex items-center mb-6 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">Logged in as <span className="text-blue-600 dark:text-blue-400">John Doe</span></p>
          <p className="text-xs text-muted-foreground">john@example.com</p>
        </div>
      </div>

      <Card className="mb-8 glass-card">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b">
          <CardTitle className="text-gradient">Support Dashboard</CardTitle>
          <CardDescription>
            Submit new tickets or check the status of your existing tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full bg-muted/50">
              <TabsTrigger value="create" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Submit a Ticket
              </TabsTrigger>
              <TabsTrigger value="mytickets" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <MessageSquare className="h-4 w-4 mr-2" />
                My Tickets
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-0">
              <TicketForm onSubmit={handleTicketSubmit} />
            </TabsContent>
            
            <TabsContent value="mytickets" className="mt-0">
              <CustomerTicketList tickets={tickets} />
            </TabsContent>
            
            <TabsContent value="knowledge" className="mt-0">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gradient">Knowledge Base</h2>
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
