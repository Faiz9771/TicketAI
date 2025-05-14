import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutDashboard, TicketIcon, Users, Settings, LogOut, Upload, Database, Bot, RefreshCw, Trash2, BrainCircuit, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface CompanyData {
  id: string;
  name: string;
  description: string;
  content: string;
  type: 'faq' | 'documentation' | 'policy';
  createdAt: string;
}

interface ModelConfig {
  id: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  lastTrainedAt: string | null;
  trainingStatus: 'not_trained' | 'training' | 'trained' | 'failed';
  trainingProgress: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [newData, setNewData] = useState<Omit<CompanyData, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    content: '',
    type: 'faq'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [directInput, setDirectInput] = useState<{
    name: string;
    description: string;
    content: string;
    type: 'faq' | 'documentation' | 'policy';
  }>({
    name: '',
    description: '',
    content: '',
    type: 'documentation'
  });
  const [trainingStatusPolling, setTrainingStatusPolling] = useState<NodeJS.Timeout | null>(null);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/company-data');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      setCompanyData(data);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to fetch company data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchModelConfig = async () => {
    try {
      const response = await fetch('/api/company-data/model-config');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      setModelConfig(data);
    } catch (error) {
      console.error('Error fetching model configuration:', error);
      toast.error('Failed to fetch model configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch('/api/company-data/training-status');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.status === 'training') {
        setIsTraining(true);
      } else {
        setIsTraining(false);
        // Clear the polling interval if training is complete or failed
        if (trainingStatusPolling) {
          clearInterval(trainingStatusPolling);
          setTrainingStatusPolling(null);
        }
      }
      
      // Update the model config with the latest training status
      setModelConfig(prev => prev ? { ...prev, trainingStatus: data.status, trainingProgress: data.progress } : null);
      
      // Show toast for completed training
      if (data.status === 'trained' && modelConfig?.trainingStatus === 'training') {
        toast.success('Model training completed successfully!');
      } else if (data.status === 'failed' && modelConfig?.trainingStatus === 'training') {
        toast.error('Model training failed. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching training status:', error);
      // Don't show toast for this one as it's polled frequently
    }
  };

  const startModelTraining = async () => {
    try {
      setIsTraining(true);
      const response = await fetch('/api/company-data/train-model', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start model training');
      }
      
      toast.success('Model training started');
      
      // Start polling for training status
      const interval = setInterval(fetchTrainingStatus, 2000);
      setTrainingStatusPolling(interval);
    } catch (error) {
      console.error('Error starting model training:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start model training');
      setIsTraining(false);
    }
  };

  const updateModelSettings = async (settings: { modelName?: string; temperature?: number; maxTokens?: number }) => {
    try {
      const response = await fetch('/api/company-data/update-model-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update model settings');
      }
      
      setModelConfig(data.modelConfig);
      toast.success('Model settings updated successfully');
    } catch (error) {
      console.error('Error updating model settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update model settings');
    }
  };

  const handleDirectInputSubmit = async () => {
    try {
      if (!directInput.name || !directInput.content) {
        toast.error('Please provide a name and content');
        return;
      }
      
      const response = await fetch('/api/company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(directInput),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add training data');
      }
      
      // Reset form
      setDirectInput({
        name: '',
        description: '',
        content: '',
        type: 'documentation'
      });
      
      // Refresh company data
      fetchCompanyData();
      
      toast.success('Training data added successfully');
    } catch (error) {
      console.error('Error adding training data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add training data');
    }
  };

  const clearAllData = async () => {
    try {
      setIsClearingData(true);
      
      const response = await fetch('/api/company-data/clear-data', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear data');
      }
      
      // Refresh company data and model config
      fetchCompanyData();
      fetchModelConfig();
      
      toast.success('All training data has been cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear data');
    } finally {
      setIsClearingData(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchModelConfig();
    fetchTrainingStatus();
    
    // Clean up any polling on unmount
    return () => {
      if (trainingStatusPolling) {
        clearInterval(trainingStatusPolling);
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/company-data/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }
      
      // Refresh the company data list
      await fetchCompanyData();
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleAddData = async () => {
    if (!newData.name || !newData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement adding new company data
      // const response = await fetch('/api/company-data', {
      //   method: 'POST',
      //   body: JSON.stringify(newData)
      // });
      
      setCompanyData(prev => [...prev, {
        id: Date.now().toString(),
        ...newData,
        createdAt: new Date().toISOString()
      }]);
      
      setNewData({
        name: '',
        description: '',
        content: '',
        type: 'faq'
      });
      
      toast.success('Company data added successfully');
    } catch (error) {
      console.error('Error adding company data:', error);
      toast.error('Failed to add company data');
    }
  };

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
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100 font-medium"
            >
              <div className="w-6 h-6 text-indigo-600 dark:text-indigo-400">
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
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Assistant Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="settings">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="settings">Model Settings</TabsTrigger>
                      <TabsTrigger value="training">Training</TabsTrigger>
                      <TabsTrigger value="data">Training Data</TabsTrigger>
                    </TabsList>
                    
                    {/* Model Settings Tab */}
                    <TabsContent value="settings" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Llama Model Settings</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="model-size">Model Size</Label>
                            <Select 
                              value={modelConfig?.modelName || 'llama-2-7b-chat'}
                              onValueChange={(value) => updateModelSettings({ modelName: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select model size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="llama-2-7b-chat">7B Parameters</SelectItem>
                                <SelectItem value="llama-2-13b-chat">13B Parameters</SelectItem>
                                <SelectItem value="llama-2-70b-chat">70B Parameters</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="temperature">Temperature</Label>
                            <Input
                              id="temperature"
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={modelConfig?.temperature || 0.7}
                              onChange={(e) => updateModelSettings({ temperature: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="max-tokens">Max Tokens</Label>
                          <Input
                            id="max-tokens"
                            type="number"
                            min="512"
                            max="8192"
                            step="128"
                            value={modelConfig?.maxTokens || 2048}
                            onChange={(e) => updateModelSettings({ maxTokens: parseInt(e.target.value) })}
                          />
                          <p className="text-xs text-gray-500 mt-1">Controls the context window size for the model</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Training Tab */}
                    <TabsContent value="training" className="space-y-4 pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">Model Training</h3>
                            <p className="text-sm text-gray-500">Train the AI assistant on your company data</p>
                          </div>
                          <Button 
                            onClick={startModelTraining} 
                            disabled={isTraining || !companyData.length}
                            className="flex items-center gap-2"
                          >
                            {isTraining ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Training...
                              </>
                            ) : (
                              <>
                                <BrainCircuit className="h-4 w-4" />
                                Train Model
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Training Status */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Training Status</Label>
                            <span className="text-sm">
                              {modelConfig?.trainingStatus === 'not_trained' && 'Not Trained'}
                              {modelConfig?.trainingStatus === 'training' && 'Training in Progress'}
                              {modelConfig?.trainingStatus === 'trained' && 'Trained'}
                              {modelConfig?.trainingStatus === 'failed' && 'Training Failed'}
                            </span>
                          </div>
                          <Progress value={modelConfig?.trainingProgress || 0} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0%</span>
                            <span>{modelConfig?.trainingProgress || 0}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        
                        {/* Last Trained */}
                        {modelConfig?.lastTrainedAt && (
                          <div className="text-sm text-gray-500">
                            Last trained: {new Date(modelConfig.lastTrainedAt).toLocaleString()}
                          </div>
                        )}
                        
                        {/* Training Info */}
                        <Alert>
                          <BrainCircuit className="h-4 w-4" />
                          <AlertTitle>Training Information</AlertTitle>
                          <AlertDescription>
                            Training the model will fine-tune it on your company data to provide more accurate and relevant responses to customer queries.
                            Make sure you have uploaded or added your company data before training.
                          </AlertDescription>
                        </Alert>
                        
                        {/* Clear Data Button */}
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Clear All Training Data</h3>
                              <p className="text-sm text-gray-500">This will permanently delete all company data used for training</p>
                            </div>
                            <Button 
                              variant="destructive" 
                              onClick={clearAllData}
                              disabled={isClearingData || !companyData.length}
                              className="flex items-center gap-2"
                            >
                              {isClearingData ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Clear Data
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Training Data Tab */}
                    <TabsContent value="data" className="space-y-4 pt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Add Training Data</h3>
                          <p className="text-sm text-gray-500">Directly input text data for training the AI assistant</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="data-name">Name</Label>
                            <Input
                              id="data-name"
                              value={directInput.name}
                              onChange={(e) => setDirectInput(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Product FAQ, Return Policy"
                            />
                          </div>
                          <div>
                            <Label htmlFor="data-description">Description (Optional)</Label>
                            <Input
                              id="data-description"
                              value={directInput.description}
                              onChange={(e) => setDirectInput(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of this data"
                            />
                          </div>
                          <div>
                            <Label htmlFor="data-type">Type</Label>
                            <Select
                              value={directInput.type}
                              onValueChange={(value: 'faq' | 'documentation' | 'policy') => 
                                setDirectInput(prev => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="faq">FAQ</SelectItem>
                                <SelectItem value="documentation">Documentation</SelectItem>
                                <SelectItem value="policy">Policy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="data-content">Content</Label>
                            <Textarea
                              id="data-content"
                              value={directInput.content}
                              onChange={(e) => setDirectInput(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="Enter the content that will be used for AI responses"
                              rows={8}
                            />
                          </div>
                          <Button onClick={handleDirectInputSubmit}>Add Training Data</Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Company Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Company Knowledge Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Existing Data List */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Existing Data</h3>
                    <div className="space-y-4">
                      {companyData.map(data => (
                        <Card key={data.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{data.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {data.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="capitalize">{data.type}</span>
                              <span>•</span>
                              <span>Added {new Date(data.createdAt).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your email" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <Button>Change Password</Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 