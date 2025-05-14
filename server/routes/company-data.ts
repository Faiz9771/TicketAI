import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { EventEmitter } from 'events';
import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import '../prisma-types';

const router = express.Router();
const prisma = new PrismaClient();

// Create an event emitter for training status updates
const trainingEvents = new EventEmitter();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Initialize Llama model
let llamaModel: any = null;
let llamaContext: any = null;
let chatSession: any = null;

async function initializeLlama() {
  if (!llamaModel) {
    try {
      // Get model config from database or use defaults
      let modelConfig = await prisma.AIModelConfig.findFirst();
      
      if (!modelConfig) {
        modelConfig = await prisma.AIModelConfig.create({
          data: {
            modelName: 'llama-2-7b-chat',
            temperature: 0.7,
            maxTokens: 2048
          }
        });
      }
      
      const modelPath = process.env.LLAMA_MODEL_PATH || path.join(__dirname, `../models/${modelConfig.modelName}.gguf`);
      
      // Using any type to avoid TypeScript errors with the Llama library
      // In a production environment, you would want to properly type these
      llamaModel = await (LlamaModel as any).load({
        modelPath,
        contextSize: modelConfig.maxTokens,
        batchSize: 512,
      });
      
      llamaContext = await (LlamaContext as any).create({ 
        model: llamaModel,
        temperature: modelConfig.temperature 
      });
      
      chatSession = await (LlamaChatSession as any).create({ context: llamaContext });
    } catch (error) {
      console.error('Error initializing Llama model:', error);
      throw error;
    }
  }
}

// Database health check
router.get('/db-health', async (req: Request, res: Response) => {
  try {
    console.log('Checking database connection...');
    // Try a simple query to verify database connection
    const count = await prisma.companyData.count();
    console.log('Database connection successful. CompanyData count:', count);
    
    // Check if AIModelConfig table exists and is accessible
    let modelConfigExists = false;
    try {
      const modelConfigCount = await prisma.AIModelConfig.count();
      modelConfigExists = true;
      console.log('AIModelConfig table accessible. Count:', modelConfigCount);
    } catch (modelError) {
      console.error('Error accessing AIModelConfig table:', modelError);
    }
    
    return res.json({ 
      status: 'ok', 
      databaseConnected: true, 
      companyDataCount: count,
      modelConfigAccessible: modelConfigExists
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(500).json({ 
      status: 'error', 
      databaseConnected: false, 
      error: String(error)
    });
  }
});

// Get all company data
router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await prisma.companyData.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(data);
  } catch (error) {
    console.error('Error fetching company data:', error);
    return res.status(500).json({ error: 'Failed to fetch company data' });
  }
});

// Add new company data (direct text input)
router.post('/', async (req: Request, res: Response) => {
  try {
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

// Upload company data file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('=== Upload Route Started ===');
    console.log('Request received:', {
      file: req.file ? {
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      } : 'No file'
    });

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    console.log('File extension:', ext);
    let fileContent = '';

    if (ext === '.pdf') {
      console.log('Processing PDF file...');
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        console.log('PDF file read successfully, size:', fileBuffer.length);
        const data = await pdfParse(fileBuffer);
        fileContent = data.text;
        console.log('PDF text extracted, length:', fileContent.length);
      } catch (readError) {
        console.error('Error extracting text from PDF:', readError);
        return res.status(500).json({ error: 'Failed to extract text from PDF' });
      }
    } else if (ext === '.txt') {
      console.log('Processing TXT file...');
      try {
        fileContent = fs.readFileSync(req.file.path, 'utf-8');
        console.log('TXT file read successfully, length:', fileContent.length);
      } catch (readError) {
        console.error('Error reading text file:', readError);
        return res.status(500).json({ error: 'Failed to read uploaded text file' });
      }
    } else {
      console.error('Unsupported file type:', ext);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type. Only PDF and TXT are supported.' });
    }

    console.log('Attempting to save to database...');
    try {
      const result = await prisma.$executeRaw`
        INSERT INTO CompanyData (id, name, description, content, type, createdAt, updatedAt)
        VALUES (cuid(), ${req.file.originalname}, ${`Uploaded file: ${req.file.originalname}`}, ${fileContent}, 'documentation', datetime('now'), datetime('now'))
      `;
      console.log('Database insert result:', result);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save file content to database' });
    }

    console.log('Cleaning up uploaded file...');
    try {
      fs.unlinkSync(req.file.path);
      console.log('File cleanup successful');
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    console.log('=== Upload Route Completed Successfully ===');
    res.json({ success: true, message: 'File uploaded and processed successfully' });
  } catch (error) {
    console.error('Error in file upload route:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Generate AI response
router.post('/generate-response', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Initialize Llama if not already initialized
    await initializeLlama();

    // Get relevant company data
    const companyData = await prisma.$queryRaw`SELECT * FROM CompanyData`;
    const context = (companyData as any[]).map(data => `${data.name}:\n${data.content}`).join('\n\n');

    // Create prompt with company data context
    const prompt = `You are a helpful customer support assistant. Use the following company information to answer the customer's question:

${context}

Customer Question: ${query}

Please provide a helpful and accurate response based on the company information above.`;

    // Generate response using Llama
    if (!chatSession) {
      throw new Error('Chat session not initialized');
    }
    const response = await chatSession.prompt(prompt);
    
    res.json({ response });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Update Llama model settings
router.post('/update-model-settings', async (req: Request, res: Response) => {
  try {
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
    
    // Reset existing model
    llamaModel = null;
    llamaContext = null;
    chatSession = null;

    // Initialize new model with updated settings
    await initializeLlama();
    
    return res.json({ message: 'Model settings updated successfully', modelConfig });
  } catch (error) {
    console.error('Error updating model settings:', error);
    return res.status(500).json({ error: 'Failed to update model settings' });
  }
});

// Get model configuration and status
router.get('/model-config', async (req: Request, res: Response) => {
  console.log('GET /model-config endpoint called');
  try {
    console.log('Attempting to fetch model config from database...');
    let modelConfig = await prisma.AIModelConfig.findFirst();
    console.log('Database query result:', modelConfig);
    
    if (!modelConfig) {
      console.log('No model config found, creating default config...');
      modelConfig = await prisma.AIModelConfig.create({
        data: {
          modelName: 'llama-2-7b-chat',
          temperature: 0.7,
          maxTokens: 2048
        }
      });
      console.log('Created default model config:', modelConfig);
    }
    
    console.log('Sending model config response');
    return res.json(modelConfig);
  } catch (error) {
    console.error('Error fetching model configuration:', error);
    return res.status(500).json({ error: 'Failed to fetch model configuration', details: String(error) });
  }
});

// Train model on company data
router.post('/train-model', async (req: Request, res: Response) => {
  try {
    // Get model config
    let modelConfig = await prisma.AIModelConfig.findFirst();
    
    if (!modelConfig) {
      return res.status(400).json({ error: 'Model configuration not found' });
    }
    
    // Check if training is already in progress
    if (modelConfig.trainingStatus === 'training') {
      return res.status(400).json({ 
        error: 'Training is already in progress', 
        progress: modelConfig.trainingProgress 
      });
    }
    
    // Update training status
    modelConfig = await prisma.AIModelConfig.update({
      where: { id: modelConfig.id },
      data: {
        trainingStatus: 'training',
        trainingProgress: 0
      }
    });
    
    // Start training in background
    setTimeout(async () => {
      try {
        // Get all company data
        const companyData = await prisma.companyData.findMany();
        
        if (companyData.length === 0) {
          await prisma.AIModelConfig as any.update({
            where: { id: modelConfig!.id },
            data: {
              trainingStatus: 'failed',
              trainingProgress: 0
            }
          });
          trainingEvents.emit('training-update', { status: 'failed', error: 'No training data available' });
          return;
        }
        
        // Simulate training process (in a real implementation, this would be actual model fine-tuning)
        const totalSteps = 10;
        for (let step = 1; step <= totalSteps; step++) {
          // Update progress
          const progress = Math.round((step / totalSteps) * 100);
          await prisma.AIModelConfig as any.update({
            where: { id: modelConfig!.id },
            data: {
              trainingProgress: progress
            }
          });
          
          trainingEvents.emit('training-update', { status: 'training', progress });
          
          // Simulate training time
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Training complete
        await prisma.AIModelConfig as any.update({
          where: { id: modelConfig!.id },
          data: {
            trainingStatus: 'trained',
            trainingProgress: 100,
            lastTrainedAt: new Date()
          }
        });
        
        // Reset model to load new training
        llamaModel = null;
        llamaContext = null;
        chatSession = null;
        await initializeLlama();
        
        trainingEvents.emit('training-update', { status: 'trained', progress: 100 });
      } catch (error) {
        console.error('Error during model training:', error);
        await prisma.AIModelConfig as any.update({
          where: { id: modelConfig!.id },
          data: {
            trainingStatus: 'failed',
            trainingProgress: 0
          }
        });
        trainingEvents.emit('training-update', { status: 'failed', error: String(error) });
      }
    }, 0);
    
    res.json({ message: 'Model training started', status: 'training' });
  } catch (error) {
    console.error('Error starting model training:', error);
    res.status(500).json({ error: 'Failed to start model training' });
  }
});

// Get training status
router.get('/training-status', async (req: Request, res: Response) => {
  try {
    const modelConfig = await prisma.AIModelConfig.findFirst();
    
    if (!modelConfig) {
      return res.status(404).json({ error: 'Model configuration not found' });
    }
    
    res.json({
      status: modelConfig.trainingStatus,
      progress: modelConfig.trainingProgress,
      lastTrainedAt: modelConfig.lastTrainedAt
    });
  } catch (error) {
    console.error('Error fetching training status:', error);
    res.status(500).json({ error: 'Failed to fetch training status' });
  }
});

// Clear all company data
router.delete('/clear-data', async (req: Request, res: Response) => {
  try {
    await prisma.companyData.deleteMany({});
    
    // Reset model training status
    const modelConfig = await prisma.AIModelConfig.findFirst();
    if (modelConfig) {
      await prisma.AIModelConfig.update({
        where: { id: modelConfig.id },
        data: {
          trainingStatus: 'not_trained',
          trainingProgress: 0,
          lastTrainedAt: null
        }
      });
    }
    
    res.json({ success: true, message: 'All company data has been cleared' });
  } catch (error) {
    console.error('Error clearing company data:', error);
    res.status(500).json({ error: 'Failed to clear company data' });
  }
});

export default router; 