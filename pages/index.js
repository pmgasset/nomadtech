// /var/www/nomadnet-ecommerce/pages/index.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ShoppingCart, Wifi, MapPin, Truck, Users, Check, Star, Menu, X, CreditCard, Package, Smartphone, Globe, Shield, Zap, ArrowRight, ChevronRight, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';

const NomadNetEcommerce = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [cart, setCart] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDataPlanPromo, setShowDataPlanPromo] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const products = {
    x2000: {
      id: 'x2000',
      stripeProductId: 'prod_x2000',
      stripePriceId: 'price_x2000',
      name: 'GLiNet X2000 Spitz Plus',
      price: 400,
      originalPrice: 449,
      connectivity: '4G LTE CAT 12',
      wifi: 'Wi-Fi 6',
      description: 'Perfect starter router for reliable 4G connectivity',
      features: ['4G LTE CAT 12', 'Wi-Fi 6 (AX1800)', 'OpenWrt OS', 'VPN Ready', 'Dual-Band Wi-Fi', 'External Antenna Support'],
      ideal: ['First-time users', 'Budget-conscious nomads', 'Light internet usage', 'Backup connectivity'],
      beginnerFriendly: true
    },
    x3000: {
      id: 'x3000',
      stripeProductId: 'prod_x3000',
      stripePriceId: 'price_x3000',
      name: 'GLiNet X3000 Spitz AX',
      price: 500,
      originalPrice: 579,
      connectivity: '5G NR + 4G LTE',
      wifi: 'Wi-Fi 6 AX3000',
      description: 'Premium router with 5G speeds and dual-SIM backup',
      features: ['5G NR + 4G LTE', 'Wi-Fi 6 AX3000', 'Dual-SIM Failover', 'OpenWrt OS', 'VPN Ready', 'Advanced QoS'],
      ideal: ['Power users', 'Remote workers', 'Heavy data usage', 'Streaming enthusiasts'],
      popular: true
    }
  };

  const dataplan = {
    id: 'unlimited-data',
    stripeProductId: 'prod_unlimited_data',
    stripePriceId: 'price_unlimited_data_monthly',
    name: 'Unlimited Data Plan',
    price: 79,
    type: 'subscription',
    description: 'Truly unlimited high-speed data with no throttling',
    features: ['Unlimited high-speed data', 'No contracts', 'Cancel anytime', 'Priority network access', '5G & 4G coverage', '24/7 support']
  };

  const addRouterToCart = (product) => {
    setSelectedRouter(product);
    setCart([{ ...product, quantity: 1, isDataPlan: false }]);
    setShowDataPlanPromo(true);
    setCurrentView('add-data-plan');
  };

  const addDataPlanToCart = () => {
    setCart(prev => [...prev, { ...dataplan, quantity: 1, isDataPlan: true }]);
    setCurrentView('cart');
  };

  const skipDataPlan = () => {
    setCurrentView('cart');
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    if (productId === selectedRouter?.id) {
      setSelectedRouter(null);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const hasDataPlan = cart.some(item => item.isDataPlan);
  const hardwareTotal = cart.filter(item => !item.isDataPlan).reduce((total, item) => total + (item.price * item.quantity), 0);
  const subscriptionTotal = cart.filter(item => item.isDataPlan).reduce((total, item) => total + (item.price * item.quantity), 0);

  // Stripe Checkout Integration
  const createStripeCheckout = async () => {
    if (!customerEmail || !shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.address) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const lineItems = [];
      
      // Add hardware items (one-time purchases)
      cart.filter(item => !item.isDataPlan).forEach(item => {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.description,
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        });
      });

      // Create checkout session payload
      const checkoutData = {
        line_items: lineItems,
        mode: 'payment',
        customer_email: customerEmail,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['US'],
        },
        metadata: {
          customer_phone: customerPhone,
          has_data_plan: hasDataPlan.toString(),
          cart_items: JSON.stringify(cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            isDataPlan: item.isDataPlan
          })))
        },
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cart`,
        automatic_tax: { enabled: true },
        allow_promotion_codes: true,
      };

      // If there's a data plan, we'll handle it in the success flow
      if (hasDataPlan) {
        checkoutData.metadata.subscription_price_id = dataplan.stripePriceId;
      }

      // Call backend API to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Something went wrong. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Progress indicator for checkout flow
  const getProgressStep = () => {
    if (currentView === 'products' || currentView === 'home') return 1;
    if (currentView === 'add-data-plan') return 2;
    if (currentView === 'cart') return 3;
    if (currentView === 'checkout') return 4;
    return 1;
  };

  const ProgressIndicator = () => {
    const step = getProgressStep();
    const steps = [
      { number: 1, title: 'Choose Router', active: step >= 1 },
      { number: 2, title: 'Add Data Plan', active: step >= 2 },
      { number: 3, title: 'Review Order', active: step >= 3 },
      { number: 4, title: 'Checkout', active: step >= 4 }
    ];

    if (currentView === 'home' || currentView === 'about' || currentView === 'support') return null;

    return (
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.number}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    stepItem.active 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-300'
                  }`}>
                    {stepItem.active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-semibold">{stepItem.number}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    stepItem.active ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className={`h-4 w-4 ${
                    step > stepItem.number ? 'text-blue-600' : 'text-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Header = () => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
            <Wifi className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">NomadConnect</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => setCurrentView('products')} className="text-gray-700 hover:text-blue-600 transition">
              Products
            </button>
            <button onClick={() => setCurrentView('about')} className="text-gray-700 hover:text-blue-600 transition">
              Why Choose Us
            </button>
            <button onClick={() => setCurrentView('support')} className="text-gray-700 hover:text-blue-600 transition">
              Support
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentView('cart')}
              className="relative p-2 text-gray-700 hover:text-blue-600 transition"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-2">
            <button onClick={() => { setCurrentView('products'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">
              Products
            </button>
            <button onClick={() => { setCurrentView('about'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">
              Why Choose Us
            </button>
            <button onClick={() => { setCurrentView('support'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">
              Support
            </button>
          </div>
        </div>
      )}
    </header>
  );

  const HeroSection = () => (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full inline-block mb-6">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Check className="h-4 w-4" />
              Perfect for Beginners • Pre-Configured • Ready to Use
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Internet <span className="text-blue-600">Anywhere</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Never worry about connectivity again. Our routers arrive <strong>fully configured</strong> and ready to activate. 
            No technical knowledge required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => setCurrentView('products')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setCurrentView('about')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition"
            >
              Learn More
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Plug & Play Ready</h3>
              <p className="text-gray-600">Arrives pre-configured with SIM card installed. Just plug in and you're online.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <HelpCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Beginner Friendly</h3>
              <p className="text-gray-600">No technical setup required. Perfect for those new to cellular internet.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">30-Day Guarantee</h3>
              <p className="text-gray-600">Try risk-free with our money-back guarantee and free return shipping.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative">
      {product.popular && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 font-semibold">
          Most Popular Choice
        </div>
      )}
      
      {product.beginnerFriendly && (
        <div className="absolute top-4 left-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold z-10">
          Beginner Friendly
        </div>
      )}
      
      <div className="p-6">
        <div className="aspect-video bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
          <div className="text-center">
            <Wifi className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">{product.name}</p>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl font-bold text-blue-600">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          
          <div className="flex justify-center gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {product.connectivity}
            </span>
            <span className="flex items-center gap-1">
              <Wifi className="h-4 w-4" />
              {product.wifi}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {product.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Perfect for:</h4>
          <div className="flex flex-wrap gap-2">
            {product.ideal.map((use, index) => (
              <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                {use}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ships Ready to Use
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✅ Pre-configured with your settings</li>
            <li>✅ SIM card installed and activated</li>
            <li>✅ First 30 days of data included</li>
            <li>✅ Just plug in and connect devices</li>
          </ul>
        </div>

        <button
          onClick={() => addRouterToCart(product)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          Choose This Router
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Step 1: Choose Your Router
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          Both routers arrive <strong>fully configured and ready to use</strong>. No technical setup required.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 mb-1">New to cellular internet?</h3>
              <p className="text-blue-800 text-sm">
                Don't worry! Both routers work the same way - we handle all the technical setup. 
                Your router arrives ready to plug in and use immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <ProductCard product={products.x2000} />
        <ProductCard product={products.x3000} />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Quick Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Feature</th>
                <th className="text-center py-4 px-4">X2000 Spitz Plus</th>
                <th className="text-center py-4 px-4">X3000 Spitz AX</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-4 px-4 font-medium">Best For</td>
                <td className="py-4 px-4 text-center">First-time users & budget-conscious</td>
                <td className="py-4 px-4 text-center">Power users & remote workers</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium">Price</td>
                <td className="py-4 px-4 text-center font-semibold text-green-600">$400</td>
                <td className="py-4 px-4 text-center font-semibold text-blue-600">$500</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium">Network</td>
                <td className="py-4 px-4 text-center">4G LTE (Fast)</td>
                <td className="py-4 px-4 text-center">5G + 4G (Fastest)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium">Max Devices</td>
                <td className="py-4 px-4 text-center">32 devices</td>
                <td className="py-4 px-4 text-center">64 devices</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium">Backup SIM</td>
                <td className="py-4 px-4 text-center">❌</td>
                <td className="py-4 px-4 text-center">✅ Dual-SIM failover</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium">Setup Required</td>
                <td className="py-4 px-4 text-center text-green-600 font-semibold">None - Plug & Play</td>
                <td className="py-4 px-4 text-center text-green-600 font-semibold">None - Plug & Play</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const AddDataPlanView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Step 2: Add Unlimited Data Plan
        </h2>
        <p className="text-xl text-gray-600 mb-6">
          Your <strong>{selectedRouter?.name}</strong> is ready! Add our unlimited data plan to get online immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Selected Router Summary */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
              <Check className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-green-800">Your Selected Router</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{selectedRouter?.name}</h4>
            <p className="text-gray-600 text-sm mb-3">{selectedRouter?.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">${selectedRouter?.price}</span>
              <span className="text-sm text-gray-500">Ready to ship</span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span>Ships fully configured</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span>SIM card pre-installed</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <Check className="h-4 w-4" />
              <span>30 days of data included</span>
            </div>
          </div>
        </div>

        {/* Data Plan Option */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlimited Data Plan</h3>
            <p className="text-gray-600 mb-4">Complete your setup with truly unlimited high-speed data</p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-4xl font-bold text-blue-600">$79</span>
              <span className="text-lg text-gray-600">/month</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {dataplan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Why You Need This:</h4>
            <p className="text-blue-800 text-sm">
              Your router needs a data plan to connect to the internet. While it includes 30 days free, 
              adding this plan ensures uninterrupted service from day one.
            </p>
          </div>

          <button
            onClick={addDataPlanToCart}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
          >
            Add Data Plan - $79/month
          </button>
          
          <button
            onClick={skipDataPlan}
            className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition"
          >
            Skip for now (you can add later)
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Reminder for Beginners</h3>
            <p className="text-yellow-800 text-sm">
              Your router includes 30 days of unlimited data, so you'll have internet right away. 
              You can always add or change your data plan later from your account dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const CartView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Step 3: Review Your Order
      </h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Let's get you started with a router</p>
          <button 
            onClick={() => setCurrentView('products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Choose a Router
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        {item.isDataPlan && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                            Monthly Subscription
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{item.description}</p>
                      <p className="text-blue-600 font-semibold mt-2">
                        ${item.price}{item.isDataPlan ? '/mo' : ''} each
                      </p>
                      {item.isDataPlan && (
                        <p className="text-green-600 text-sm mt-1">
                          Cancel anytime • No contracts
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!hasDataPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Add a Data Plan?</h3>
                <p className="text-blue-800 text-sm mb-4">
                  Your router includes 30 days of data, but adding a plan ensures uninterrupted service.
                </p>
                <button 
                  onClick={() => setCurrentView('add-data-plan')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Add Data Plan
                </button>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-600">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}{item.isDataPlan ? '/mo' : ''}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>One-time Total</span>
                  <span className="text-blue-600">
                    ${hardwareTotal.toFixed(2)}
                  </span>
                </div>
                {hasDataPlan && (
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Monthly subscription</span>
                    <span>
                      ${subscriptionTotal.toFixed(2)}/mo
                    </span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setCurrentView('checkout')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Proceed to Checkout
              </button>
              
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Ships fully configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>30 days of data included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const CheckoutView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Step 4: Secure Checkout
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="Email address *" 
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input 
                type="tel" 
                placeholder="Phone number" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="First name *" 
                  value={shippingInfo.firstName}
                  onChange={(e) => setShippingInfo(prev => ({...prev, firstName: e.target.value}))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Last name *" 
                  value={shippingInfo.lastName}
                  onChange={(e) => setShippingInfo(prev => ({...prev, lastName: e.target.value}))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <input 
                type="text" 
                placeholder="Address *" 
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo(prev => ({...prev, address: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="City *" 
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo(prev => ({...prev, city: e.target.value}))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input 
                  type="text" 
                  placeholder="ZIP code *" 
                  value={shippingInfo.zipCode}
                  onChange={(e) => setShippingInfo(prev => ({...prev, zipCode: e.target.value}))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-semibold">Secure Stripe Checkout</p>
              <p className="text-blue-600 text-sm">Your payment information is encrypted and secure</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    {item.isDataPlan && (
                      <p className="text-xs text-green-600">Monthly subscription • Cancel anytime</p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}{item.isDataPlan ? '/mo' : ''}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Hardware Subtotal</span>
                <span>${hardwareTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax</span>
                <span className="text-gray-600">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total Today</span>
                <span className="text-blue-600">
                  ${hardwareTotal.toFixed(2)}
                </span>
              </div>
              {hasDataPlan && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Monthly billing starts in 30 days</span>
                  <span>
                    ${subscriptionTotal.toFixed(2)}/mo
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">What Happens Next:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Router ships within 24 hours</li>
              <li>✅ Arrives fully configured with SIM</li>
              <li>✅ 30 days of unlimited data included</li>
              <li>✅ Just plug in and you're online</li>
              <li>✅ No technical setup required</li>
              <li>✅ 30-day money-back guarantee</li>
            </ul>
          </div>

          <button 
            onClick={createStripeCheckout}
            disabled={isProcessingPayment || !customerEmail || !shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.address}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Complete Order - ${hardwareTotal.toFixed(2)}
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            By completing your order, you agree to our Terms of Service and Privacy Policy.
            {hasDataPlan && ' Your subscription can be cancelled anytime from your account dashboard.'}
          </p>
        </div>
      </div>
    </div>
  );

  const AboutView = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Perfect for Beginners & Pros Alike
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          No technical knowledge required. Every router ships <strong>fully configured</strong> and ready to activate upon delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="bg-green-100 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Package className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Zero Setup Required</h3>
          <p className="text-gray-600">
            Every router is pre-configured with your SIM card installed and activated. 
            Simply unbox, plug in, and you're online in minutes.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-blue-100 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <HelpCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Beginner Friendly</h3>
          <p className="text-gray-600">
            New to cellular internet? Don't worry! Our routers are designed for anyone to use. 
            No passwords to configure, no networks to setup.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Users className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Built for Your Lifestyle</h3>
          <p className="text-gray-600">
            Whether you're in an RV, remote cabin, or traveling for work, 
            our routers provide reliable internet wherever you go.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
              What Makes Us Different
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Pre-Configured Setup</h4>
                  <p className="text-gray-600">Other companies ship blank routers. We pre-configure everything so you're online immediately.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Beginner-First Approach</h4>
                  <p className="text-gray-600">Designed for people who just want internet that works, not a technical project.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">30 Days Included</h4>
                  <p className="text-gray-600">Start using internet immediately with 30 days of unlimited data included with every router.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Customer Success Story</h4>
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-600 italic mb-4">
                "I was terrified of setting up cellular internet, but this was literally plug and play. 
                My router arrived, I plugged it in, and I had fast internet in my RV immediately. 
                Perfect for someone like me who isn't tech-savvy!"
              </blockquote>
              <cite className="text-sm text-gray-500">- Mike R., First-time RV owner</cite>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SupportView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Support & FAQ</h2>
        <p className="text-xl text-gray-600">
          Common questions from beginners and experienced users
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">For Beginners</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">I'm not technical at all. Will this work for me?</h4>
              <p className="text-gray-600">
                Absolutely! We designed this specifically for non-technical users. Your router arrives completely set up. 
                Just plug it into power and you're online. No passwords, no configuration needed.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What exactly do I need to do when it arrives?</h4>
              <p className="text-gray-600">
                Just three steps: 1) Unbox your router, 2) Plug it into power, 3) Connect your devices to the wifi network (password is printed on the router). That's it!
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Will I have internet immediately?</h4>
              <p className="text-gray-600">
                Yes! Your router includes 30 days of unlimited data that activates as soon as you plug it in. No waiting, no activation calls.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What if I can't get it to work?</h4>
              <p className="text-gray-600">
                Our support team helps beginners every day. We'll walk you through everything step-by-step. Plus, you have 30 days to return it if you're not satisfied.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How many devices can connect?</h4>
              <p className="text-gray-600">
                X2000: Up to 32 devices (phones, laptops, tablets, etc.). X3000: Up to 64 devices. Perfect for families or small teams.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What's the difference between 4G and 5G?</h4>
              <p className="text-gray-600">
                5G is faster where available (up to 10x faster downloads). The X3000 automatically switches between 5G and 4G based on what's available in your location.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I use this for streaming and video calls?</h4>
              <p className="text-gray-600">
                Yes! Our unlimited plans have no throttling or data caps. Stream Netflix, do Zoom calls, work remotely - just like home internet.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">24/7 Beginner Support</h3>
            <p className="text-blue-700 mb-4">
              Our support team specializes in helping first-time users. No question is too basic.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
              Contact Support
            </button>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Risk-Free Trial</h3>
            <p className="text-green-700 mb-4">
              Not satisfied? Return within 30 days for a full refund. We even pay return shipping.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:green-700 transition">
              Return Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'products':
        return <ProductsView />;
      case 'add-data-plan':
        return <AddDataPlanView />;
      case 'cart':
        return <CartView />;
      case 'checkout':
        return <CheckoutView />;
      case 'about':
        return <AboutView />;
      case 'support':
        return <SupportView />;
      default:
        return (
          <>
            <HeroSection />
            <div id="products">
              <ProductsView />
            </div>
          </>
        );
    }
  };

  return (
    <>
      <Head>
        <title>NomadConnect - Internet Anywhere</title>
        <meta name="description" content="Cellular routers for digital nomads, RV travelers, and rural homesteaders. Pre-configured and ready to use." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProgressIndicator />
        {renderView()}
        
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <Wifi className="h-6 w-6 text-blue-400 mr-2" />
                  <span className="text-lg font-bold">NomadConnect</span>
                </div>
                <p className="text-gray-400">
                  Pre-configured internet for the mobile lifestyle. No setup required.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Products</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>GLiNet X2000 (Beginner)</li>
                  <li>GLiNet X3000 (Premium)</li>
                  <li>Unlimited Data Plans</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Beginner Help</li>
                  <li>Setup Guides</li>
                  <li>24/7 Support</li>
                  <li>Return Policy</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>About Us</li>
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 NomadConnect. All rights reserved. • Internet anywhere, setup-free.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default NomadNetEcommerce;