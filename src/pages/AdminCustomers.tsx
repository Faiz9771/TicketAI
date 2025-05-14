import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutDashboard, TicketIcon, Users, Settings, LogOut, User, RefreshCw, Search } from 'lucide-react';
import { userAPI } from '../lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  ticketCount: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const customersData = await userAPI.getAll();
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:text-indigo-900 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <div className="w-6 h-6 text-gray-500 dark:text-gray-500">
                <TicketIcon size={20} />
              </div>
              <span>Tickets</span>
            </a>
            <a 
              href="/admin/customers" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100 font-medium"
            >
              <div className="w-6 h-6 text-indigo-600 dark:text-indigo-400">
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
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Customer Management</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCustomers}
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
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map(customer => (
                    <div key={customer.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{customer.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.ticketCount} Tickets
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Joined {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </div>
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