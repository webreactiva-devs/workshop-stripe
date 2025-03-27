import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

// Constants for frontend
export const FRONTEND_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
};

export default stripe;
