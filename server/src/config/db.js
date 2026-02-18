import mongoose from 'mongoose';
import dns from 'node:dns';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  // Use Google DNS to bypass local DNS interception (e.g. VPN/proxy)
  if (mongoUri.startsWith('mongodb+srv')) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Could not connect to MongoDB at ${mongoUri}: ${error.message}`);
    // eslint-disable-next-line no-console
    console.log('Starting in-memory MongoDB (mongodb-memory-server)...');

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();

    await mongoose.connect(memoryUri);
    // eslint-disable-next-line no-console
    console.log(`Connected to in-memory MongoDB at ${memoryUri}`);
  }
};
