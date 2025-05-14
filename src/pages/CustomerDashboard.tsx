import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TicketForm from "../components/TicketForm";
import { Ticket } from "../types/ticket";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, User, HelpCircle, ExternalLink, Plus, List, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerTicketList from "../components/CustomerTicketList";
import { useToast } from "@/hooks/use-toast";
import { ticketAPI, mapBackendTicketToFrontend } from "../lib/api";
import Navigation from "../components/Navigation";

export default function CustomerDashboard() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("create");
  
  // Mock user data - in a real app, this would come from authentication
  const currentUser = {
    email: "john@example.com",
    name: "John Doe"
  };
  
  // Fetch tickets from the API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketAPI.getAll({ creatorId: currentUser.email });
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response format from server');
      }
      
      const formattedTickets = response.map(ticket => mapBackendTicketToFrontend(ticket));
      
      // Filter out resolved tickets
      const activeTickets = formattedTickets.filter(ticket => ticket.status !== 'resolved');
      setTickets(activeTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load tickets on component mount and set up auto-refresh
  useEffect(() => {
    fetchTickets();
    
    // Auto-refresh tickets every 30 seconds
    const intervalId = setInterval(() => {
      fetchTickets();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle ticket submission
  const handleTicketSubmit = async (ticketData: any) => {
    try {
      // Add user information to the ticket data
      const fullTicketData = {
        ...ticketData,
        userEmail: currentUser.email,
        userName: currentUser.name,
      };
      
      await ticketAPI.create(fullTicketData);
      
      toast({
        title: "Ticket Submitted",
        description: "Your support ticket has been submitted successfully.",
      });
      
      // Switch to view tickets tab
      setActiveTab("view");
      
      // Refresh tickets
      fetchTickets();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast({
        title: "Error Submitting Ticket",
        description: "There was an error submitting your ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navigation />
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Customer Support Portal</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {currentUser.name}
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
            <p className="text-gray-600">Submit and track your support tickets</p>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus size={16} />
                Create New Ticket
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <List size={16} />
                View My Tickets
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
            
                      <CardDescription>
                        Please provide details about your issue and we'll get back to you as soon as possible.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TicketForm onSubmit={handleTicketSubmit} currentUser={currentUser} />
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Help Resources</CardTitle>
                      <CardDescription>
                        Check out these resources before submitting a ticket.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <HelpCircle size={16} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Frequently Asked Questions</h3>
                          <p className="text-sm text-gray-500 mt-1">Find answers to common questions.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <HelpCircle size={16} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Knowledge Base</h3>
                          <p className="text-sm text-gray-500 mt-1">Browse our documentation for detailed guides.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <HelpCircle size={16} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Video Tutorials</h3>
                          <p className="text-sm text-gray-500 mt-1">Watch step-by-step guides for common tasks.</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        View All Resources
                        <ArrowRight size={16} />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="view">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Support Tickets</CardTitle>
                    <CardDescription>
                      View and manage your existing support tickets.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTickets}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                      <span className="ml-2">Loading your tickets...</span>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-300" />
                      <h3 className="mt-4 text-lg font-medium">No tickets found</h3>
                      <p className="mt-1 text-gray-500">You haven't submitted any support tickets yet.</p>
                      <Button
                        className="mt-4"
                        onClick={() => setActiveTab("create")}
                      >
                        Create Your First Ticket
                      </Button>
                    </div>
                  ) : (
                    <CustomerTicketList tickets={tickets} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>TicketAI Support System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
