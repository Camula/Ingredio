import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { authMiddleware } from '@ingredio/shared';
import fridgeRoutes from './routes/fridge.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT_FRIDGE || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/ingredio';

// Konfiguracja Swaggera
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ingredio Fridge Service API',
      version: '1.0.0',
      description: 'API for Virtual Fridge and Inventory Management',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

// Ścieżki
app.use('/api/fridge', authMiddleware(JWT_SECRET), fridgeRoutes);

// Endpoint kontrolny (health check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fridge-service' });
});

// Połączenie z MongoDB i uruchomienie serwera
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Fridge Service connected to MongoDB');
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Fridge service running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
