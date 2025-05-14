import { Ticket, TicketResponse } from '../types/ticket';

// Using Vite's proxy, we can just use relative paths
const API_URL = '/api';

// For debugging
console.log('API_URL configured as:', API_URL);

// Maximum number of retries for failed requests
const MAX_RETRIES = 2;

// Generic fetch function with error handling and retry logic
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  try {
    console.log(`API Request (attempt ${retryCount + 1}): ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('Request body:', options.body);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Log response status
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorData: any = {};
      
      try {
        errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        console.error('Error parsing error response:', e);
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      
      console.error(`API request failed: ${errorMessage}`);
      
      // Retry logic for certain status codes (5xx server errors or network issues)
      if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 0)) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
        // Exponential backoff: wait longer between each retry
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchAPI<T>(endpoint, options, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }
    
    // For successful responses, try to parse JSON
    try {
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (e) {
      console.error('Error parsing successful response:', e);
      // If we can't parse JSON but the request was successful, return an empty object
      return {} as T;
    }
  } catch (error) {
    console.error('API request failed:', error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log(`Network error, retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchAPI<T>(endpoint, options, retryCount + 1);
    }
    
    throw error;
  }
}

// User related API calls
export const userAPI = {
  getAll: () => fetchAPI<any[]>('/users'),
  getById: (id: string) => fetchAPI<any>(`/users/${id}`),
  create: (userData: any) => fetchAPI<any>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// Ticket related API calls
export const ticketAPI = {
  getAll: (filters?: Record<string, string>) => {
    const queryParams = filters 
      ? `?${new URLSearchParams(filters).toString()}` 
      : '';
    console.log(`Fetching tickets with params: ${queryParams}`);
    // Make sure we're using the correct API endpoint
    return fetchAPI<Ticket[]>(`/tickets${queryParams}`).catch(error => {
      console.error('Error in getAll tickets:', error);
      // Return an empty array instead of throwing to prevent UI crashes
      return [];
    });
  },
  
  getById: (id: string) => fetchAPI<Ticket>(`/tickets/${id}`),
  
  create: async (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    // First, ensure we have a valid category
    let categoryId;
    try {
      // Get all categories
      const categories = await categoryAPI.getAll();
      // Find a category that matches or use the first one
      const category = categories.find(c => c.name.toLowerCase() === ticketData.category) || categories[0];
      categoryId = category?.id;
      
      if (!categoryId) {
        // If no categories exist, create one
        const newCategory = await categoryAPI.create({
          name: ticketData.category.charAt(0).toUpperCase() + ticketData.category.slice(1),
          description: `Category for ${ticketData.category} tickets`
        });
        categoryId = newCategory.id;
      }
    } catch (error) {
      console.error('Error getting categories:', error);
      // Fallback: We'll create a user and category on the fly
      categoryId = 'fallback-category';
    }
    
    // Check if user exists or create one
    let creatorId;
    try {
      // Try to find user by email
      const users = await userAPI.getAll();
      const user = users.find(u => u.email === ticketData.userEmail);
      creatorId = user?.id;
      
      if (!creatorId) {
        // Create a new user if not found
        const newUser = await userAPI.create({
          email: ticketData.userEmail,
          name: ticketData.userName || 'Customer',
          password: 'password123', // In a real app, use a secure password
          role: 'CUSTOMER'
        });
        creatorId = newUser.id;
      }
    } catch (error) {
      console.error('Error getting/creating user:', error);
      // Fallback
      creatorId = 'fallback-user';
    }
    
    // Map frontend ticket data to backend format
    const backendTicketData = {
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority.toUpperCase(),
      creatorId: creatorId,
      categoryId: categoryId,
    };
    
    console.log('Creating ticket with data:', backendTicketData);
    
    return fetchAPI<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(backendTicketData),
    });
  },
  
  update: (id: string, ticketData: Partial<Ticket>) => {
    // Map frontend ticket data to backend format
    const backendTicketData: any = {};
    
    if (ticketData.title) backendTicketData.title = ticketData.title;
    if (ticketData.description) backendTicketData.description = ticketData.description;
    if (ticketData.status) {
      console.log('Updating ticket status:', ticketData.status);
      backendTicketData.status = ticketData.status.toUpperCase().replace('-', '_');
    }
    if (ticketData.priority) backendTicketData.priority = ticketData.priority.toUpperCase();
    
    console.log(`Updating ticket ${id} with data:`, backendTicketData);
    
    return fetchAPI<Ticket>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendTicketData),
    }).then(response => {
      console.log('Update response:', response);
      // If the ticket was resolved and deleted, the response will have a 'message' field
      if (response.message && response.status === 'resolved') {
        console.log('Ticket was successfully resolved and deleted');
        return response;
      }
      return response;
    });
  },
  
  addComment: (ticketId: string, content: string, userId: string) => {
    return fetchAPI<TicketResponse>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, userId }),
    });
  },
};

// Category related API calls
export const categoryAPI = {
  getAll: () => fetchAPI<any[]>('/categories'),
  getById: (id: string) => fetchAPI<any>(`/categories/${id}`),
  create: (categoryData: any) => fetchAPI<any>('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),
};

// Helper function to map backend data to frontend format
export function mapBackendTicketToFrontend(backendTicket: any): Ticket {
  console.log('Mapping backend ticket to frontend format:', backendTicket);
  
  try {
    // Check if we have a valid ticket object
    if (!backendTicket || typeof backendTicket !== 'object') {
      console.error('Invalid ticket data:', backendTicket);
      throw new Error('Invalid ticket data');
    }
    
    // Handle different possible formats of the ticket data
    const ticket = {
      id: backendTicket.id || 'unknown-id',
      title: backendTicket.title || 'Untitled Ticket',
      description: backendTicket.description || 'No description provided',
      userEmail: backendTicket.userEmail || backendTicket.creator?.email || '',
      userName: backendTicket.userName || backendTicket.creator?.name || 'Unknown User',
      category: typeof backendTicket.category === 'string' 
        ? backendTicket.category.toLowerCase() 
        : (backendTicket.category?.name?.toLowerCase() || 'general'),
      priority: (backendTicket.priority || 'medium').toLowerCase(),
      status: (backendTicket.status || 'open').toLowerCase().replace('_', '-'),
      createdAt: backendTicket.createdAt || new Date().toISOString(),
      updatedAt: backendTicket.updatedAt || backendTicket.createdAt || new Date().toISOString(),
      responses: []
    };
    
    // Handle responses/comments
    if (Array.isArray(backendTicket.responses)) {
      ticket.responses = backendTicket.responses;
    } else if (Array.isArray(backendTicket.comments)) {
      ticket.responses = backendTicket.comments.map((comment: any) => ({
        id: comment.id || `comment-${Date.now()}`,
        ticketId: backendTicket.id,
        content: comment.content || '',
        createdAt: comment.createdAt || new Date().toISOString(),
        createdBy: comment.user?.name || comment.createdBy || 'System',
        isAIGenerated: comment.isAIGenerated || false,
      }));
    }
    
    console.log('Mapped ticket:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error mapping ticket:', error);
    // Return a default ticket object in case of errors
    return {
      id: backendTicket?.id || 'error-id',
      title: backendTicket?.title || 'Error Loading Ticket',
      description: 'There was an error loading this ticket data.',
      userEmail: '',
      userName: 'Unknown',
      category: 'general',
      priority: 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
    };
  }
}
