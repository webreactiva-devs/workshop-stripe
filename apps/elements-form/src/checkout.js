import stripe, { FRONTEND_CONFIG } from './stripe-config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupCheckoutRoutes(app) {
  // Serve the checkout page
  app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/checkout.html'));
  });

  // API endpoint to get publishable key
  app.get('/config', (req, res) => {
    res.json({ publishableKey: FRONTEND_CONFIG.publishableKey });
  });

  // Create payment intent
  app.post('/create-payment-intent', async (req, res) => {
    try {
      const { amount = 1000, currency = 'eur' } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: { enabled: true }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
