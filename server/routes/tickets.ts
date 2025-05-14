import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// Get all tickets with filtering options
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, categoryId, assigneeId, creatorId } = req.query;
    
    const where: any = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (categoryId) where.categoryId = categoryId as string;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (creatorId) where.creatorId = creatorId as string;
    
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
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
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
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
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create a new ticket
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, priority, creatorId, assigneeId, categoryId, tags } = req.body;
    
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        creator: {
          connect: { id: creatorId },
        },
        ...(assigneeId && {
          assignee: {
            connect: { id: assigneeId },
          },
        }),
        category: {
          connect: { id: categoryId },
        },
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map((tagId: string) => ({
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
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update a ticket
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, assigneeId, categoryId } = req.body;
    
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId && {
          assignee: {
            connect: { id: assigneeId },
          },
        }),
        ...(categoryId && {
          category: {
            connect: { id: categoryId },
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
    
    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Add a comment to a ticket
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { content, userId } = req.body;
    
    const comment = await prisma.comment.create({
      data: {
        content,
        ticket: {
          connect: { id: req.params.id },
        },
        user: {
          connect: { id: userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a ticket
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // First delete all comments associated with the ticket
    await prisma.comment.deleteMany({
      where: { ticketId: req.params.id },
    });
    
    // Then delete all tag associations
    await prisma.tagsOnTickets.deleteMany({
      where: { ticketId: req.params.id },
    });
    
    // Finally delete the ticket
    await prisma.ticket.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
