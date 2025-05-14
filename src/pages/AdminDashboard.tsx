import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, TicketIcon, Users, Settings, LogOut, User, RefreshCw } from 'lucide-react';
import { ticketAPI, userAPI } from '../lib/api';
import { Link } from 'react-router-dom';

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
}

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  ticketCount: number;
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsData, customersData] = await Promise.all([
        ticketAPI.getAll(),
        userAPI.getAll()
      ]);
      setTickets(ticketsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setTickets([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate dashboard stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const totalCustomers = customers.length;

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
            <Link 
              to="/admin" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100 font-medium"
            >
              <div className="w-6 h-6 text-indigo-600 dark:text-indigo-400">
                <LayoutDashboard size={20} />
              </div>
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/admin/tickets" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <TicketIcon size={20} />
              </div>
              <span>Tickets</span>
            </Link>
            <Link 
              to="/admin/customers" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <Users size={20} />
              </div>
              <span>Customers</span>
            </Link>
          </div>
        
          <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
            <Link 
              to="/admin/settings" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <Settings size={20} />
              </div>
              <span>Settings</span>
            </Link>
            <Link 
              to="/logout" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <LogOut size={20} />
              </div>
              <span>Logout</span>
            </Link>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Dashboard Overview</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
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
              {/* Dashboard Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <TicketIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{openTickets}</div>
                    <p className="text-xs text-muted-foreground">
                      Active support requests
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <TicketIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inProgressTickets}</div>
                    <p className="text-xs text-muted-foreground">
                      Being worked on
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <TicketIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resolvedTickets}</div>
                    <p className="text-xs text-muted-foreground">
                      Completed tickets
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCustomers}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered users
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tickets.slice(0, 5).map(ticket => (
                        <div key={ticket.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground">
                              From: {ticket.customerName}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customers.slice(0, 5).map(customer => (
                        <div key={customer.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {customer.email}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

