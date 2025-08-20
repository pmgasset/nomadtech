// /var/www/nomadnet-ecommerce/pages/api/health.js
import { NextApiRequest, NextApiResponse } from 'next';

// Health check endpoint for monitoring and deployment verification
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Basic health information
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'nomadnet-ecommerce',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Check environment variables
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      health.status = 'degraded';
      health.warnings = [`Missing environment variables: ${missingEnvVars.join(', ')}`];
    }

    // Check Stripe connection
    let stripeStatus = 'unknown';
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.accounts.retrieve();
      stripeStatus = 'connected';
    } catch (error) {
      stripeStatus = 'disconnected';
      health.status = 'unhealthy';
      health.errors = health.errors || [];
      health.errors.push('Stripe connection failed');
    }

    // Add service checks
    health.checks = {
      stripe: {
        status: stripeStatus,
        timestamp: new Date().toISOString(),
      },
      environment: {
        status: missingEnvVars.length === 0 ? 'pass' : 'fail',
        missing_vars: missingEnvVars,
        timestamp: new Date().toISOString(),
      },
      database: {
        status: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        timestamp: new Date().toISOString(),
      },
    };

    // Determine overall status
    if (health.status === 'healthy' && stripeStatus !== 'connected') {
      health.status = 'degraded';
    }

    // Set appropriate HTTP status code
    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(health);

  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'nomadnet-ecommerce',
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}