import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripe: Stripe | null = null;

export function getStripe() {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripe) {
    stripe = new Stripe(stripeSecretKey);
  }
  return stripe;
}
