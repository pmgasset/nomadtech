import React, { useState } from 'react';
import { ShoppingCart, Wifi, MapPin, Truck, Users, Check, Star, Menu, X, CreditCard, Package, Globe, Shield, Zap, ArrowRight, ChevronRight, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';

// Base product interface
interface BaseProduct {
  id: string;
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

// Router product interface
interface RouterProduct extends BaseProduct {
  originalPrice?: number;
  connectivity: string;
  wifi: string;
  ideal: string[];
  beginnerFriendly?: boolean;
  popular?: boolean;
}

// Data plan interface
interface DataPlan extends BaseProduct {
  type: string;
}

// Cart item can be either type
interface CartItem extends BaseProduct {
  quantity: number;
  isDataPlan: boolean;
  // Optional router properties
  connectivity?: string;
  wifi?: string;
  ideal?: string[];
  originalPrice?: number;
  beginnerFriendly?: boolean;
  popular?: boolean;
  // Optional data plan properties
  type?: string;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
}

const NomadNetEcommerce: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedRouter, setSelectedRouter] = useState<RouterProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '', lastName: '', address: '', city: '', zipCode: ''
  });

  const products: Record<string, RouterProduct> = {
    x2000: {
      id: 'x2000',
      stripeProductId: 'prod_x2000', // UPDATE AFTER STRIPE SETUP
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
      stripeProductId: 'prod_x3000', // UPDATE AFTER STRIPE SETUP
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

  const dataplan: DataPlan = {
    id: 'unlimited-data',
    stripeProductId: 'prod_unlimited_data', // UPDATE AFTER STRIPE SETUP
    stripePriceId: 'price_unlimited_data_monthly',
    name: 'Unlimited Data Plan',
    price: 79,
    type: 'subscription',
    description: 'Truly unlimited high-speed data with no throttling',
    features: ['Unlimited high-speed data', 'No contracts', 'Cancel anytime', 'Priority network access', '5G & 4G coverage', '24/7 support']
  };

  const addRouterToCart = (product: RouterProduct): void => {
    setSelectedRouter(product);
    setCart([{ ...product, quantity: 1, isDataPlan: false }]);
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
  const hardwareTotal = cart.filter(item => !item.isDataPlan).reduce((total, item) => total + (item.price * item.quantity), 0);

  const createStripeCheckout = async (): Promise<void> => {
    if (!customerEmail || !shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.address) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const lineItems = cart.filter(item => !item.isDataPlan).map(item => ({
        price: item.stripePriceId,
        quantity: item.quantity,
      }));

      const checkoutData = {
        line_items: lineItems,
        mode: 'payment',
        customer_email: customerEmail,
        billing_address_collection: 'required',
        shipping_address_collection: { allowed_countries: ['US'] },
        metadata: {
          customer_phone: customerPhone,
          has_data_plan: hasDataPlan.toString(),
          cart_items: JSON.stringify(cart.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, isDataPlan: item.isDataPlan
          })))
        },
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cart`,
        automatic_tax: { enabled: true },
        allow_promotion_codes: true,
      };

      if (hasDataPlan) {
        (checkoutData.metadata as any).subscription_price_id = dataplan.stripePriceId;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Something went wrong. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const Header: React.FC = () => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
            <Wifi className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">NomadConnect</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => setCurrentView('products')} className="text-gray-700 hover:text-blue-600 transition">Products</button>
            <button onClick={() => setCurrentView('about')} className="text-gray-700 hover:text-blue-600 transition">Why Choose Us</button>
            <button onClick={() => setCurrentView('support')} className="text-gray-700 hover:text-blue-600 transition">Support</button>
          </nav>

          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('cart')} className="relative p-2 text-gray-700 hover:text-blue-600 transition">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-700">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-2">
            <button onClick={() => { setCurrentView('products'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">Products</button>
            <button onClick={() => { setCurrentView('about'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">Why Choose Us</button>
            <button onClick={() => { setCurrentView('support'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">Support</button>
          </div>
        </div>
      )}
    </header>
  );

  const HeroSection: React.FC = () => (
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
            <button onClick={() => setCurrentView('products')} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              Get Started <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={() => setCurrentView('about')} className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition">
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

  const ProductCard: React.FC<{ product: RouterProduct }> = ({ product }) => (
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
            <span className="text-3xl font-bold text-blue-600">${product.price}</span>
            {product.originalPrice && (
              <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>
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

  const ProductsView: React.FC = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Step 1: Choose Your Router
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          Both routers arrive <strong>fully configured and ready to use</strong>. No technical setup required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <ProductCard product={products.x2000} />
        <ProductCard product={products.x3000} />
      </div>
    </div>
  );

  const renderView = (): JSX.Element => {
    switch (currentView) {
      case 'products':
        return <ProductsView />;
      case 'cart':
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Cart View - Coming Soon</h2></div>;
      case 'checkout':
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Checkout View - Coming Soon</h2></div>;
      case 'about':
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">About View - Coming Soon</h2></div>;
      case 'support':
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Support View - Coming Soon</h2></div>;
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      {renderView()}
      
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Wifi className="h-6 w-6 text-blue-400 mr-2" />
              <span className="text-lg font-bold">NomadConnect</span>
            </div>
            <p className="text-gray-400">Pre-configured internet for the mobile lifestyle. No setup required.</p>
            <p className="text-gray-400 mt-4">&copy; 2025 NomadConnect. All rights reserved. • Internet anywhere, setup-free.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NomadNetEcommerce;
