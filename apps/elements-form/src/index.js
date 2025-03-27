import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bodyParser from 'body-parser';
import { setupCheckoutRoutes } from './checkout.js';
import { setupWebhookRoutes } from './webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
//app.use(express.json());

// Special JSON parser for Stripe webhooks
const webhookParser = bodyParser.raw({ type: 'application/json' });

// Routes
setupCheckoutRoutes(app);
setupWebhookRoutes(app);

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Environment: ', process.env.NODE_ENV || 'development');
});
