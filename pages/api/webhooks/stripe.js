// /var/www/nomadnet-ecommerce/pages/api/webhooks/stripe.js
import { buffer } from 'micro';
import Stripe from 'stripe';
import { prisma } from '../../../lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
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
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(session.customer);
    
    // Create or update customer in database
    const dbCustomer = await prisma.customer.upsert({
      where: { stripeCustomerId: session.customer },
      update: {
        email: session.customer_email || customer.email,
      },
      create: {
        email: session.customer_email || customer.email,
        stripeCustomerId: session.customer,
        firstName: session.shipping?.name?.split(' ')[0] || '',
        lastName: session.shipping?.name?.split(' ').slice(1).join(' ') || '',
        phone: session.customer_details?.phone || '',
      },
    });

    // Parse cart items from metadata
    const cartItems = JSON.parse(session.metadata.cart_items || '[]');
    
    // Create order
    const order = await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        customerId: dbCustomer.id,
        status: 'PAID',
        totalAmount: session.amount_total,
        currency: session.currency,
        shippingFirstName: session.shipping?.name?.split(' ')[0] || '',
        shippingLastName: session.shipping?.name?.split(' ').slice(1).join(' ') || '',
        shippingAddress: session.shipping?.address?.line1 || '',
        shippingCity: session.shipping?.address?.city || '',
        shippingState: session.shipping?.address?.state || '',
        shippingZipCode: session.shipping?.address?.postal_code || '',
        shippingCountry: session.shipping?.address?.country || 'US',
        orderItems: {
          create: cartItems
            .filter(item => !item.isDataPlan)
            .map(item => ({
              productId: item.id,
              productName: item.name,
              price: item.price * 100, // Convert to cents
              quantity: item.quantity,
            }))
        }
      },
      include: {
        orderItems: true,
        customer: true
      }
    });

    console.log('Order created:', order.id);

    // Handle data plan subscription if present
    if (session.metadata.has_data_plan === 'true') {
      await createDataPlanSubscription(dbCustomer, session.metadata.subscription_price_id);
    }

    // Send order confirmation email
    await sendOrderConfirmationEmail(order);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  // Update order status if needed
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'PAID' }
  });
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  try {
    const customer = await prisma.customer.findUnique({
      where: { stripeCustomerId: subscription.customer }
    });

    if (customer) {
      await prisma.subscription.create({
        data: {
          stripeSubscriptionId: subscription.id,
          customerId: customer.id,
          status: subscription.status.toUpperCase(),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          planId: subscription.items.data[0].price.id,
          planName: 'Unlimited Data Plan',
          planPrice: subscription.items.data[0].price.unit_amount,
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    }
  });
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    }
  });
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  // Handle successful subscription payments
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);
  // Handle failed subscription payments
  
  if (invoice.subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription },
      data: { status: 'PAST_DUE' }
    });
  }
}

async function createDataPlanSubscription(customer, priceId) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customer.stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 30, // 30 days free trial
      metadata: {
        customer_id: customer.id,
        plan_type: 'unlimited_data'
      }
    });

    console.log('Data plan subscription created:', subscription.id);
  } catch (error) {
    console.error('Error creating data plan subscription:', error);
    throw error;
  }
}

async function sendOrderConfirmationEmail(order) {
  // TODO: Implement email sending with SendGrid
  console.log('Sending order confirmation email for order:', order.id);
  
  // For now, just log the email details
  console.log('Email details:', {
    to: order.customer.email,
    subject: 'Order Confirmed - Your Router is Being Prepared!',
    orderNumber: order.id.slice(-8),
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    total: (order.totalAmount / 100).toFixed(2)
  });
}