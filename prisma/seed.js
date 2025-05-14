import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.tagsOnTickets.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleaned up existing data');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Technical Issue',
        description: 'Problems related to technical aspects of the product',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Billing',
        description: 'Questions or issues related to billing and payments',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Feature Request',
        description: 'Requests for new features or enhancements',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Account',
        description: 'Issues related to user accounts',
      },
    }),
  ]);

  console.log('Created categories');

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'bug',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'enhancement',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'documentation',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'urgent',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'question',
      },
    }),
  ]);

  console.log('Created tags');

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123', // In production, use hashed passwords
      role: 'ADMIN',
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'agent@example.com',
      name: 'Support Agent',
      password: 'agent123', // In production, use hashed passwords
      role: 'AGENT',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      name: 'John Customer',
      password: 'customer123', // In production, use hashed passwords
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      name: 'Jane Customer',
      password: 'customer123', // In production, use hashed passwords
      role: 'CUSTOMER',
    },
  });

  console.log('Created users');

  // Create tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Cannot login to my account',
      description: 'I am unable to login to my account since yesterday. I keep getting an error message saying "Invalid credentials".',
      status: 'OPEN',
      priority: 'HIGH',
      creator: {
        connect: { id: customer1.id },
      },
      assignee: {
        connect: { id: agent.id },
      },
      category: {
        connect: { id: categories[3].id }, // Account category
      },
      tags: {
        create: [
          {
            tag: {
              connect: { id: tags[0].id }, // bug tag
            },
          },
          {
            tag: {
              connect: { id: tags[3].id }, // urgent tag
            },
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Feature request: Dark mode',
      description: 'I would like to request a dark mode feature for the application. It would be easier on the eyes when using the app at night.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      creator: {
        connect: { id: customer2.id },
      },
      assignee: {
        connect: { id: agent.id },
      },
      category: {
        connect: { id: categories[2].id }, // Feature Request category
      },
      tags: {
        create: [
          {
            tag: {
              connect: { id: tags[1].id }, // enhancement tag
            },
          },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Billing issue with last month\'s invoice',
      description: 'I was charged twice for my subscription last month. Please check and refund the extra charge.',
      status: 'OPEN',
      priority: 'URGENT',
      creator: {
        connect: { id: customer1.id },
      },
      category: {
        connect: { id: categories[1].id }, // Billing category
      },
      tags: {
        create: [
          {
            tag: {
              connect: { id: tags[3].id }, // urgent tag
            },
          },
        ],
      },
    },
  });

  console.log('Created tickets');

  // Create comments
  await prisma.comment.create({
    data: {
      content: 'I have tried resetting my password but still cannot login.',
      ticket: {
        connect: { id: ticket1.id },
      },
      user: {
        connect: { id: customer1.id },
      },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'I will look into this issue right away. Can you please provide your username?',
      ticket: {
        connect: { id: ticket1.id },
      },
      user: {
        connect: { id: agent.id },
      },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thank you for the feature request. We are currently working on implementing dark mode.',
      ticket: {
        connect: { id: ticket2.id },
      },
      user: {
        connect: { id: agent.id },
      },
    },
  });

  console.log('Created comments');

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
