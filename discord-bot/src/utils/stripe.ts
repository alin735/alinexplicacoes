import Stripe from 'stripe';
import { config, LESSON_PRICE_CENTS } from '../config';

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession(data: {
  bookingId: string;
  profileId: string;
  email: string;
  year: string;
  topic: string;
  date: string;
  timeSlot: string;
}): Promise<string> {
  // Format date for display
  const dateObj = new Date(data.date);
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
  
  const [start, end] = data.timeSlot.split('-');
  const startShort = start?.trim().slice(0, 5) || start;
  const endShort = end?.trim().slice(0, 5) || end;
  const formattedTime = `${startShort}-${endShort}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Explicação de Matemática (${data.year})`,
            description: `${data.topic} - ${formattedDate} às ${formattedTime}`,
          },
          unit_amount: LESSON_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: data.email,
    metadata: {
      booking_id: data.bookingId,
      profile_id: data.profileId,
      source: 'discord',
    },
    success_url: `${config.siteUrl}/marcar?success=true&booking_id=${data.bookingId}`,
    cancel_url: `${config.siteUrl}/marcar?cancelled=true`,
  });

  return session.url || '';
}
