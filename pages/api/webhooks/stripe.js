// /var/www/nomadnet-ecommerce/pages/api/webhooks/stripe.js
import { buffer } from 'micro';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  try {
    // Get line items to understand what was purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });

    console.log('Line items:', lineItems.data.length);

    // Parse cart items from metadata
    const cartItems = JSON.parse(session.metadata?.cart_items || '[]');
    const hasDataPlan = session.metadata?.has_data_plan === 'true';
    const routerModel = session.metadata?.router_model;

    // Create or retrieve customer
    let customerId = session.customer;
    if (!customerId && session.customer_email) {
      // Create customer if one wasn't created during checkout
      const customer = await stripe.customers.create({
        email: session.customer_email,
        name: session.customer_details?.name,
        metadata: {
          created_from: 'checkout_session',
          session_id: session.id,
        },
      });
      customerId = customer.id;
    }

    // Log successful checkout for now (replace with database operations)
    console.log('Checkout completed successfully:', {
      session_id: session.id,
      customer_id: customerId,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      has_data_plan: hasDataPlan,
      router_model: routerModel,
      cart_items: cartItems.length,
      line_items: lineItems.data.length,
    });

    // Here you would typically:
    // 1. Create order record in database
    // 2. Create customer record if new
    // 3. Send order confirmation email
    // 4. Trigger fulfillment process
    // 5. Set up subscription if data plan was purchased

    await sendOrderConfirmationEmail({
      customer_email: session.customer_email || session.customer_details?.email,
      session_id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      cart_items: cartItems,
      shipping_address: session.shipping_details?.address,
    });

    // If subscription was included, it will be handled by separate webhook events

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  // Update order status to paid if this was a one-time payment
  // This would typically update your database order status
  console.log('Payment confirmed for amount:', paymentIntent.amount, paymentIntent.currency);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // Handle successful subscription payment
  // This fires for recurring subscription payments
  if (invoice.subscription) {
    console.log('Subscription payment successful:', invoice.subscription);
    
    // Here you would:
    // 1. Update subscription status in database
    // 2. Ensure service continues
    // 3. Send payment confirmation email
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  // Handle failed subscription payment
  if (invoice.subscription) {
    console.log('Subscription payment failed:', invoice.subscription);
    
    // Here you would:
    // 1. Update subscription status in database
    // 2. Send payment failure notification
    // 3. Potentially suspend service after retry period
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  // Handle new subscription creation
  // This typically happens after checkout session completion for subscriptions
  console.log('New subscription for customer:', subscription.customer);
  
  // Here you would:
  // 1. Create subscription record in database
  // 2. Activate service for customer
  // 3. Send welcome email
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  // Handle subscription changes (plan changes, quantity updates, etc.)
  // Update your database accordingly
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  // Handle subscription cancellation
  // This fires when a subscription is canceled
  console.log('Subscription canceled for customer:', subscription.customer);
  
  // Here you would:
  // 1. Update subscription status in database
  // 2. Schedule service termination
  // 3. Send cancellation confirmation
}

async function sendOrderConfirmationEmail(orderData) {
  // Placeholder for email sending logic
  // In a real app, you'd use SendGrid, AWS SES, or similar service
  
  console.log('Sending order confirmation email to:', orderData.customer_email);
  console.log('Order details:', {
    session_id: orderData.session_id,
    amount: orderData.amount_total,
    currency: orderData.currency,
    items: orderData.cart_items?.length || 0,
  });

  // Example with SendGrid (uncomment and configure):
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: orderData.customer_email,
    from: process.env.FROM_EMAIL || 'orders@nomadnet.com',
    subject: 'Order Confirmation - NomadNet',
    html: generateOrderConfirmationHTML(orderData),
  };

  try {
    await sgMail.send(msg);
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
  */
}

function generateOrderConfirmationHTML(orderData) {
  // Generate HTML email template
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">NomadNet</h1>
        <h2 style="color: #374151;">Order Confirmation</h2>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Order Details</h3>
        <p><strong>Order ID:</strong> ${orderData.session_id}</p>
        <p><strong>Total:</strong> ${formatCurrency(orderData.amount_total, orderData.currency)}</p>
        <p><strong>Items:</strong> ${orderData.cart_items?.length || 0} item(s)</p>
      </div>

      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #065f46; margin-top: 0;">What's Next?</h3>
        <ul style="color: #047857;">
          <li>Your router will ship within 24 hours</li>
          <li>You'll receive tracking information via email</li>
          <li>Your router arrives pre-configured and ready to use</li>
          <li>Just plug in and you're online!</li>
        </ul>
      </div>

      ${orderData.shipping_address ? `
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Shipping Address</h3>
        <p style="margin: 0;">
          ${orderData.shipping_address.line1}<br>
          ${orderData.shipping_address.line2 ? orderData.shipping_address.line2 + '<br>' : ''}
          ${orderData.shipping_address.city}, ${orderData.shipping_address.state} ${orderData.shipping_address.postal_code}<br>
          ${orderData.shipping_address.country}
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280;">
          Questions? Contact our support team at 
          <a href="mailto:support@nomadnet.com" style="color: #2563eb;">support@nomadnet.com</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Thank you for choosing NomadNet for your connectivity needs!
        </p>
      </div>
    </body>
    </html>
  `;
}