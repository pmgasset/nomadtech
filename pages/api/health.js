// /var/www/nomadnet-ecommerce/pages/api/health.js
import { prisma } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check environment variables
    const envCheck = {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_'),
      hasStripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.includes('your_'),
      hasDatabase: !!process.env.DATABASE_URL,
      hasSendGrid: !!process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('your_'),
    };

    const allConfigured = Object.values(envCheck).every(Boolean);

    res.status(200).json({ 
      status: 'healthy',
      message: 'NomadConnect API is running',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: envCheck,
      configured: allConfigured,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}