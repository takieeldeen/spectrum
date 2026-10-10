import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { initializeSocket } from './services/socket.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize WebSocket server
initializeSocket(httpServer);

import routes from './routes';
app.use('/api', routes);

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

// Replace YOUR_CLUSTER_URL with your actual MongoDB cluster URL
const mongoUri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.tyxy7w0.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

if (dbUsername && dbPassword && dbName) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log('Connected to MongoDB via Mongoose'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('⚠️ MongoDB credentials missing in .env. Skipping database connection.');
}

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express & TypeScript!' });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
