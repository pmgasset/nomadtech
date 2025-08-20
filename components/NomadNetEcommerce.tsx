// components/NomadNetEcommerce.tsx
import React, { useState } from 'react';
import { Wifi, ShoppingCart, Menu, X, Check, Shield, Zap, Users, Phone, Mail, MapPin, Star, ChevronRight, Plus, Minus, Trash2 } from 'lucide-react';

// Define types
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  features: string[];
  connectivity?: string;
  stripePriceId?: string;
  priceId?: string;
}

interface CartItem extends Product {
  quantity: number;
  isDataPlan: boolean;
}

const NomadNetEcommerce: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<Product | null>(null);
  const [showDataPlanPromo, setShowDataPlanPromo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Product data
  const routers: Product[] = [
    {
      id: 'glinet-x3000',
      name: 'GLiNet X3000 5G Router',
      price: 500,
      description: 'Premium 5G/4G cellular router with Wi-Fi 6 support',
      image: '/images/x3000-router.jpg',
      features: ['5G & 4G LTE connectivity', 'Wi-Fi 6 support', 'Up to 32 devices', 'VPN ready', 'OpenWrt firmware'],
      connectivity: '5G + 4G',
      stripePriceId: 'price_x3000_router'
    },
    {
      id: 'glinet-x2000',
      name: 'GLiNet X2000 4G Router', 
      price: 400,
      description: 'Reliable 4G cellular router perfect for most use cases',
      image: '/images/x2000-router.jpg',
      features: ['4G LTE connectivity', 'Wi-Fi 5 support', 'Up to 20 devices', 'VPN ready', 'OpenWrt firmware'],
      connectivity: '4G Only',
      stripePriceId: 'price_x2000_router'
    }
  ];

  const dataplan: Product = {
    id: 'unlimited-data',
    name: 'Unlimited Data Plan',
    price: 79,
    description: 'Unlimited high-speed data with no throttling',
    image: '/images/data-plan.jpg',
    features: ['Unlimited high-speed data', 'No contracts', 'Cancel anytime', 'Priority network access', '5G & 4G coverage', '24/7 support'],
    priceId: 'price_unlimited_data_monthly'
  };

  const addRouterToCart = (product: Product): void => {
    setSelectedRouter(product);
    setCart([{ ...product, quantity: 1, isDataPlan: false }]);
    setShowDataPlanPromo(true);
    setCurrentView('add-data-plan');
  };

  const addDataPlanToCart = (): void => {
    setCart(prev => [...prev, { ...dataplan, quantity: 1, isDataPlan: true }]);
    setCurrentView('cart');
  };

  const skipDataPlan = (): void => {
    setCurrentView('cart');
  };

  const removeFromCart = (productId: string): void => {
    setCart(prev => prev.filter(item => item.id !== productId));
    if (productId === selectedRouter?.id) {
      setSelectedRouter(null);
    }
  };

  const updateQuantity = (productId: string, quantity: number): void => {
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

  // Progress indicator for checkout flow
  const getProgressStep = (): number => {
    if (currentView === 'products' || currentView === 'home') return 1;
    if (currentView === 'add-data-plan') return 2;
    if (currentView === 'cart') return 3;
    if (currentView === 'checkout') return 4;
    return 1;
  };

  // Stripe Checkout Integration
  const handleCheckout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const routerItems = cart.filter(item => !item.isDataPlan);
      const subscriptionItems = cart.filter(item => item.isDataPlan);
      
      // Create line items for routers (one-time purchase)
      const routerLineItems = routerItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description,
            images: [item.image],
            metadata: {
              product_type: 'router',
              product_id: item.id
            }
          },
          unit_amount: item.price * 100, // Convert to cents
        },
        quantity: item.quantity,
      }));

      // Create line items for subscriptions (using price IDs)
      const subscriptionLineItems = subscriptionItems.map(item => ({
        price: item.priceId, // Use the actual Stripe price ID
        quantity: item.quantity,
      }));

      // Combine both types
      const line_items = [
        ...routerLineItems,
        ...subscriptionLineItems
      ];

      const metadata = {
        cart_items: JSON.stringify(cart),
        has_data_plan: hasDataPlan.toString(),
        subscription_price_id: hasDataPlan ? dataplan.priceId || '' : '',
        router_model: selectedRouter?.id || ''
      };

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          line_items,
          customer_email: '', // Will be collected in Stripe checkout
          metadata,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cart`,
          billing_address_collection: 'required',
          shipping_address_collection: {
            allowed_countries: ['US', 'CA'],
          },
          automatic_tax: {
            enabled: true,
          },
          allow_promotion_codes: true,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('There was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ProgressIndicator: React.FC = () => {
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
                    stepItem.active ? 'text-gray-900' : 'text-gray-300'
                  }`}>
                    {stepItem.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 mx-4 h-px ${
                    step > stepItem.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Header Component
  const Header: React.FC = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">NomadConnect</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {[
              { name: 'Home', id: 'home' },
              { name: 'Products', id: 'products' },
              { name: 'Why Choose Us', id: 'about' },
              { name: 'Support', id: 'support' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  currentView === item.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setCurrentView('cart')}
              className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-slide-up">
            <div className="flex flex-col space-y-2">
              {[
                { name: 'Home', id: 'home' },
                { name: 'Products', id: 'products' },
                { name: 'Why Choose Us', id: 'about' },
                { name: 'Support', id: 'support' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 text-left text-base font-medium transition-colors duration-200 ${
                    currentView === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProgressIndicator />
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Home View */}
        {currentView === 'home' && (
          <div className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Internet Anywhere, Anytime
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Get connected with our pre-configured cellular routers and unlimited data plans
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Perfect for Beginners</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Pre-Configured</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Ready to Use</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('products')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
              >
                Get Started
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Products View */}
        {currentView === 'products' && (
          <div className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Step 1: Choose Your Router
                </h2>
                <p className="text-gray-600">
                  Both routers arrive fully configured and ready to use. No technical setup required.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {routers.map((router) => (
                  <div key={router.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wifi className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {router.name}
                      </h3>
                      <p className="text-gray-600">{router.description}</p>
                    </div>
                    
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        ${router.price}
                      </div>
                      <div className="text-sm text-gray-500">One-time purchase</div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {router.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => addRouterToCart(router)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Data Plan View */}
        {currentView === 'add-data-plan' && (
          <div className="py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Step 2: Add Data Plan (Optional)
                </h2>
                <p className="text-gray-600">
                  Your router needs a data connection to provide internet access
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {dataplan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{dataplan.description}</p>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ${dataplan.price}/month
                  </div>
                  <div className="text-sm text-gray-500">Cancel anytime</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {dataplan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={addDataPlanToCart}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Add Data Plan
                  </button>
                  <button
                    onClick={skipDataPlan}
                    className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can always add a data plan later. Your router will work with any compatible cellular carrier.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Cart View */}
        {currentView === 'cart' && (
          <div className="py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
                  <button
                    onClick={() => setCurrentView('products')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Shop Products
                  </button>
                </div>
              ) : (
                <div>
                  <div className="space-y-4 mb-8">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                            <div className="text-blue-600 font-semibold">
                              ${item.price}{item.isDataPlan ? '/month' : ''}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="border-t pt-4 mb-6">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-blue-600">${cartTotal.toFixed(2)}</span>
                      </div>
                      {hasDataPlan && (
                        <p className="text-sm text-gray-500 mt-2">
                          * Includes monthly subscription charges
                        </p>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                    </button>
                    
                    <div className="mt-6 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        30-day money-back guarantee
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Free shipping included
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Pre-configured and ready to use
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About View */}
        {currentView === 'about' && (
          <div className="py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose NomadConnect?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Plug & Play Ready</h3>
                  <p className="text-gray-600">Arrives pre-configured with SIM card installed. Just plug in and you're online.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Beginner Friendly</h3>
                  <p className="text-gray-600">No technical setup required. Perfect for those new to cellular internet.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">30-Day Guarantee</h3>
                  <p className="text-gray-600">Try risk-free with our money-back guarantee and free return shipping.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support View */}
        {currentView === 'support' && (
          <div className="py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Support</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
                  <p className="text-gray-600 mb-4">Speak with our experts</p>
                  <a href="tel:1-800-NOMAD-01" className="text-blue-600 hover:text-blue-700 font-semibold">
                    1-800-NOMAD-01
                  </a>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <Mail className="h-8 w-8 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-4">Get help via email</p>
                  <a href="mailto:support@nomadconnect.com" className="text-green-600 hover:text-green-700 font-semibold">
                    support@nomadconnect.com
                  </a>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                  <p className="text-gray-600 mb-4">Chat with us online</p>
                  <button className="text-purple-600 hover:text-purple-700 font-semibold">
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NomadNetEcommerce;