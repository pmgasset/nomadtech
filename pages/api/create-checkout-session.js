// /var/www/nomadnet-ecommerce/pages/api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      line_items,
      customer_email,
      metadata,
      success_url,
      cancel_url,
      billing_address_collection = 'required',
      shipping_address_collection = { allowed_countries: ['US', 'CA'] },
      automatic_tax = { enabled: true },
      allow_promotion_codes = true,
    } = req.body;

    // Validate required fields
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'line_items is required and must be a non-empty array' });
    }

    if (!success_url || !cancel_url) {
      return res.status(400).json({ error: 'success_url and cancel_url are required' });
    }

    // Determine if this has subscriptions
    const hasSubscriptions = line_items.some(item => item.price && typeof item.price === 'string');
    const hasOneTimeItems = line_items.some(item => item.price_data);

    let mode = 'payment';
    if (hasSubscriptions && !hasOneTimeItems) {
      mode = 'subscription';
    } else if (hasSubscriptions && hasOneTimeItems) {
      mode = 'subscription'; // Stripe handles mixed mode automatically
    }

    // Create Stripe checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items,
      mode,
      billing_address_collection,
      shipping_address_collection,
      automatic_tax,
      allow_promotion_codes,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
      success_url,
      cancel_url,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    };

    // Add customer email if provided
    if (customer_email) {
      sessionConfig.customer_email = customer_email;
    }

    // For subscriptions, add additional configuration
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: metadata || {},
      };
    }

    // For payment mode, add payment intent data
    if (mode === 'payment') {
      sessionConfig.payment_intent_data = {
        metadata: metadata || {},
        setup_future_usage: 'on_session', // Enable saving payment method for future use
      };
    }

    console.log('Creating Stripe checkout session with config:', {
      mode,
      line_items_count: line_items.length,
      has_subscriptions: hasSubscriptions,
      has_one_time: hasOneTimeItems,
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.status(200).json({
      checkout_url: session.url,
      session_id: session.id,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide more specific error messages for common issues
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: 'Your card was declined.' });
    }
    
    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.type === 'StripeAPIError') {
      return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
    
    if (error.type === 'StripeConnectionError') {
      return res.status(500).json({ error: 'Network error. Please check your connection.' });
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ error: 'Authentication error. Please contact support.' });
    }

    // Generic error
    res.status(500).json({ error: 'Internal server error' });
  }
}