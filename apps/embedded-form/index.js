import express from 'express';
import Stripe from 'stripe';
import { sendPaymentSuccessEmail } from './src/email-service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// Middlewares
app.use(express.static('public'));
//app.use(express.json());  // Añadido este middleware

const YOUR_DOMAIN = process.env.DOMAIN;

// Ruta para crear la sesión de checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price: "price_1QtvhIKcVaLNjy0nehd8zyOE", // Reemplazar con tu Price ID real
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${YOUR_DOMAIN}/return.html?session_id={CHECKOUT_SESSION_ID}`,
      billing_address_collection: "auto",
      payment_method_types: ["card"],
    });

    res.status(200).json({clientSecret: session.client_secret});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: {
        message: error.message,
        type: error.type,
      }
    });
  }
});

// Ruta para verificar estado de la sesión
app.get('/session-status', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  res.send({
    status: session.status,
    customer_email: session.customer_details?.email
  });
});

// Webhook
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed':
      console.log(`Evento manejado: ${event.type}`);
      const checkoutSession = event.data.object;
      console.log('Pago completado:', checkoutSession.id);
      await sendPaymentSuccessEmail(checkoutSession);
      break;
    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({received: true});
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Servidor ejecutándose en puerto http://localhost:${port}`));
