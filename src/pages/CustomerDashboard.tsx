
import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTickets, mockKnowledgeBase } from "../utils/mockData";
import TicketForm from "../components/TicketForm";
import { Ticket } from "../types/ticket";
import KnowledgeBase from "../components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, BookOpen, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerTicketList from "../components/CustomerTicketList";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text pb-2">Customer Support Portal</h1>
        <p className="text-muted-foreground text-lg">Submit and track your support requests</p>
        <div className="flex justify-center mt-4">
          <Button variant="outline" className="hover-scale shadow-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800" asChild>
            <Link to="/admin">
              <User className="h-4 w-4 mr-2" /> Switch to Employee View
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex items-center mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-800">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full shadow-inner">
          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">Logged in as <span className="text-indigo-600 dark:text-indigo-400 font-semibold">John Doe</span></p>
          <p className="text-xs text-muted-foreground">john@example.com</p>
        </div>
      </div>

      <Card className="mb-8 shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50/80 dark:from-gray-900/90 dark:to-indigo-950/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b border-indigo-100 dark:border-indigo-800">
          <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 text-transparent bg-clip-text">Support Dashboard</CardTitle>
          <CardDescription className="text-indigo-600/70 dark:text-indigo-300/70">
            Submit new tickets or check the status of your existing tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none bg-indigo-50/80 dark:bg-indigo-950/30 p-0">
              <TabsTrigger value="create" className="flex-1 py-4 rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-inner">
                <FileText className="h-4 w-4 mr-2" />
                Submit a Ticket
              </TabsTrigger>
              <TabsTrigger value="mytickets" className="flex-1 py-4 rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-inner">
                <MessageSquare className="h-4 w-4 mr-2" />
                My Tickets
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1 py-4 rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-inner">
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="create" className="mt-0 animate-fade-in">
                <TicketForm onSubmit={handleTicketSubmit} />
              </TabsContent>
              
              <TabsContent value="mytickets" className="mt-0 animate-fade-in">
                <CustomerTicketList tickets={tickets} />
              </TabsContent>
              
              <TabsContent value="knowledge" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-700 to-purple-700 text-transparent bg-clip-text">Knowledge Base</h2>
                  <p className="text-muted-foreground">
                    Browse our articles to find answers to common questions and issues.
                  </p>
                  <KnowledgeBase articles={mockKnowledgeBase} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <footer className="text-center text-sm text-muted-foreground">
        <p>Support Ticket System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
