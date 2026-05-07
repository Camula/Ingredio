import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT_AUTH || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/ingredio';

// Konfiguracja Swaggera
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ingredio Auth Service API',
      version: '1.0.0',
      description: 'API for User Authentication and Profile Management',
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
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

// Ścieżki
app.use('/api/auth', authRoutes);

// Endpoint kontrolny (health check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Połączenie z MongoDB i uruchomienie serwera
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Auth service running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
