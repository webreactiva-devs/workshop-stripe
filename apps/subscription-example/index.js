import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.static("public"));

// Crear sesión de suscripción con cupón opcional
app.post("/create-subscription-session", express.json(), async (req, res) => {
  const { coupon } = req.body;
  try {
    const sessionParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
      success_url: `${process.env.YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.YOUR_DOMAIN}/cancel.html`,
    };

    if (coupon) sessionParams.discounts = [{ coupon }];
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear sesión del Customer Portal
app.post(
  "/create-customer-portal-session",
  express.json(),
  async (req, res) => {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        req.body.session_id
      );
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: process.env.YOUR_DOMAIN,
      });
      res.json({ url: portalSession.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Webhook para eventos importantes
app.post(
  "/webhook",
  express.raw({type: 'application/json'}),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === "checkout.session.completed")
      console.log("✅ Suscripción creada", event.data.object.id);
    if (event.type === "customer.subscription.deleted")
      console.log("⚠️ Suscripción cancelada", event.data.object.id);
    res.json({ received: true });
  }
);

const port = process.env.PORT || 4242;
app.listen(port, () =>
  console.log(`Servidor ejecutándose en puerto http://localhost:${port}`)
);