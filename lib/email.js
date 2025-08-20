import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOrderConfirmation = async (order) => {
  const msg = {
    to: order.customer.email,
    from: process.env.FROM_EMAIL,
    subject: 'Order Confirmed - Your Router is Being Prepared! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Order Confirmed! 🎉</h1>
        <p>Hi ${order.customer.firstName},</p>
        <p>Great news! Your order has been confirmed and your router is being prepared for shipment.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order #:</strong> ${order.id.slice(-8)}</p>
          <p><strong>Total:</strong> $${(order.totalAmount / 100).toFixed(2)}</p>
          <p><strong>Shipping to:</strong> ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} ${order.shippingZipCode}</p>
        </div>
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #166534;">What happens next?</h3>
          <ul style="color: #166534;">
            <li>✅ Your router ships within 24 hours</li>
            <li>✅ Arrives fully configured with SIM card</li>
            <li>✅ 30 days of unlimited data included</li>
            <li>✅ Just plug in and you're online!</li>
          </ul>
        </div>
        <p>Thanks for choosing NomadNet!</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Order confirmation email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const sendShippingNotification = async (order) => {
  const msg = {
    to: order.customer.email,
    from: process.env.FROM_EMAIL,
    subject: 'Your Router Has Shipped! 📦',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Your Router Has Shipped! 📦</h1>
        <p>Hi ${order.customer.firstName},</p>
        <p>Exciting news! Your router is on its way and should arrive within 2-3 business days.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Tracking Information</h3>
          <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
          <p><strong>Carrier:</strong> USPS</p>
          <p>
            <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber}" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Track Your Package
            </a>
          </p>
        </div>
        <p>Need help? Our support team is standing by!</p>
      </div>
    `
  };
  await sgMail.send(msg);
};
