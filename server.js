import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import ollama from 'ollama';
import fs from 'fs';
import path from 'path';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // In a real application, you would hash the password here
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password, // In production, use hashed password
        role: role || 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Ticket routes
app.get('/api/tickets', async (req, res) => {
  try {
    console.log('Fetching tickets with query params:', req.query);
    const { status, priority, categoryId, assigneeId, creatorId } = req.query;
    
    const where = {};
    
    // Handle status filter
    if (status) {
      where.status = status.toUpperCase();
    }
    
    // Handle priority filter
    if (priority) {
      where.priority = priority.toUpperCase();
    }
    
    // Handle category filter - could be an ID or a name
    if (categoryId) {
      // Check if it's a UUID
      if (categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        where.categoryId = categoryId;
      } else {
        // It's a category name, find the category first
        const category = await prisma.category.findFirst({
          where: {
            name: {
              contains: categoryId,
              mode: 'insensitive'
            }
          }
        });
        
        if (category) {
          where.categoryId = category.id;
        }
      }
    }
    
    // Handle assignee filter
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    
    // Handle creator filter - could be an ID or an email
    if (creatorId) {
      if (creatorId.includes('@')) {
        // It's an email, find the user first
        const user = await prisma.user.findUnique({
          where: { email: creatorId }
        });
        
        if (user) {
          where.creatorId = user.id;
        } else {
          // If no user found with this email, return empty array
          return res.json([]);
        }
      } else {
        // It's a user ID
        where.creatorId = creatorId;
      }
    }
    
    console.log('Querying tickets with where clause:', where);
    
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Transform tickets to match frontend expectations
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status.toLowerCase().replace('_', '-'),
      priority: ticket.priority.toLowerCase(),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      userEmail: ticket.creator?.email || '',
      userName: ticket.creator?.name || '',
      category: ticket.category?.name.toLowerCase() || 'general',
      responses: ticket.comments?.map(comment => ({
        id: comment.id,
        ticketId: ticket.id,
        content: comment.content,
        createdAt: comment.createdAt,
        createdBy: comment.user?.name || 'System',
        isAIGenerated: false
      })) || []
    }));
    
    console.log(`Found ${formattedTickets.length} tickets`);
    res.json(formattedTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets: ' + error.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    console.log('Creating ticket with data:', req.body);
    const { title, description, priority, creatorId, assigneeId, categoryId, tags } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Handle creator - if creatorId is an email, find or create the user
    let creator;
    try {
      if (creatorId) {
        // Check if creatorId is an email
        if (creatorId.includes('@')) {
          // Try to find user by email
          creator = await prisma.user.findUnique({ where: { email: creatorId } });
          
          // If user doesn't exist, create a new one
          if (!creator) {
            creator = await prisma.user.create({
              data: {
                email: creatorId,
                name: 'Customer',
                password: 'password123', // In a real app, use a secure password
                role: 'CUSTOMER'
              }
            });
          }
        } else {
          // Try to find user by ID
          creator = await prisma.user.findUnique({ where: { id: creatorId } });
          
          // If user doesn't exist with this ID, return error
          if (!creator) {
            return res.status(404).json({ error: 'Creator not found' });
          }
        }
      } else {
        // If no creatorId provided, create a default user
        creator = await prisma.user.create({
          data: {
            email: `customer${Date.now()}@example.com`,
            name: 'Anonymous Customer',
            password: 'password123',
            role: 'CUSTOMER'
          }
        });
      }
    } catch (error) {
      console.error('Error handling creator:', error);
      return res.status(500).json({ error: 'Failed to process creator' });
    }
    
    // Handle category - if categoryId is a string name, find or create the category
    let category;
    try {
      if (categoryId) {
        // Check if categoryId is a name rather than an ID
        if (typeof categoryId === 'string' && !categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // Try to find category by name
          category = await prisma.category.findFirst({ 
            where: { 
              name: { 
                contains: categoryId,
                mode: 'insensitive'
              } 
            } 
          });
          
          // If category doesn't exist, create a new one
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                description: `Category for ${categoryId} tickets`
              }
            });
          }
        } else {
          // Try to find category by ID
          category = await prisma.category.findUnique({ where: { id: categoryId } });
          
          // If category doesn't exist with this ID, return error
          if (!category) {
            return res.status(404).json({ error: 'Category not found' });
          }
        }
      } else {
        // If no categoryId provided, get or create a default category
        category = await prisma.category.findFirst();
        
        if (!category) {
          category = await prisma.category.create({
            data: {
              name: 'General',
              description: 'General inquiries'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling category:', error);
      return res.status(500).json({ error: 'Failed to process category' });
    }
    
    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        creator: {
          connect: { id: creator.id },
        },
        ...(assigneeId && {
          assignee: {
            connect: { id: assigneeId },
          },
        }),
        category: {
          connect: { id: category.id },
        },
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          },
        }),
      },
      include: {
        creator: true,
        assignee: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    console.log('Ticket created successfully:', ticket);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket: ' + error.message });
  }
});

// Category routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a ticket or delete if resolved
app.put('/api/tickets/:id', async (req, res) => {
  try {
    console.log('Updating ticket:', req.params.id, 'with data:', req.body);
    const { title, description, status, priority, assigneeId } = req.body;
    
    // Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // If status is being set to RESOLVED, delete the ticket instead of updating it
    if (status === 'RESOLVED') {
      console.log('Ticket marked as resolved, deleting ticket:', req.params.id);
      
      try {
        // First, delete all comments associated with the ticket
        await prisma.comment.deleteMany({
          where: { ticketId: req.params.id }
        });
        console.log('Deleted associated comments');
        
        // Then delete any tag connections
        await prisma.tagsOnTickets.deleteMany({
          where: { ticketId: req.params.id }
        });
        console.log('Deleted associated tags');
        
        // Finally delete the ticket itself
        await prisma.ticket.delete({
          where: { id: req.params.id }
        });
        console.log('Deleted ticket successfully');
        
        // Return a success response with minimal data since the ticket is gone
        return res.json({
          id: req.params.id,
          status: 'resolved',
          message: 'Ticket has been resolved and removed from the system'
        });
      } catch (deleteError) {
        console.error('Error deleting resolved ticket:', deleteError);
        return res.status(500).json({ error: 'Failed to delete resolved ticket: ' + deleteError.message });
      }
    }
    
    // If not resolved, proceed with normal update
    // Prepare update data
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    
    // Handle assignee if provided
    if (assigneeId) {
      // Check if assignee exists
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });
      
      if (!assignee) {
        return res.status(404).json({ error: 'Assignee not found' });
      }
      
      updateData.assignee = {
        connect: { id: assigneeId }
      };
    }
    
    // Update the ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    console.log('Ticket updated successfully:', updatedTicket);
    
    // Format the response to match frontend expectations
    const formattedTicket = {
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      status: updatedTicket.status.toLowerCase().replace('_', '-'),
      priority: updatedTicket.priority.toLowerCase(),
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
      userEmail: updatedTicket.creator?.email || '',
      userName: updatedTicket.creator?.name || '',
      category: updatedTicket.category?.name.toLowerCase() || 'general',
      responses: updatedTicket.comments?.map(comment => ({
        id: comment.id,
        ticketId: updatedTicket.id,
        content: comment.content,
        createdAt: comment.createdAt,
        createdBy: comment.user?.name || 'System',
        isAIGenerated: false
      })) || []
    };
    
    res.json(formattedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket: ' + error.message });
  }
});

// Add comment to a ticket
app.post('/api/tickets/:id/comments', async (req, res) => {
  try {
    console.log('Adding comment to ticket:', req.params.id, 'with data:', req.body);
    const { content, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Handle user - could be an ID or an email
    let user;
    try {
      if (userId) {
        // Check if userId is an email
        if (userId.includes('@')) {
          // Try to find user by email
          user = await prisma.user.findUnique({ where: { email: userId } });
          
          // If user doesn't exist, create a new one
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: userId,
                name: 'Agent',
                password: 'password123', // In a real app, use a secure password
                role: 'AGENT'
              }
            });
          }
        } else {
          // Try to find user by ID
          user = await prisma.user.findUnique({ where: { id: userId } });
          
          // If user doesn't exist with this ID, return error
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
        }
      } else {
        // If no userId provided, create a default user
        user = await prisma.user.create({
          data: {
            email: `agent${Date.now()}@example.com`,
            name: 'System',
            password: 'password123',
            role: 'AGENT'
          }
        });
      }
    } catch (error) {
      console.error('Error handling user for comment:', error);
      return res.status(500).json({ error: 'Failed to process user for comment' });
    }
    
    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        ticket: {
          connect: { id: req.params.id },
        },
        user: {
          connect: { id: user.id },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    console.log('Comment added successfully:', comment);
    
    // Format the response to match frontend expectations
    const formattedComment = {
      id: comment.id,
      ticketId: req.params.id,
      content: comment.content,
      createdAt: comment.createdAt,
      createdBy: comment.user.name,
      isAIGenerated: false
    };
    
    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment: ' + error.message });
  }
});

// Company data routes
app.get('/api/company-data', async (req, res) => {
  try {
    console.log('Fetching company data');
    const data = await prisma.companyData.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching company data:', error);
    res.status(500).json({ error: 'Failed to fetch company data' });
  }
});

// Add new company data (direct text input)
app.post('/api/company-data', async (req, res) => {
  try {
    console.log('Adding company data:', req.body);
    const { name, description, content, type } = req.body;
    
    if (!name || !content || !type) {
      return res.status(400).json({ error: 'Name, content, and type are required' });
    }
    
    const newData = await prisma.companyData.create({
      data: {
        name,
        description: description || '',
        content,
        type
      }
    });
    
    res.json({ success: true, message: 'Company data added successfully', data: newData });
  } catch (error) {
    console.error('Error adding company data:', error);
    res.status(500).json({ error: 'Failed to add company data' });
  }
});

// Get model configuration and status
app.get('/api/company-data/model-config', async (req, res) => {
  try {
    console.log('Fetching model configuration');
    let modelConfig = await prisma.AIModelConfig.findFirst();
    
    if (!modelConfig) {
      console.log('No model config found, creating default');
      modelConfig = await prisma.AIModelConfig.create({
        data: {
          modelName: 'llama-2-7b-chat',
          temperature: 0.7,
          maxTokens: 2048,
          trainingStatus: 'not_trained',
          trainingProgress: 0
        }
      });
    }
    
    res.json(modelConfig);
  } catch (error) {
    console.error('Error fetching model configuration:', error);
    res.status(500).json({ error: 'Failed to fetch model configuration' });
  }
});

// Update model settings
app.post('/api/company-data/update-model-settings', async (req, res) => {
  try {
    console.log('Updating model settings:', req.body);
    const { modelName, temperature, maxTokens } = req.body;
    
    // Validate inputs
    if (temperature && (temperature < 0 || temperature > 1)) {
      return res.status(400).json({ error: 'Temperature must be between 0 and 1' });
    }
    
    if (maxTokens && (maxTokens < 512 || maxTokens > 8192)) {
      return res.status(400).json({ error: 'Max tokens must be between 512 and 8192' });
    }
    
    // Update model config in database
    let modelConfig = await prisma.AIModelConfig.findFirst();
    
    if (modelConfig) {
      modelConfig = await prisma.AIModelConfig.update({
        where: { id: modelConfig.id },
        data: {
          modelName: modelName || modelConfig.modelName,
          temperature: temperature !== undefined ? temperature : modelConfig.temperature,
          maxTokens: maxTokens || modelConfig.maxTokens,
          updatedAt: new Date()
        }
      });
    } else {
      modelConfig = await prisma.AIModelConfig.create({
        data: {
          modelName: modelName || 'llama-2-7b-chat',
          temperature: temperature !== undefined ? temperature : 0.7,
          maxTokens: maxTokens || 2048
        }
      });
    }
    
    res.json({ message: 'Model settings updated successfully', modelConfig });
  } catch (error) {
    console.error('Error updating model settings:', error);
    res.status(500).json({ error: 'Failed to update model settings' });
  }
});

// Train model endpoint with RAG implementation
app.post('/api/company-data/train-model', async (req, res) => {
  try {
    console.log('Starting Ollama model fine-tuning');
    // Get model config
    let modelConfig = await prisma.AIModelConfig.findFirst();
    
    if (!modelConfig) {
      return res.status(400).json({ error: 'Model configuration not found' });
    }
    
    // Update training status
    modelConfig = await prisma.AIModelConfig.update({
      where: { id: modelConfig.id },
      data: {
        trainingStatus: 'training',
        trainingProgress: 0
      }
    });
    
    // Get all company data for fine-tuning
    const companyData = await prisma.companyData.findMany();
    
    if (companyData.length === 0) {
      await prisma.AIModelConfig.update({
        where: { id: modelConfig.id },
        data: {
          trainingStatus: 'failed',
          trainingProgress: 0
        }
      });
      return res.status(400).json({ error: 'No company data found for training' });
    }
    
    // Start actual training in background
    (async () => {
      try {
        console.log(`Preparing fine-tuning data for ${companyData.length} documents...`);
        
        // Update progress
        await prisma.AIModelConfig.update({
          where: { id: modelConfig.id },
          data: { trainingProgress: 10 }
        });
        
        // Prepare fine-tuning data in the format Ollama expects
        // Create a training dataset in jsonl format for Ollama
        const trainingDataPath = path.join(process.cwd(), 'training_data');
        if (!fs.existsSync(trainingDataPath)) {
          fs.mkdirSync(trainingDataPath, { recursive: true });
        }
        
        const trainingFilePath = path.join(trainingDataPath, 'fine_tuning_data.jsonl');
        
        // Create training examples from company data
        const trainingExamples = [];
        
        // Process each company data item
        for (const data of companyData) {
          // For FAQ type data, create Q&A pairs
          if (data.type === 'faq' && data.content.includes('Q:') && data.content.includes('A:')) {
            // Extract Q&A pairs
            const pairs = data.content.split(/\n\s*\n/).filter(p => p.trim() !== '');
            
            for (const pair of pairs) {
              const qMatch = pair.match(/Q:\s*(.+?)(?=\s*A:|$)/s);
              const aMatch = pair.match(/A:\s*(.+?)(?=\s*Q:|$)/s);
              
              if (qMatch && aMatch) {
                const question = qMatch[1].trim();
                const answer = aMatch[1].trim();
                
                if (question && answer) {
                  trainingExamples.push({
                    prompt: `<|im_start|>user\n${question}<|im_end|>\n<|im_start|>assistant\n`,
                    completion: `${answer}<|im_end|>`
                  });
                }
              }
            }
          } else {
            // For other types, create examples based on the content
            // Extract potential questions from documentation or policy
            const sentences = data.content.split(/\.\s+|\?\s+|\!\s+/).filter(s => s.trim().length > 10);
            
            // Create training examples from the content
            for (let i = 0; i < sentences.length; i += 2) {
              if (i + 1 < sentences.length) {
                const context = sentences[i].trim();
                const response = sentences[i + 1].trim();
                
                if (context && response) {
                  // Create a question-like prompt from the context
                  trainingExamples.push({
                    prompt: `<|im_start|>user\nCan you tell me about ${context}?<|im_end|>\n<|im_start|>assistant\n`,
                    completion: `${response}<|im_end|>`
                  });
                }
              }
            }
            
            // Also add a general query about this topic
            trainingExamples.push({
              prompt: `<|im_start|>user\nWhat can you tell me about ${data.name}?<|im_end|>\n<|im_start|>assistant\n`,
              completion: `${data.content.substring(0, 200)}...<|im_end|>`
            });
          }
        }
        
        // Write training examples to file
        fs.writeFileSync(trainingFilePath, trainingExamples.map(ex => JSON.stringify(ex)).join('\n'));
        
        console.log(`Created ${trainingExamples.length} training examples for fine-tuning`);
        
        // Update progress
        await prisma.AIModelConfig.update({
          where: { id: modelConfig.id },
          data: { trainingProgress: 30 }
        });
        
        // Create a Modelfile for fine-tuning
        const modelfilePath = path.join(trainingDataPath, 'Modelfile');
        const baseModel = modelConfig.modelName || 'llama2';
        
        // Create Modelfile content
        const modelfileContent = `FROM ${baseModel}
` +
          `PARAMETER temperature ${modelConfig.temperature || 0.7}
` +
          `PARAMETER max_tokens ${modelConfig.maxTokens || 2048}
` +
          `SYSTEM You are a helpful customer support assistant for a software company. You provide accurate, concise, and helpful responses based on the company's documentation, FAQs, and policies.
` +
          `TEMPLATE "{{.System}}\n\n{{.Prompt}}"`;
        
        fs.writeFileSync(modelfilePath, modelfileContent);
        
        // Update progress
        await prisma.AIModelConfig.update({
          where: { id: modelConfig.id },
          data: { trainingProgress: 50 }
        });
        
        // Check if Ollama is running
        try {
          await fetch('http://localhost:11434/api/version');
          console.log('Ollama is available, starting fine-tuning');
          
          // Check if the base model exists
          console.log('Checking if base model exists...');
          const modelsResponse = await fetch('http://localhost:11434/api/tags');
          const modelsData = await modelsResponse.json();
          
          const hasBaseModel = modelsData.models?.some(model => model.name === baseModel);
          
          if (!hasBaseModel) {
            console.log(`Base model ${baseModel} not found, pulling it now...`);
            // Pull the base model first
            const pullResponse = await fetch('http://localhost:11434/api/pull', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: baseModel
              })
            });
            
            if (!pullResponse.ok) {
              throw new Error(`Failed to pull base model: ${pullResponse.statusText}`);
            }
            
            // Wait for the model to be pulled
            console.log(`Waiting for ${baseModel} to be pulled...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
          // Create a fine-tuned model using the Modelfile
          console.log('Creating fine-tuned model...');
          
          // First, check if the model already exists and delete it if it does
          const hasFineTunedModel = modelsData.models?.some(model => model.name === 'ticket-support-assistant');
          if (hasFineTunedModel) {
            console.log('Fine-tuned model already exists, deleting it first...');
            try {
              const deleteResponse = await fetch('http://localhost:11434/api/delete', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: 'ticket-support-assistant'
                })
              });
              
              if (!deleteResponse.ok) {
                console.warn(`Warning: Failed to delete existing model: ${deleteResponse.statusText}`);
              }
            } catch (deleteError) {
              console.warn('Warning: Error deleting existing model:', deleteError);
            }
          }
          
          // Now create the new model
          try {
            const createModelResponse = await fetch('http://localhost:11434/api/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: 'ticket-support-assistant',
                modelfile: modelfileContent,
                path: trainingFilePath
              })
            });
            
            if (!createModelResponse.ok) {
              const errorData = await createModelResponse.json().catch(() => ({}));
              throw new Error(`Failed to create model: ${createModelResponse.statusText}. ${errorData.error || ''}`);
            }
          } catch (createError) {
            console.error('Error creating model:', createError);
            
            // Try alternative approach using CLI
            console.log('Trying alternative approach using Ollama CLI...');
            try {
              // Write Modelfile to disk
              fs.writeFileSync(modelfilePath, modelfileContent);
              
              // Use child_process to run ollama create command
              const { exec } = await import('child_process');
              await new Promise((resolve, reject) => {
                exec(`ollama create ticket-support-assistant -f ${modelfilePath}`, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`exec error: ${error}`);
                    reject(error);
                    return;
                  }
                  console.log(`stdout: ${stdout}`);
                  console.error(`stderr: ${stderr}`);
                  resolve();
                });
              });
            } catch (cliError) {
              console.error('Error using CLI approach:', cliError);
              throw new Error('Failed to create model using both API and CLI approaches');
            }
          }
          
          // Update progress
          await prisma.AIModelConfig.update({
            where: { id: modelConfig.id },
            data: { trainingProgress: 80 }
          });
          
          // Also create a vector store for RAG as a fallback
          console.log('Creating vector store as fallback...');
          
          // Prepare documents for embedding
          const documents = [];
          
          // Process each company data item for RAG
          for (const data of companyData) {
            // Create a document with metadata
            const doc = new Document({
              pageContent: data.content,
              metadata: {
                id: data.id,
                name: data.name,
                type: data.type,
                description: data.description || ''
              }
            });
            
            documents.push(doc);
          }
          
          // Split text into chunks if needed
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
          });
          
          const splitDocs = await textSplitter.splitDocuments(documents);
          
          // Initialize embeddings model with Ollama
          const embeddings = new OllamaEmbeddings({
            model: "llama2",
            baseUrl: "http://localhost:11434"
          });
          
          // Create vector store
          const vectorStore = await HNSWLib.fromDocuments(splitDocs, embeddings);
          
          // Save the vector store
          const vectorStorePath = path.join(process.cwd(), 'vectordb', 'company_data');
          if (!fs.existsSync(path.dirname(vectorStorePath))) {
            fs.mkdirSync(path.dirname(vectorStorePath), { recursive: true });
          }
          await vectorStore.save(vectorStorePath);
          
          // Update model config with successful training
          await prisma.AIModelConfig.update({
            where: { id: modelConfig.id },
            data: {
              trainingStatus: 'trained',
              trainingProgress: 100,
              lastTrainedAt: new Date()
            }
          });
          
          console.log('Fine-tuning completed successfully');
        } catch (ollamaError) {
          console.error('Error with Ollama:', ollamaError);
          throw new Error('Ollama is not available or encountered an error during fine-tuning');
        }
      } catch (error) {
        console.error('Error during model fine-tuning:', error);
        await prisma.AIModelConfig.update({
          where: { id: modelConfig.id },
          data: {
            trainingStatus: 'failed',
            trainingProgress: 0
          }
        });
      }
    })();
    
    res.json({ message: 'Model fine-tuning started', status: 'training' });
  } catch (error) {
    console.error('Error starting model fine-tuning:', error);
    res.status(500).json({ error: 'Failed to start model fine-tuning' });
  }
});

// Get training status
app.get('/api/company-data/training-status', async (req, res) => {
  try {
    console.log('Checking training status');
    const modelConfig = await prisma.AIModelConfig.findFirst();
    
    if (!modelConfig) {
      return res.status(404).json({ error: 'Model configuration not found' });
    }
    
    res.json({
      status: modelConfig.trainingStatus,
      progress: modelConfig.trainingProgress
    });
  } catch (error) {
    console.error('Error checking training status:', error);
    res.status(500).json({ error: 'Failed to check training status' });
  }
});

// Clear all company data
app.delete('/api/company-data/clear-data', async (req, res) => {
  try {
    console.log('Clearing all company data');
    await prisma.companyData.deleteMany({});
    
    // Reset model training status
    const modelConfig = await prisma.AIModelConfig.findFirst();
    if (modelConfig) {
      await prisma.AIModelConfig.update({
        where: { id: modelConfig.id },
        data: {
          trainingStatus: 'not_trained',
          trainingProgress: 0
        }
      });
    }
    
    // Delete the vector store if it exists
    const vectorStorePath = path.join(process.cwd(), 'vectordb', 'company_data');
    if (fs.existsSync(vectorStorePath)) {
      try {
        fs.rmSync(vectorStorePath, { recursive: true, force: true });
        console.log('Vector store deleted successfully');
      } catch (fsError) {
        console.error('Error deleting vector store:', fsError);
      }
    }
    
    // Delete the training data if it exists
    const trainingDataPath = path.join(process.cwd(), 'training_data');
    if (fs.existsSync(trainingDataPath)) {
      try {
        fs.rmSync(trainingDataPath, { recursive: true, force: true });
        console.log('Training data deleted successfully');
      } catch (fsError) {
        console.error('Error deleting training data:', fsError);
      }
    }
    
    // Try to delete the fine-tuned model from Ollama
    try {
      const deleteModelResponse = await fetch('http://localhost:11434/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'ticket-support-assistant'
        })
      });
      
      if (deleteModelResponse.ok) {
        console.log('Fine-tuned model deleted from Ollama');
      } else {
        console.warn('Could not delete fine-tuned model from Ollama');
      }
    } catch (ollamaError) {
      console.warn('Ollama not available, could not delete model:', ollamaError.message);
    }
    
    res.json({ message: 'All company data and trained models cleared successfully' });
  } catch (error) {
    console.error('Error clearing company data:', error);
    res.status(500).json({ error: 'Failed to clear company data' });
  }
});

// Generate AI reply for a ticket using fine-tuned Ollama model or RAG fallback
app.post('/api/company-data/generate-reply', async (req, res) => {
  try {
    console.log('Generating AI reply for ticket:', req.body);
    let { ticketId, query, title, description, customerName, status, priority } = req.body;
    
    // If query is provided but description is not, use query as description
    if (query && !description) {
      description = query;
    }
    
    // Set default values for missing fields
    customerName = customerName || 'Customer';
    title = title || 'your inquiry';
    status = status || 'Open';
    priority = priority || 'Medium';
    
    console.log('Processed request data:', { ticketId, title, description, customerName, status, priority });
    
    if (!ticketId || !description) {
      return res.status(400).json({ error: 'Ticket ID and description are required' });
    }
    
    // Get model config
    const modelConfig = await prisma.AIModelConfig.findFirst();
    if (!modelConfig) {
      return res.status(400).json({ error: 'Model configuration not found' });
    }
    
    // Get company data for processing
    const companyData = await prisma.companyData.findMany();
    console.log(`Found ${companyData.length} company data items`);
    
    // If no company data or model not trained, return error
    if (companyData.length === 0 || modelConfig.trainingStatus !== 'trained') {
      return res.status(400).json({ 
        error: 'No training data available or model not trained. Please add data and train the model first.'
      });
    }
    
    // Check if vector store exists (for RAG fallback)
    const vectorStorePath = path.join(process.cwd(), 'vectordb', 'company_data');
    const vectorStoreExists = fs.existsSync(vectorStorePath);
        // Try to use the fine-tuned model first, or fallback to the base model if needed
    try {
      // Check if Ollama is running
      const versionResponse = await fetch('http://localhost:11434/api/version');
      if (!versionResponse.ok) {
        throw new Error('Ollama server is not responding properly');
      }
      
      // Check if our fine-tuned model exists
      const modelsResponse = await fetch('http://localhost:11434/api/tags');
      if (!modelsResponse.ok) {
        throw new Error('Failed to get models list from Ollama');
      }
      
      const modelsData = await modelsResponse.json();
      console.log('Available models:', modelsData.models?.map(m => m.name) || []);
      
      // Check if fine-tuned model exists, otherwise use base model
      const hasFineTunedModel = modelsData.models?.some(model => model.name === 'ticket-support-assistant');
      const hasBaseModel = modelsData.models?.some(model => 
        model.name === 'llama2' || 
        model.name === 'llama2:latest' || 
        model.name.startsWith('llama2')
      );
      
      console.log('Model availability check:', { hasFineTunedModel, hasBaseModel });
      
      // If we don't have either model, we can't proceed
      if (!hasFineTunedModel && !hasBaseModel) {
        throw new Error('Neither fine-tuned nor base model is available');
      }
      
      // Determine the actual model name to use based on what's available
      let actualModelName = 'llama2';
      if (hasFineTunedModel) {
        actualModelName = 'ticket-support-assistant';
      } else {
        // Find the actual llama2 model name from the available models
        const llama2Model = modelsData.models.find(model => 
          model.name === 'llama2' || 
          model.name === 'llama2:latest' || 
          model.name.startsWith('llama2')
        );
        if (llama2Model) {
          actualModelName = llama2Model.name;
        }
      }
      
      // Use the actual model name we determined
      console.log(`Using ${actualModelName} for response generation`);
      
      // If we're using the base model but expected the fine-tuned model, log a warning
      if (!hasFineTunedModel && modelConfig.trainingStatus === 'trained') {
        console.warn('WARNING: Expected to use fine-tuned model but it was not found. Using base model instead.');
        console.warn('You may need to train the model again.');
      }
      
      // Prepare the prompt with customer query
      const prompt = `The customer ${customerName} has submitted a ticket with the following details:\n\nTitle: ${title}\n\nDescription: ${description}\n\nPlease provide a helpful and concise response to address their issue.`;
      
      try {
        // Generate response using the selected model
        console.log(`Sending request to Ollama for ${actualModelName} response...`);
        const response = await ollama.chat({
          model: actualModelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: modelConfig.temperature || 0.7,
          numPredict: modelConfig.maxTokens || 2048
        });
        
        if (!response || !response.message || !response.message.content) {
          throw new Error('Received empty response from Ollama');
        }
        
        const aiResponse = response.message.content;
        console.log('Received response from model:', aiResponse.substring(0, 100) + '...');
        
        // Store the AI-generated response in the database as a comment
        try {
          // Find a default AI user (using ADMIN role since SYSTEM is not a valid enum value)
          let aiUser = await prisma.user.findFirst({
            where: { 
              email: 'ai@system.local',
              role: 'ADMIN' 
            }
          });
          
          if (!aiUser) {
            // Create an AI user if none exists
            try {
              aiUser = await prisma.user.create({
                data: {
                  name: 'AI Assistant',
                  email: 'ai@system.local',
                  password: 'ai-password-' + Date.now(), // Generate a random password
                  role: 'ADMIN' // Using ADMIN as the role since SYSTEM is not a valid enum value
                }
              });
              console.log('Created AI user for comment creation');
            } catch (createError) {
              console.error('Error creating AI user:', createError);
              throw createError;
            }
          }
          
          // Create the comment with the AI response
          await prisma.comment.create({
            data: {
              content: aiResponse,
              ticketId: ticketId,
              userId: aiUser.id
            }
          });
          
          console.log('AI response saved as comment');
        } catch (commentError) {
          console.error('Error saving AI response as comment:', commentError);
          // Continue anyway, as the main functionality is to return the response
        }
        
        return res.json({ response: aiResponse });
      } catch (modelError) {
        console.error('Error generating response with model:', modelError);
        console.log('Falling back to alternative approach...');
      }
    } catch (ollamaError) {
      console.warn('Ollama not available or error accessing fine-tuned model:', ollamaError.message);
      console.log('Falling back to RAG approach');
    }
    
    // If we reached here, we need to use the RAG fallback approach
    
    // Prepare for RAG
    let relevantContext = '';
    let usedRAG = false;
    let relevantData = [];
    
    // Create search query from ticket description and title
    const searchQuery = `${title} ${description}`;
    const queryLower = searchQuery.toLowerCase();
    
    // Extract important keywords from the query
    // Use a more sophisticated approach to extract meaningful keywords
    const stopWords = ['the', 'and', 'or', 'but', 'for', 'with', 'about', 'from', 'to', 'in', 'on', 'at', 'by', 'an', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could'];
    const keywords = queryLower.split(/\W+/)
      .filter(word => word.length > 2) // Keep words longer than 2 characters
      .filter(word => !stopWords.includes(word)) // Remove common stop words
      .map(word => word.toLowerCase()); // Normalize to lowercase
    
    console.log('Extracted keywords:', keywords);
    
    // Try to use RAG with vector store if it exists
    if (vectorStoreExists) {
      try {
        console.log('Vector store found, attempting to use RAG');
        
        // Try to initialize embeddings with Ollama
        let embeddings;
        try {
          // Check if Ollama is running
          await fetch('http://localhost:11434/api/version');
          console.log('Ollama is available, using it for embeddings');
          
          // Initialize embeddings model with Ollama
          embeddings = new OllamaEmbeddings({
            model: "llama2",
            baseUrl: "http://localhost:11434"
          });
        } catch (ollamaError) {
          console.warn('Ollama not available for embeddings, using fallback method');
          
          // Enhanced fallback embedding function with TF-IDF like weighting
          embeddings = {
            embedDocuments: async (texts) => {
              return texts.map(text => {
                const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.includes(w));
                const vector = {};
                const wordCount = {};
                
                // Count word frequencies
                words.forEach(word => {
                  wordCount[word] = (wordCount[word] || 0) + 1;
                });
                
                // Calculate TF (term frequency)
                Object.keys(wordCount).forEach(word => {
                  vector[word] = wordCount[word] / words.length;
                });
                
                const uniqueWords = Object.keys(vector).sort();
                return uniqueWords.slice(0, 150).map(w => vector[w]);
              });
            },
            embedQuery: async (text) => {
              const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.includes(w));
              const vector = {};
              const wordCount = {};
              
              // Count word frequencies
              words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
              });
              
              // Calculate TF (term frequency)
              Object.keys(wordCount).forEach(word => {
                vector[word] = wordCount[word] / words.length;
              });
              
              const uniqueWords = Object.keys(vector).sort();
              return uniqueWords.slice(0, 150).map(w => vector[w]);
            }
          };
        }
        
        // Load the vector store
        console.log('Loading vector store...');
        const vectorStore = await HNSWLib.load(vectorStorePath, embeddings);
        
        // Perform similarity search to find relevant documents
        console.log('Performing similarity search for:', searchQuery);
        const relevantDocs = await vectorStore.similaritySearch(searchQuery, 5); // Get top 5 most relevant docs for better coverage
        
        console.log('Found relevant documents:', relevantDocs.length);
        
        // Format the relevant documents as context
        if (relevantDocs && relevantDocs.length > 0) {
          relevantContext = 'Use the following company information as context for your response:\n';
          relevantDocs.forEach(doc => {
            const metadata = doc.metadata;
            relevantContext += `${metadata.name}: ${doc.pageContent}\n\n`;
          });
          usedRAG = true;
          
          // Convert relevant docs to company data format for further processing
          relevantData = relevantDocs.map(doc => ({
            name: doc.metadata.name,
            content: doc.pageContent,
            description: doc.metadata.description || ''
          }));
        }
      } catch (ragError) {
        console.error('Error using RAG:', ragError);
        console.log('Falling back to enhanced keyword matching');
      }
    }
    
    // If RAG failed or vector store doesn't exist, fall back to enhanced keyword matching
    if (!usedRAG) {
      console.log('Using enhanced keyword matching fallback');
      
      // Enhanced keyword matching with semantic similarity
      // Score each company data item based on keyword matches with weighting
      const scoredData = companyData.map(data => {
        const content = `${data.name} ${data.description || ''} ${data.content}`.toLowerCase();
        let score = 0;
        
        // Count keyword matches with position-based weighting
        // Keywords found in the name or early in content get higher scores
        keywords.forEach(keyword => {
          // Check for exact matches
          if (content.includes(keyword)) {
            // Base score for a match
            let matchScore = 1;
            
            // Boost score if keyword appears in the name (more important)
            if (data.name.toLowerCase().includes(keyword)) {
              matchScore += 2;
            }
            
            // Boost score if keyword appears multiple times
            const regex = new RegExp(keyword, 'gi');
            const matches = content.match(regex) || [];
            if (matches.length > 1) {
              matchScore += Math.min(matches.length - 1, 3); // Cap the bonus at 3
            }
            
            score += matchScore;
          }
          
          // Check for partial matches for longer keywords (3+ chars)
          if (keyword.length > 3) {
            // For each word in the content, check if it contains or is contained by the keyword
            const contentWords = content.split(/\W+/);
            for (const word of contentWords) {
              if (word.length > 3 && (word.includes(keyword) || keyword.includes(word))) {
                // Partial match gets a smaller score
                score += 0.5;
                break; // Only count once per keyword
              }
            }
          }
        });
        
        // Boost score for items with specific categories or types that might be relevant
        if (data.name.toLowerCase().includes('faq') || data.name.toLowerCase().includes('help')) {
          score += 1.5;
        }
        
        return { data, score };
      });
      
      // Sort by score (highest first) and take top 5 for better coverage
      relevantData = scoredData
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.data);
      
      console.log('Top relevant data items:', relevantData.map(d => ({ name: d.name, score: scoredData.find(s => s.data.id === d.id)?.score })));
      
      // Format the relevant company data as context
      if (relevantData.length > 0) {
        relevantContext = 'Use the following company information as context for your response:\n';
        relevantData.forEach(data => {
          relevantContext += `${data.name}: ${data.content}\n\n`;
        });
      }
    }
    
    // Now we have relevantContext from either RAG or keyword matching
    
    // Generate a response based on the query and relevant data
    let aiReply = '';
    
    // We already have queryLower from earlier, no need to redefine
    console.log('Processing query:', queryLower);
    
    // Look for FAQ matches first - these are most precise
    let bestFaqMatch = null;
    let bestFaqScore = 0;
    
    // Process each company data item that looks like an FAQ
    for (const data of relevantData) {
      // Look for FAQ-style content with Q: and A: patterns
      if (data.content.includes('Q:') && data.content.includes('A:')) {
        console.log('Found potential FAQ data:', data.name);
        
        // Extract all Q&A pairs from the content
        const parts = data.content.split('Q:');
        for (let i = 1; i < parts.length; i++) { // Skip the first split which is before any Q:
          const part = parts[i];
          const questionPart = part.split('A:')[0].trim();
          let answerPart = '';
          
          // Extract answer - it's between A: and the next Q: (or end of string)
          if (part.includes('A:')) {
            const afterA = part.split('A:')[1];
            // If there's another Q: after this answer, only take up to that point
            answerPart = afterA.includes('Q:') ? 
              afterA.substring(0, afterA.indexOf('Q:')).trim() : 
              afterA.trim();
          }
          
          // Skip if we couldn't extract a proper Q&A pair
          if (!questionPart || !answerPart) continue;
          
          // Calculate enhanced similarity score between query and this question
          const questionLower = questionPart.toLowerCase();
          
          // Use the keywords we extracted earlier for better matching
          const questionWords = questionLower.split(/\W+/)
            .filter(w => w.length > 2 && !stopWords.includes(w));
          
          // Calculate multiple similarity metrics
          // 1. Common words count
          const commonWords = keywords.filter(w => questionWords.includes(w));
          let score = commonWords.length;
          
          // 2. Percentage of query keywords found in the question
          const keywordCoverage = keywords.length > 0 ? commonWords.length / keywords.length : 0;
          score += keywordCoverage * 2; // Weight this metric higher
          
          // 3. Exact phrase matches (higher weight)
          const queryPhrases = extractPhrases(queryLower, 2); // Extract 2-word phrases
          const questionPhrases = extractPhrases(questionLower, 2);
          const commonPhrases = queryPhrases.filter(p => questionPhrases.includes(p));
          score += commonPhrases.length * 1.5; // Weight phrases higher than single words
          
          console.log(`Question: "${questionPart}", Score: ${score.toFixed(2)}, Common words: ${commonWords.length}, Phrases: ${commonPhrases.length}`);
          
          // If this is the best match so far, save it
          if (score > bestFaqScore) {
            bestFaqMatch = { question: questionPart, answer: answerPart };
            bestFaqScore = score;
          }
        }
      }
    }
    
    // Helper function to extract n-word phrases from text
    function extractPhrases(text, n) {
      const words = text.split(/\W+/).filter(w => w.length > 2);
      const phrases = [];
      for (let i = 0; i <= words.length - n; i++) {
        phrases.push(words.slice(i, i + n).join(' '));
      }
      return phrases;
    }
    
    // Determine the threshold for a good FAQ match based on the query complexity
    // Longer queries with more keywords need higher scores to be considered a good match
    const faqMatchThreshold = Math.max(1.5, Math.min(keywords.length * 0.4, 3));
    console.log(`FAQ match threshold: ${faqMatchThreshold} (based on ${keywords.length} keywords)`);
    
    // If we found a good FAQ match above our dynamic threshold, use it
    if (bestFaqMatch && bestFaqScore >= faqMatchThreshold) {
      console.log(`Using best FAQ match: "${bestFaqMatch.question}" with score ${bestFaqScore}`);
      
      // Format the response using the matched FAQ Q&A pair with additional context if available
      aiReply = `Dear ${customerName},\n\nThank you for contacting our support team regarding "${title}". I'm happy to help with your question.\n\n${bestFaqMatch.answer}`;
      
      // Add additional context from other relevant data if available and not redundant
      const additionalContext = getAdditionalContext(relevantData, bestFaqMatch.answer);
      if (additionalContext) {
        aiReply += `\n\nAdditionally, you might find this information helpful:\n\n${additionalContext}`;
      }
      
      aiReply += `\n\nIf you need any further clarification or have additional questions, please don't hesitate to ask.\n\nBest regards,\nSupport Team`;
    } else {
      // Process using other methods since we don't have a good FAQ match
      
      // Define helper functions for query analysis
      function calculateQueryTypeScore(text, keywords) {
        let score = 0;
        for (const keyword of keywords) {
          let matchScore = 0;
          
          // Check if keyword appears in text
          if (text.toLowerCase().includes(keyword)) {
            matchScore += 1;
            
            // Boost score if keyword appears multiple times
            const regex = new RegExp(keyword.replace(/\s+/g, '\\s+'), 'gi');
            const matches = text.match(regex) || [];
            if (matches.length > 1) {
              matchScore += Math.min(matches.length - 1, 2); // Cap the bonus at 2
            }
            
            score += matchScore;
          }
        }
        return score;
      }

      
      // Helper function to get additional context from relevant data
      // that doesn't duplicate what's already in the primary answer
      function getAdditionalContext(relevantData, primaryAnswer) {
        if (!relevantData || relevantData.length <= 1) return '';
        
        // Skip the first item if it contains the primary answer
        const startIndex = relevantData[0].content.includes(primaryAnswer) ? 1 : 0;
        
        // Look for additional context in other relevant data items
        for (let i = startIndex; i < relevantData.length; i++) {
          const content = relevantData[i].content;
          
          // Skip if this content is too similar to the primary answer
          if (calculateTextSimilarity(content, primaryAnswer) > 0.7) continue;
          
          // Extract a concise snippet that adds new information
          return extractRelevantSnippet(content, primaryAnswer);
        }
        
        return '';
      }
      
      // Helper function to calculate text similarity
      function calculateTextSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.includes(w));
        const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.includes(w));
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const commonWords = words1.filter(w => words2.includes(w));
        return commonWords.length / Math.max(words1.length, words2.length);
      }
      
      // Helper function to extract a relevant snippet from text
      function extractRelevantSnippet(text, primaryText) {
        // If it's a short text, just return it
        if (text.length < 200) return text;
        
        // For FAQ format, try to extract a relevant Q&A pair
        if (text.includes('Q:') && text.includes('A:')) {
          const parts = text.split('Q:');
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part.includes('A:')) {
              const question = part.split('A:')[0].trim();
              const answer = part.split('A:')[1].split('Q:')[0]?.trim() || '';
              
              // Skip if this Q&A is too similar to the primary text
              if (calculateTextSimilarity(answer, primaryText) < 0.5) {
                return `${question}\n${answer}`;
              }
            }
          }
        }
        
        // Otherwise, return a truncated version
        return text.substring(0, 150) + '...';
      }
      
      // Analyze query type to determine the best response approach
      const queryTypeScores = {
        subscription: 0,
        technical: 0,
        account: 0,
        refund: 0,
        feature: 0
      };
      
      // Check for subscription-related keywords
      if (queryLower.includes('subscription') || queryLower.includes('plan') || 
          queryLower.includes('pricing') || queryLower.includes('payment') || 
          queryLower.includes('free trial') || queryLower.includes('upgrade') || 
          queryLower.includes('downgrade') || queryLower.includes('cancel')) {
        queryTypeScores.subscription += 2;
      }
      
      // Check for technical issue keywords
      if (queryLower.includes('error') || queryLower.includes('bug') || 
          queryLower.includes('issue') || queryLower.includes('problem') || 
          queryLower.includes('not working') || queryLower.includes('broken') || 
          queryLower.includes('fix') || queryLower.includes('help')) {
        queryTypeScores.technical += 2;
      }
      
      // Check for account-related keywords
      if (queryLower.includes('account') || queryLower.includes('login') || 
          queryLower.includes('password') || queryLower.includes('email') || 
          queryLower.includes('sign in') || queryLower.includes('sign up') || 
          queryLower.includes('register')) {
        queryTypeScores.account += 2;
      }
      
      // Check for refund-related keywords
      if (queryLower.includes('refund') || queryLower.includes('money back') || 
          queryLower.includes('cancel') || queryLower.includes('return')) {
        queryTypeScores.refund += 2;
      }
      
      // Check for feature-related keywords
      if (queryLower.includes('feature') || queryLower.includes('how to') || 
          queryLower.includes('can i') || queryLower.includes('functionality') || 
          queryLower.includes('option')) {
        queryTypeScores.feature += 2;
      }
      
      // Determine primary query type
      const queryTypes = Object.entries(queryTypeScores);
      queryTypes.sort((a, b) => b[1] - a[1]);
      const primaryQueryType = queryTypes[0][1] > 0 ? queryTypes[0] : null;
      
      const isSubscriptionQuery = queryTypeScores.subscription > 0;
      const isTechnicalQuery = queryTypeScores.technical > 0;
      const isAccountQuery = queryTypeScores.account > 0;
      const isRefundQuery = queryTypeScores.refund > 0;
      const isFeatureQuery = queryTypeScores.feature > 0;
      
      // Log the detected query type
      if (primaryQueryType) {
        console.log(`Primary query type detected: ${primaryQueryType[0]} with score ${primaryQueryType[1]}`);
      } else {
        console.log('No specific query type detected, treating as general inquiry');
      }
      
      if (isSubscriptionQuery) {
        // Subscription-related query
        // Find the most relevant subscription information
        const subscriptionInfo = relevantData.filter(data => 
          data.content.toLowerCase().includes('subscription') || 
          data.content.toLowerCase().includes('plan') || 
          data.content.toLowerCase().includes('pricing') ||
          data.name.toLowerCase().includes('subscription') ||
          data.name.toLowerCase().includes('plan') ||
          data.name.toLowerCase().includes('pricing')
        );
        
        if (subscriptionInfo.length > 0) {
          // Sort by relevance to subscription keywords
          const sortedInfo = subscriptionInfo.sort((a, b) => {
            const scoreA = calculateQueryTypeScore(a.content.toLowerCase(), subscriptionKeywords);
            const scoreB = calculateQueryTypeScore(b.content.toLowerCase(), subscriptionKeywords);
            return scoreB - scoreA;
          });
          
          const primaryInfo = sortedInfo[0].content;
          
          aiReply = `Dear ${customerName},\n\nThank you for your inquiry about our subscription options. I'd be happy to help you with that.\n\n${primaryInfo}`;
          
          // Add additional context if available
          if (sortedInfo.length > 1) {
            const additionalInfo = getAdditionalContext(sortedInfo, primaryInfo);
            if (additionalInfo) {
              aiReply += `\n\nAdditionally, you might find this information helpful:\n\n${additionalInfo}`;
            }
          }
          
          aiReply += `\n\nIf you have any specific questions about our plans or need assistance with your subscription, please let me know and I'll be glad to provide more detailed guidance.\n\nBest regards,\nSupport Team`;
        } else {
          aiReply = `Dear ${customerName},\n\nThank you for your inquiry about our subscription options. I'd be happy to help you with that.\n\nWe offer several different subscription tiers to meet different needs. You can manage your subscription through your account dashboard in the "Subscription" section.\n\nIf you have any specific questions about our plans or need assistance with your subscription, please let me know and I'll be glad to provide more detailed guidance.\n\nBest regards,\nSupport Team`;
        }
      } else if (isTechnicalQuery) {
        // Technical issue query
        // Find the most relevant technical information
        const technicalInfo = relevantData.filter(data => 
          data.content.toLowerCase().includes('troubleshoot') || 
          data.content.toLowerCase().includes('fix') ||
          data.content.toLowerCase().includes('error') ||
          data.content.toLowerCase().includes('issue') ||
          data.content.toLowerCase().includes('problem') ||
          data.name.toLowerCase().includes('troubleshoot') ||
          data.name.toLowerCase().includes('guide') ||
          data.name.toLowerCase().includes('help')
        );
        
        if (technicalInfo.length > 0) {
          // Sort by relevance to technical keywords
          const sortedInfo = technicalInfo.sort((a, b) => {
            const scoreA = calculateQueryTypeScore(a.content.toLowerCase(), technicalKeywords);
            const scoreB = calculateQueryTypeScore(b.content.toLowerCase(), technicalKeywords);
            return scoreB - scoreA;
          });
          
          const primaryInfo = sortedInfo[0].content;
          
          // Extract specific error-related content if possible
          let specificErrorInfo = primaryInfo;
          if (primaryInfo.includes('Q:') && primaryInfo.includes('A:')) {
            // Try to find a Q&A pair that matches the specific error or issue
            const parts = primaryInfo.split('Q:');
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              if (part.includes('A:')) {
                const question = part.split('A:')[0].trim().toLowerCase();
                const answer = part.split('A:')[1].split('Q:')[0]?.trim() || '';
                
                // Check if this Q&A is relevant to the specific issue
                const questionScore = calculateQueryTypeScore(question, keywords.map(k => k.toLowerCase()));
                if (questionScore > 0) {
                  specificErrorInfo = `${part.split('A:')[0].trim()}\n\n${answer}`;
                  break;
                }
              }
            }
          }
          
          aiReply = `Dear ${customerName},\n\nI'm sorry to hear you're experiencing technical difficulties with "${title}". Let me help you resolve this issue.\n\nBased on our documentation:\n\n${specificErrorInfo}`;
          
          // Add additional context if available
          if (sortedInfo.length > 1) {
            const additionalInfo = getAdditionalContext(sortedInfo, primaryInfo);
            if (additionalInfo) {
              aiReply += `\n\nAdditionally, you might find these troubleshooting steps helpful:\n\n${additionalInfo}`;
            }
          }
          
          aiReply += `\n\nIf these steps don't resolve your issue, please provide more specific details about the problem you're encountering, including any error messages you're seeing, and I'll be happy to assist you further.\n\nBest regards,\nSupport Team`;
        } else {
          aiReply = `Dear ${customerName},\n\nI'm sorry to hear you're experiencing technical difficulties with "${title}". Let me help you resolve this issue.\n\nTo better assist you, could you please provide the following information:\n\n1. What specific error messages are you seeing?\n2. What steps have you already tried?\n3. What browser/device are you using?\n\nWith this information, I'll be able to provide you with more targeted troubleshooting steps.\n\nBest regards,\nSupport Team`;
        }
      } else if (isAccountQuery) {
        // Account-related query
        console.log('Processing account-related query');
        
        // Check for password reset specifically
        const isPasswordReset = queryLower.includes('password') && 
                               (queryLower.includes('reset') || queryLower.includes('forgot') || queryLower.includes('change'));
        
        if (isPasswordReset) {
          console.log('Password reset query detected');
          
          // Find relevant password reset information
          const passwordResetInfo = relevantData.filter(data => 
            data.content.toLowerCase().includes('password') && 
            (data.content.toLowerCase().includes('reset') || 
             data.content.toLowerCase().includes('forgot') || 
             data.content.toLowerCase().includes('change'))
          );
          
          if (passwordResetInfo.length > 0) {
            // Sort by relevance to password reset keywords
            const sortedInfo = passwordResetInfo.sort((a, b) => {
              const scoreA = calculateQueryTypeScore(a.content.toLowerCase(), ['password reset', 'reset password', 'forgot password', 'change password']);
              const scoreB = calculateQueryTypeScore(b.content.toLowerCase(), ['password reset', 'reset password', 'forgot password', 'change password']);
              return scoreB - scoreA;
            });
            
            let resetInstructions = '';
            const primaryInfo = sortedInfo[0].content;
            
            // Try to extract specific password reset instructions if in FAQ format
            if (primaryInfo.includes('Q:') && primaryInfo.includes('A:')) {
              const parts = primaryInfo.split('Q:');
              for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                const question = part.split('A:')[0].trim().toLowerCase();
                
                if (question.includes('password') && 
                   (question.includes('reset') || question.includes('forgot') || question.includes('change'))) {
                  // Found the password reset Q&A
                  const answer = part.split('A:')[1]?.split('Q:')[0]?.trim() || '';
                  if (answer) {
                    resetInstructions = answer;
                    break;
                  }
                }
              }
            }
            
            // If we couldn't extract specific instructions, use the whole content
            if (!resetInstructions) {
              resetInstructions = primaryInfo;
            }
            
            aiReply = `Dear ${customerName},\n\nThank you for reaching out about resetting your password. I'm happy to help.\n\n${resetInstructions}`;
            
            // Add additional context if available
            if (sortedInfo.length > 1) {
              const additionalInfo = getAdditionalContext(sortedInfo, resetInstructions);
              if (additionalInfo) {
                aiReply += `\n\nAdditionally, you might find this information helpful:\n\n${additionalInfo}`;
              }
            }
            
            aiReply += `\n\nIf you have any issues with the password reset process, please let me know and I'll be glad to assist further.\n\nBest regards,\nSupport Team`;
          } else {
            // Generic password reset instructions
            aiReply = `Dear ${customerName},\n\nThank you for reaching out about resetting your password. I'm happy to help.\n\nTo reset your password, please follow these steps:\n\n1. Go to the login page on our website\n2. Click on the "Forgot Password" link below the login form\n3. Enter the email address associated with your account\n4. Check your email for a password reset link\n5. Click the link and follow the instructions to create a new password\n\nIf you don't receive the password reset email within a few minutes, please check your spam or junk folder. If you still don't see it, please let me know and I'll help you troubleshoot further.\n\nBest regards,\nSupport Team`;
          }
        } else {
          // Other account-related query
          const accountInfo = relevantData.filter(data => 
            data.content.toLowerCase().includes('account') || 
            data.content.toLowerCase().includes('login') ||
            data.name.toLowerCase().includes('account') ||
            data.name.toLowerCase().includes('user')
          );
          
          if (accountInfo.length > 0) {
            // Sort by relevance to account keywords
            const sortedInfo = accountInfo.sort((a, b) => {
              const scoreA = calculateQueryTypeScore(a.content.toLowerCase(), accountKeywords);
              const scoreB = calculateQueryTypeScore(b.content.toLowerCase(), accountKeywords);
              return scoreB - scoreA;
            });
            
            const primaryInfo = sortedInfo[0].content;
            
            // Try to extract specific account information if in FAQ format
            let accountContent = primaryInfo;
            if (primaryInfo.includes('Q:') && primaryInfo.includes('A:')) {
              // Try to find a relevant Q&A pair
              const parts = primaryInfo.split('Q:');
              for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                if (part.includes('A:')) {
                  const question = part.split('A:')[0].trim().toLowerCase();
                  const answer = part.split('A:')[1].split('Q:')[0]?.trim() || '';
                  
                  // Check if this Q&A is relevant to the specific account issue
                  const questionScore = calculateQueryTypeScore(question, keywords.map(k => k.toLowerCase()));
                  if (questionScore > 0) {
                    accountContent = `${part.split('A:')[0].trim()}\n\n${answer}`;
                    break;
                  }
                }
              }
            }
            
            aiReply = `Dear ${customerName},\n\nThank you for reaching out about your account. I'm here to help.\n\nRegarding your account inquiry:\n\n${accountContent}`;
            
            // Add additional context if available
            if (sortedInfo.length > 1) {
              const additionalInfo = getAdditionalContext(sortedInfo, accountContent);
              if (additionalInfo) {
                aiReply += `\n\nAdditionally, you might find this information helpful:\n\n${additionalInfo}`;
              }
            }
            
            aiReply += `\n\nIf you have any other questions about your account, please don't hesitate to ask.\n\nBest regards,\nSupport Team`;
          } else {
            aiReply = `Dear ${customerName},\n\nThank you for reaching out about your account. I'm here to help.\n\nIf you're having trouble accessing your account, here are some steps you can take:\n\n1. Try resetting your password using the "Forgot Password" link on the login page\n2. Ensure you're using the correct email address associated with your account\n3. Check if your account has been verified (you should have received a verification email)\n\nIf you continue to experience issues, please provide more details about the specific problem you're encountering, and I'll be happy to assist you further.\n\nBest regards,\nSupport Team`;
          }
        }
      } else if (isRefundQuery) {
        // Refund-related query
        const refundInfo = relevantData.filter(data => 
          data.content.toLowerCase().includes('refund') || 
          data.content.toLowerCase().includes('money back') ||
          data.content.toLowerCase().includes('cancel') ||
          data.name.toLowerCase().includes('refund') ||
          data.name.toLowerCase().includes('payment')
        );
        
        if (refundInfo.length > 0) {
          // Sort by relevance to refund keywords
          const sortedInfo = refundInfo.sort((a, b) => {
            const scoreA = calculateQueryTypeScore(a.content.toLowerCase(), refundKeywords);
            const scoreB = calculateQueryTypeScore(b.content.toLowerCase(), refundKeywords);
            return scoreB - scoreA;
          });
          
          const primaryInfo = sortedInfo[0].content;
          
          // Try to extract specific refund information if in FAQ format
          let refundContent = primaryInfo;
          if (primaryInfo.includes('Q:') && primaryInfo.includes('A:')) {
            // Try to find a relevant Q&A pair
            const parts = primaryInfo.split('Q:');
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              if (part.includes('A:')) {
                const question = part.split('A:')[0].trim().toLowerCase();
                const answer = part.split('A:')[1].split('Q:')[0]?.trim() || '';
                
                // Check if this Q&A is relevant to refunds
                if (question.includes('refund') || question.includes('money back') || question.includes('cancel')) {
                  refundContent = `${part.split('A:')[0].trim()}\n\n${answer}`;
                  break;
                }
              }
            }
          }
          
          aiReply = `Dear ${customerName},\n\nThank you for contacting us regarding a refund for "${title}". I understand how important this matter is to you.\n\nRegarding our refund policy:\n\n${refundContent}`;
          
          // Add additional context if available
          if (sortedInfo.length > 1) {
            const additionalInfo = getAdditionalContext(sortedInfo, refundContent);
            if (additionalInfo) {
              aiReply += `\n\nAdditionally, you might find this information helpful:\n\n${additionalInfo}`;
            }
          }
          
          aiReply += `\n\nIf you need further assistance with processing your refund or have any other questions, please don't hesitate to let me know. I'm here to help.\n\nBest regards,\nSupport Team`;
        } else {
          aiReply = `Dear ${customerName},\n\nThank you for contacting us regarding a refund for "${title}". I understand how important this matter is to you.\n\nTo process your refund request, I'll need some additional information:\n\n1. The date of your purchase\n2. The order or transaction number (if available)\n3. The reason for the refund request\n\nOnce I have this information, I'll be able to assist you further with your refund request according to our company's refund policy.\n\nBest regards,\nSupport Team`;
        }
      } else if (isFeatureQuery) {
        // Feature-related query
        const featureInfo = relevantData.filter(data => 
          data.content.toLowerCase().includes('feature') || 
          data.content.toLowerCase().includes('functionality') ||
          data.content.toLowerCase().includes('capability') ||
          data.name.toLowerCase().includes('feature') ||
          data.name.toLowerCase().includes('guide')
        );
        
        if (featureInfo.length > 0) {
          // Sort by relevance to feature keywords
          const sortedInfo = featureInfo.sort((a, b) => {
            const scoreA = calculateQueryTypeScore(a.content.toLowerCase(), featureKeywords);
            const scoreB = calculateQueryTypeScore(b.content.toLowerCase(), featureKeywords);
            return scoreB - scoreA;
          });
          
          const primaryInfo = sortedInfo[0].content;
          
          // Try to extract specific feature information if in FAQ format
          let featureContent = primaryInfo;
          if (primaryInfo.includes('Q:') && primaryInfo.includes('A:')) {
            // Try to find a relevant Q&A pair
            const parts = primaryInfo.split('Q:');
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              if (part.includes('A:')) {
                const question = part.split('A:')[0].trim().toLowerCase();
                const answer = part.split('A:')[1].split('Q:')[0]?.trim() || '';
                
                // Check if this Q&A is relevant to the specific feature
                const questionScore = calculateQueryTypeScore(question, keywords.map(k => k.toLowerCase()));
                if (questionScore > 0) {
                  featureContent = `${part.split('A:')[0].trim()}\n\n${answer}`;
                  break;
                }
              }
            }
          }
          
          aiReply = `Dear ${customerName},\n\nThank you for your inquiry about our features related to "${title}". I'm happy to provide you with information about this functionality.\n\n${featureContent}`;
          
          // Add additional context if available
          if (sortedInfo.length > 1) {
            const additionalInfo = getAdditionalContext(sortedInfo, featureContent);
            if (additionalInfo) {
              aiReply += `\n\nAdditionally, you might find this information helpful:\n\n${additionalInfo}`;
            }
          }
          
          aiReply += `\n\nIf you have any questions about how to use this feature or need further assistance, please don't hesitate to ask.\n\nBest regards,\nSupport Team`;
        } else {
          aiReply = `Dear ${customerName},\n\nThank you for your inquiry about features related to "${title}". I'd be happy to provide you with more information.\n\nTo better assist you with your specific feature request, could you please provide more details about what you're trying to accomplish? This will help me provide you with the most relevant information about our functionality.\n\nBest regards,\nSupport Team`;
        }
      } else {
        // General response using relevant company data with improved context utilization
        console.log('Processing general inquiry');
        
        // Analyze the query to determine the most likely intent
        const queryIntent = analyzeQueryIntent(queryLower, keywords);
        console.log('Detected query intent:', queryIntent);
        
        aiReply = `Dear ${customerName},\n\nThank you for contacting our support team regarding "${title}". I appreciate you reaching out to us.\n\n`;
        
        if (relevantData.length > 0) {
          // Sort relevant data by how well it matches the query keywords
          const sortedRelevantData = relevantData.sort((a, b) => {
            const scoreA = calculateContentRelevance(a.content, keywords);
            const scoreB = calculateContentRelevance(b.content, keywords);
            return scoreB - scoreA;
          });
          
          aiReply += `Based on the information you've provided, I believe the following may help address your inquiry:\n\n`;
          
          // Include the most relevant content first
          const mostRelevant = sortedRelevantData[0];
          
          // Check if the content is in FAQ format and extract the most relevant Q&A
          if (mostRelevant.content.includes('Q:') && mostRelevant.content.includes('A:')) {
            const bestQA = extractBestQAPair(mostRelevant.content, keywords);
            if (bestQA) {
              aiReply += `${bestQA.question}\n\n${bestQA.answer}\n\n`;
            } else {
              aiReply += `${mostRelevant.content}\n\n`;
            }
          } else {
            aiReply += `${mostRelevant.content}\n\n`;
          }
          
          // Add additional relevant information if available
          if (sortedRelevantData.length > 1) {
            const additionalInfo = getAdditionalContext(sortedRelevantData, mostRelevant.content);
            if (additionalInfo) {
              aiReply += `Additionally, you might find this information helpful:\n\n${additionalInfo}\n\n`;
            }
          }
        } else {
          aiReply += `I've reviewed your inquiry and would like to help you resolve this matter. To better assist you, could you please provide some additional details about your specific situation? This will help me provide you with the most accurate and helpful information.\n\n`;
        }
        
        aiReply += `If you have any further questions or need additional assistance, please don't hesitate to let me know. I'm here to help.\n\nBest regards,\nSupport Team`;
      }
      
      // Helper function to analyze query intent
      function analyzeQueryIntent(query, keywords) {
        // Check for question patterns
        const isQuestion = query.includes('?') || 
                          query.includes('how') || 
                          query.includes('what') || 
                          query.includes('why') || 
                          query.includes('when') || 
                          query.includes('where') || 
                          query.includes('can you') || 
                          query.includes('could you');
        
        // Check for request patterns
        const isRequest = query.includes('please') || 
                         query.includes('need') || 
                         query.includes('want') || 
                         query.includes('looking for') || 
                         query.includes('help me');
        
        // Check for complaint patterns
        const isComplaint = query.includes('not working') || 
                           query.includes('problem') || 
                           query.includes('issue') || 
                           query.includes('doesn\'t work') || 
                           query.includes('broken') || 
                           query.includes('disappointed') || 
                           query.includes('unhappy') || 
                           query.includes('frustrated');
        
        if (isQuestion) return 'question';
        if (isComplaint) return 'complaint';
        if (isRequest) return 'request';
        return 'statement';
      }
      
      // Helper function to calculate content relevance to keywords
      function calculateContentRelevance(content, keywords) {
        const contentLower = content.toLowerCase();
        let score = 0;
        
        for (const keyword of keywords) {
          if (contentLower.includes(keyword)) {
            // Base score for a match
            score += 1;
            
            // Boost score for keywords that appear in the first 100 characters (likely more important)
            if (contentLower.substring(0, 100).includes(keyword)) {
              score += 0.5;
            }
            
            // Boost score for keywords that appear multiple times
            const regex = new RegExp(keyword, 'gi');
            const matches = contentLower.match(regex) || [];
            if (matches.length > 1) {
              score += Math.min(matches.length - 1, 3) * 0.3; // Cap the bonus at 3 occurrences
            }
          }
        }
        
        return score;
      }
      
      // Helper function to extract the best Q&A pair from FAQ content
      function extractBestQAPair(content, keywords) {
        if (!content.includes('Q:') || !content.includes('A:')) return null;
        
        const parts = content.split('Q:');
        let bestPair = null;
        let bestScore = 0;
        
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          if (!part.includes('A:')) continue;
          
          const question = part.split('A:')[0].trim();
          const answer = part.split('A:')[1].split('Q:')[0]?.trim() || '';
          
          if (!question || !answer) continue;
          
          // Calculate relevance score for this Q&A pair
          const questionLower = question.toLowerCase();
          const answerLower = answer.toLowerCase();
          let score = 0;
          
          for (const keyword of keywords) {
            // Check question for keyword matches
            if (questionLower.includes(keyword)) {
              score += 1.5; // Question matches are more important
            }
            
            // Check answer for keyword matches
            if (answerLower.includes(keyword)) {
              score += 0.5;
            }
          }
          
          if (score > bestScore) {
            bestPair = { question, answer };
            bestScore = score;
          }
        }
        
        // Only return if we found a reasonably good match
        return bestScore >= 1 ? bestPair : null;
      }
    }
    
    // Store the AI-generated response in the database as a comment
    try {
      // Find a default user or system user
      const systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (systemUser) {
        // Create a comment with the AI-generated response
        await prisma.comment.create({
          data: {
            content: aiReply,
            ticket: {
              connect: { id: ticketId }
            },
            user: {
              connect: { id: systemUser.id }
            }
            // Note: isAIGenerated field removed as it doesn't exist in the Comment model
          }
        });
        
        console.log('AI-generated response saved to database');
      }
    } catch (dbError) {
      console.error('Error saving AI response to database:', dbError);
      // Continue even if saving to DB fails
    }
    
    // Return the AI-generated response
    res.json({ reply: aiReply });
    
  } catch (error) {
    console.error('Error generating AI reply:', error);
    console.error('Error stack:', error.stack);
    
    // Log more details about the request
    console.error('Request data that caused the error:', req.body);
    
    // Get values from req.body to ensure they're defined in this scope
    const errorCustomerName = req.body.customerName || 'Customer';
    const errorTitle = req.body.title || 'your inquiry';
    const errorDescription = req.body.description || '';
    
    // Try to generate a more intelligent fallback response using any available company data
    let fallbackReply = '';
    
    try {
      console.log('Attempting to generate intelligent fallback response');
      
      // Get company data if available
      const companyData = await prisma.companyData.findMany();
      
      if (companyData && companyData.length > 0) {
        // Simple keyword matching for fallback
        const queryLower = `${errorTitle} ${errorDescription}`.toLowerCase();
        const keywords = queryLower.split(/\W+/).filter(word => word.length > 3);
        
        // Find any potentially relevant data
        let relevantData = [];
        
        for (const data of companyData) {
          const content = `${data.name} ${data.description || ''} ${data.content}`.toLowerCase();
          let matches = 0;
          
          for (const keyword of keywords) {
            if (content.includes(keyword)) {
              matches++;
            }
          }
          
          if (matches > 0) {
            relevantData.push({
              data,
              matches
            });
          }
        }
        
        // Sort by number of matches and take top 2
        relevantData.sort((a, b) => b.matches - a.matches);
        relevantData = relevantData.slice(0, 2).map(item => item.data);
        
        if (relevantData.length > 0) {
          // Generate a fallback response with some relevant information
          fallbackReply = `Dear ${errorCustomerName},\n\nThank you for contacting our support team regarding "${errorTitle}". We have received your request and are working on addressing your concerns.\n\nWhile we prepare a more detailed response, you might find the following information helpful:\n\n${relevantData[0].content}\n\nOur team will review the details you've provided and get back to you with a more specific response shortly. In the meantime, please let us know if you have any additional information that might help us resolve your issue more efficiently.\n\nBest regards,\nSupport Team`;
        }
      }
    } catch (fallbackError) {
      console.error('Error generating intelligent fallback:', fallbackError);
      // Continue to basic fallback if intelligent fallback fails
    }
    
    // If we couldn't generate an intelligent fallback, use a basic one
    if (!fallbackReply) {
      fallbackReply = `Dear ${errorCustomerName},\n\nThank you for contacting our support team regarding "${errorTitle}". We have received your request and are working on addressing your concerns.\n\nOur team will review the details you've provided and get back to you with a more specific response shortly. In the meantime, please let us know if you have any additional information that might help us resolve your issue more efficiently.\n\nBest regards,\nSupport Team`;
    }
    
    console.log('Using fallback response due to error');
    res.json({ response: fallbackReply });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from database');
  process.exit(0);
});
