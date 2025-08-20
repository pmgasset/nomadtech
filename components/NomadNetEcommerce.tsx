// components/NomadNetEcommerce.tsx
import React, { useState } from 'react';
import { Wifi, ShoppingCart, Menu, X, Check, Shield, Zap, Users, Phone, Mail, MapPin, Star, ChevronRight } from 'lucide-react';

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

    // Combine both types - TypeScript will be happy with this approach
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
          <div className="md:hidden border-t border-gray-200 py-4">
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

  // Rest of your component views would go here...
  // (HomeView, ProductsView, CartView, etc.)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProgressIndicator />
      
      {/* Main Content */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Internet Anywhere, Anytime
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Get connected with our pre-configured cellular routers and unlimited data plans
              </p>
              <button
                onClick={() => setCurrentView('products')}
                className="btn-primary"
              >
                Shop Now
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {currentView === 'products' && (
          <div className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Choose Your Router
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {routers.map((router) => (
                  <div key={router.id} className="card card-hover">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {router.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{router.description}</p>
                    <div className="text-3xl font-bold text-blue-600 mb-4">
                      ${router.price}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {router.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => addRouterToCart(router)}
                      className="btn-primary w-full"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Add other views as needed */}
      </main>
    </div>
  );
};

export default NomadNetEcommerce;