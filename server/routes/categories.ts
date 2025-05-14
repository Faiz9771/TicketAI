import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
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

// Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
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
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create a new category
router.post('/', async (req: Request, res: Response) => {
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

// Update a category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
      },
    });
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Check if there are tickets using this category
    const ticketsCount = await prisma.ticket.count({
      where: { categoryId: req.params.id },
    });
    
    if (ticketsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated tickets. Reassign tickets first.' 
      });
    }
    
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
