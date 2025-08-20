// /var/www/nomadnet-ecommerce/pages/success.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Check, Package, Truck, Wifi, ArrowRight } from 'lucide-react';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id) {
      // In a real app, you'd fetch session details from your API
      // For now, we'll simulate a successful order
      setTimeout(() => {
        setSession({
          id: session_id,
          customer_email: 'customer@example.com',
          amount_total: 40000,
          payment_status: 'paid'
        });
        setLoading(false);
      }, 1000);
    }
  }, [session_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Order Confirmed - NomadConnect</title>
        <meta name="description" content="Your order has been confirmed and is being processed." />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/" className="flex items-center">
              <Wifi className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-2xl font-bold text-gray-900">NomadConnect</span>
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Order Confirmed! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Thank you for your purchase! Your router is being prepared for shipment.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">Order Details</span>
              </div>
              
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono">#{session_id?.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span>{session?.customer_email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">${(session?.amount_total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-green-600">Confirmed & Paid</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What Happens Next?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Configuration</h3>
                <p className="text-gray-600 text-sm">
                  Your router is being configured with your SIM card and custom settings.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Shipping</h3>
                <p className="text-gray-600 text-sm">
                  Ships within 24 hours with free expedited delivery. Tracking info will be emailed.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Connect</h3>
                <p className="text-gray-600 text-sm">
                  Just plug in and you're online! 30 days of unlimited data included.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-green-800 mb-4 flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Ready-to-Use Setup Included
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>Router pre-configured with your settings</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>SIM card installed and activated</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>WiFi network name and password set</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>30 days of unlimited data included</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>Power adapter and cables included</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>Quick start guide for beginners</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Questions about your order? Check your email for confirmation details or contact our support team.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Back to Home
              </Link>
              
              <button className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition">
                Contact Support
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}