// /var/www/nomadnet-ecommerce/pages/success.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Check, Package, Truck, Wifi, ArrowRight, Home, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const SuccessPage = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id) {
      // In a real app, you'd fetch session details from your backend
      // For now, we'll just simulate the data
      setTimeout(() => {
        setSessionData({
          id: session_id,
          customer_email: 'customer@example.com',
          amount_total: 50000, // $500.00 in cents
          currency: 'usd',
          status: 'complete',
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
          <p className="text-gray-600">Confirming your order...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Wifi className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">NomadNet</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Order Successful! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase! Your router will ship within 24 hours, 
            fully configured and ready to use.
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm">{session_id}</span>
              </div>
              
              {sessionData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(sessionData.amount_total, sessionData.currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Complete
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Confirmation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span>Payment processed successfully</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span>Order confirmed and queued for shipping</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span>Confirmation email sent</span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4">What Happens Next?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Processing (0-4 hours)</h3>
                  <p className="text-blue-700 text-sm">We configure your router and prepare it for shipping.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Shipped (24-48 hours)</h3>
                  <p className="text-blue-700 text-sm">Your router ships with tracking information via email.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Delivered & Ready</h3>
                  <p className="text-blue-700 text-sm">Just plug in and you're online immediately!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits Reminder */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-green-900 mb-4">
            Your Router Ships Ready to Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-green-800">Pre-configured with all settings</span>
            </div>
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-green-600" />
              <span className="text-green-800">SIM card installed and activated</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-800">30 days of unlimited data included</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-green-600" />
              <span className="text-green-800">Free shipping & setup</span>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">Get help via email within 2 hours</p>
              <a 
                href="mailto:support@nomadnet.com" 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                support@nomadnet.com
              </a>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 text-sm mb-3">Speak with our team directly</p>
              <a 
                href="tel:1-800-NOMADNET" 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                1-800-NOMADNET
              </a>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Setup Help</h3>
              <p className="text-gray-600 text-sm mb-3">Step-by-step setup guidance</p>
              <Link 
                href="/support" 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Setup Guide
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          
          <button 
            onClick={() => window.print()}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Print Confirmation
          </button>
        </div>

        {/* Order Tracking Info */}
        <div className="mt-12 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-yellow-900 mb-2">Track Your Order</h3>
            <p className="text-yellow-800 text-sm">
              You'll receive tracking information via email within 24 hours. 
              Keep this order ID for your records: <strong>{session_id}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;