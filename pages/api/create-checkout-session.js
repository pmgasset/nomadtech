import { stripe } from '../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      line_items,
      customer_email,
      metadata,
      success_url,
      cancel_url,
      billing_address_collection,
      shipping_address_collection,
      automatic_tax,
      allow_promotion_codes
    } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email,
      billing_address_collection,
      shipping_address_collection,
      automatic_tax,
      allow_promotion_codes,
      metadata,
      success_url,
      cancel_url,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    res.status(200).json({ 
      checkout_url: session.url,
      session_id: session.id 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
