
import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTickets, mockKnowledgeBase } from "../utils/mockData";
import TicketList from "../components/TicketList";
import KnowledgeBase from "../components/KnowledgeBase";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, TicketStatus } from "../types/ticket";
import TicketResponseForm from "../components/TicketResponseForm";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [activeTab, setActiveTab] = useState("tickets");

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
          : ticket
      )
    );
  };

  const handleAddResponse = (ticketId: string, responseContent: string, isAIGenerated: boolean = false) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId
          ? { 
              ...ticket, 
              updatedAt: new Date().toISOString(),
              responses: [
                ...(ticket.responses || []),
                {
                  id: `RESP-${Date.now()}`,
                  ticketId,
                  content: responseContent,
                  createdAt: new Date().toISOString(),
                  createdBy: "Agent",
                  isAIGenerated
                }
              ]
            }
          : ticket
      )
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Admin Support Dashboard</h1>
          <p className="text-muted-foreground">Manage and respond to customer support tickets</p>
        </div>
        <Button variant="outline" className="hover-scale bg-white/70 dark:bg-gray-800/70" asChild>
          <Link to="/">
            <User className="h-4 w-4 mr-2" /> Switch to Customer View
          </Link>
        </Button>
      </header>

      <Card className="mb-8 glass-card">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-gradient">Support Management</CardTitle>
              <CardDescription>
                View and manage all customer support requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full bg-muted/50">
              <TabsTrigger value="tickets" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Manage Tickets
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tickets" className="mt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gradient">Support Tickets</h2>
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
                <h2 className="text-2xl font-semibold">Knowledge Base Management</h2>
                <p className="text-muted-foreground">
                  Create and manage articles to help customers find answers quickly.
                </p>
                <Button className="mb-4">Add New Article</Button>
                <KnowledgeBase articles={mockKnowledgeBase} />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Support Analytics</h2>
                <p className="text-muted-foreground">
                  Monitor and analyze support performance metrics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{tickets.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Open Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{tickets.filter(t => t.status === "open").length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resolved Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{tickets.filter(t => t.status === "resolved").length}</p>
                    </CardContent>
                  </Card>
                </div>
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
