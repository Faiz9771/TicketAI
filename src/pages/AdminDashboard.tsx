
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
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text pb-2">Admin Support Dashboard</h1>
        <p className="text-muted-foreground text-lg">Manage and respond to customer support tickets</p>
        <div className="flex justify-center mt-4">
          <Button variant="outline" className="hover-scale shadow-md bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-purple-800" asChild>
            <Link to="/">
              <User className="h-4 w-4 mr-2" /> Switch to Customer View
            </Link>
          </Button>
        </div>
      </header>

      <Card className="mb-8 shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/80 dark:from-gray-900/90 dark:to-purple-950/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-purple-100 dark:border-purple-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 text-transparent bg-clip-text">Support Management</CardTitle>
              <CardDescription className="text-purple-600/70 dark:text-purple-300/70">
                View and manage all customer support requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none bg-purple-50/80 dark:bg-purple-950/30 p-0">
              <TabsTrigger value="tickets" className="flex-1 py-4 rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-inner">
                Manage Tickets
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-1 py-4 rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-inner">
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 py-4 rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-inner">
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="tickets" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-700 to-pink-700 text-transparent bg-clip-text">Support Tickets</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real app, this would refresh from the server
                        console.log("Refreshing tickets...");
                      }}
                      className="hover-scale shadow-md bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-purple-800"
                    >
                      <ChevronsUpDown className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  <TicketList 
                    tickets={tickets} 
                    onStatusChange={handleStatusChange}
                    onAddResponse={handleAddResponse} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="knowledge" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-700 to-pink-700 text-transparent bg-clip-text">Knowledge Base Management</h2>
                  <p className="text-muted-foreground">
                    Create and manage articles to help customers find answers quickly.
                  </p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md">Add New Article</Button>
                  <KnowledgeBase articles={mockKnowledgeBase} />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 animate-fade-in">
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-700 to-pink-700 text-transparent bg-clip-text">Support Analytics</h2>
                  <p className="text-muted-foreground">
                    Monitor and analyze support performance metrics.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-purple-700 dark:text-purple-400">Total Tickets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{tickets.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-purple-700 dark:text-purple-400">Open Tickets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{tickets.filter(t => t.status === "open").length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-purple-700 dark:text-purple-400">Resolved Tickets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{tickets.filter(t => t.status === "resolved").length}</p>
                      </CardContent>
                    </Card>
                  </div>
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
