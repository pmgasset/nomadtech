// /var/www/nomadnet-ecommerce/pages/api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        line_items,
        customer_email,
        billing_address_collection,
        shipping_address_collection,
        success_url,
        cancel_url,
        metadata,
        automatic_tax,
        allow_promotion_codes
      } = req.body;

      // Create Checkout Sessions from body params.
      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        customer_email,
        billing_address_collection,
        shipping_address_collection,
        success_url,
        cancel_url,
        metadata,
        automatic_tax,
        allow_promotion_codes,
        payment_intent_data: {
          metadata: metadata
        }
      });

      res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('Error creating checkout session:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}