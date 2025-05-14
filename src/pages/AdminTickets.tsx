import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LayoutDashboard, TicketIcon, Users, Settings, LogOut, User, RefreshCw, Filter, BarChart3, HelpCircle, Send, Sparkles } from 'lucide-react';
import { ticketAPI } from '../lib/api';
import { TicketStatus } from '../types/ticket';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  customerName: string;
  responses?: TicketResponse[];
}

interface TicketResponse {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isAIGenerated: boolean;
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const ticketsData = await ticketAPI.getAll();
      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setLoading(true);
      const response = await ticketAPI.update(id, { status: status as TicketStatus });
      
      if (status === 'resolved') {
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== id));
      } else {
        await fetchTickets();
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      toast.error('Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  const generateAIReply = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      toast.error('Ticket not found');
      return;
    }

    setGeneratingAI(true);
    try {
      // Call the AI model API to generate a response
      const response = await fetch('/api/company-data/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          title: ticket.title,
          description: ticket.description,
          customerName: ticket.customerName,
          status: ticket.status,
          priority: ticket.priority
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setReplyContent(data.reply);
      toast.success('AI reply generated');
    } catch (error) {
      console.error('Failed to generate AI reply:', error);
      toast.error('Failed to generate AI reply: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setReplying(true);
    try {
      await ticketAPI.addComment(ticketId, replyContent, 'admin');
      toast.success('Reply sent successfully');
      setReplyContent('');
      await fetchTickets(); // Refresh to get the new response
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus && filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (filterPriority && filterPriority !== "all" && ticket.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="h-full w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
          <div className="p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Support Dashboard</p>
          </div>
        
          <div className="px-3 flex-1 space-y-1">
            <a 
              href="/admin" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <LayoutDashboard size={20} />
              </div>
              <span>Dashboard</span>
            </a>
            <a 
              href="/admin/tickets" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100 font-medium"
            >
              <div className="w-6 h-6 text-indigo-600 dark:text-indigo-400">
                <TicketIcon size={20} />
              </div>
              <span>Tickets</span>
            </a>
            <a 
              href="/admin/customers" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <Users size={20} />
              </div>
              <span>Customers</span>
            </a>
          </div>
        
          <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
            <a 
              href="/admin/settings" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <Settings size={20} />
              </div>
              <span>Settings</span>
            </a>
            <a 
              href="/logout" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <LogOut size={20} />
              </div>
              <span>Logout</span>
            </a>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ticket Management</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTickets}
                disabled={loading}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ticket List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTickets.map(ticket => (
                    <div key={ticket.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{ticket.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">From: {ticket.customerName}</p>
                        </div>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleStatusChange(ticket.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{ticket.description}</p>
                      
                      {/* Responses */}
                      {ticket.responses && ticket.responses.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {ticket.responses.map((response) => (
                            <div key={response.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {response.createdBy}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(response.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300">{response.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reply Form */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => generateAIReply(ticket.id)}
                            disabled={generatingAI}
                            variant="outline"
                            className="border-indigo-300 hover:bg-indigo-50 text-indigo-600 dark:border-indigo-700 dark:hover:bg-indigo-900/20 dark:text-indigo-400"
                          >
                            {generatingAI ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Generate with AI
                          </Button>
                          <Button
                            onClick={() => handleReply(ticket.id)}
                            disabled={replying || !replyContent.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {replying ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Reply
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        <div>Priority: {ticket.priority}</div>
                        <div>Created: {new Date(ticket.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 