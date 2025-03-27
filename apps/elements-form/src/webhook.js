import stripe from './stripe-config.js';
import { sendPaymentSuccessEmail } from './email-service.js';
import express from 'express';

export function setupWebhookRoutes(app) {
  // Handle webhook events
  app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;

    try {
      // Verify the event with Stripe
      if (webhookSecret) {
        // Cuidado que si añades express.json() el cuerpo estará modificado
        // y la firma no coincidirá
        console.log(req.body)
        if (req.body) {
          event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            webhookSecret
          );
        } else {
          // Deberíamos lanzar un error
          console.warn('Advertencia: Verificación de firma omitida. No se encontró cuerpo raw.');
          event = req.body;
        }
      } else {
        // Deberíamos lanzar un error en producción
        // Para desarrollo sin webhook secret
        event = req.body;
      }

      // Handle the event based on type
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent ${paymentIntent.id} was successful!`);
          
          // Enviar email de confirmación
          try {
            await sendPaymentSuccessEmail(paymentIntent);
            console.log('Email de confirmación enviado correctamente');
          } catch (emailError) {
            console.error('Error al enviar email de confirmación:', emailError);
          }
          
          // Implement your business logic here
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log(`Payment failed: ${failedPayment.id}`, failedPayment.last_payment_error?.message);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error(`Webhook error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
}
