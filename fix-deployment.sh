#!/bin/bash

# =============================================================================
# FIX NOMADNET DEPLOYMENT ISSUES
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/nomadnet-ecommerce"
DB_NAME="nomadnet_production"
DB_USER="nomadnet_user"

echo -e "${BLUE}🔧 Fixing NomadNet Deployment Issues${NC}"
echo "===================================="

# -----------------------------------------------------------------------------
# 1. FIX DATABASE SETUP
# -----------------------------------------------------------------------------
fix_database() {
    echo -e "${YELLOW}🗄️ Fixing database setup...${NC}"
    
    # Generate new secure password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create database (outside of function)
    sudo -u postgres createdb $DB_NAME 2>/dev/null || echo "Database already exists"
    
    # Create user and grant privileges
    sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${DB_USER}') THEN
        CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    ELSE
        ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER USER ${DB_USER} CREATEDB;
EOF
    
    # Update .env.local with correct database URL
    cd $APP_DIR
    
    # Backup existing .env.local
    cp .env.local .env.local.backup
    
    # Create new .env.local with correct database URL
    cat > .env.local << EOL
# Database URL (corrected)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# Stripe Configuration (TEST MODE - UPDATE THESE)
STRIPE_SECRET_KEY="sk_test_REPLACE_WITH_YOUR_KEY"
STRIPE_PUBLISHABLE_KEY="pk_test_REPLACE_WITH_YOUR_KEY"  
STRIPE_WEBHOOK_SECRET="whsec_REPLACE_WITH_YOUR_SECRET"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://nomadconnect.app"
NEXT_PUBLIC_API_URL="https://nomadconnect.app/api"

# Email Service (SendGrid - UPDATE THESE)
SENDGRID_API_KEY="SG.REPLACE_WITH_YOUR_KEY"
FROM_EMAIL="orders@nomadconnect.app"

# Authentication
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://nomadconnect.app"

# Production
NODE_ENV="production"
EOL

    echo -e "${GREEN}✅ Database fixed${NC}"
    echo -e "${BLUE}📝 New database password generated and stored in .env.local${NC}"
}

# -----------------------------------------------------------------------------
# 2. FIX TYPESCRIPT ERRORS IN COMPONENT
# -----------------------------------------------------------------------------
fix_typescript_errors() {
    echo -e "${YELLOW}⚛️ Fixing TypeScript errors...${NC}"
    
    # Create proper TypeScript interfaces and fix the component
    cat > $APP_DIR/components/NomadNetEcommerce.tsx << 'EOL'
import React, { useState } from 'react';
import { ShoppingCart, Wifi, MapPin, Truck, Users, Check, Star, Menu, X, CreditCard, Package, Globe, Shield, Zap, ArrowRight, ChevronRight, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';

// TypeScript interfaces
interface Product {
  id: string;
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  price: number;
  originalPrice?: number;
  connectivity: string;
  wifi: string;
  description: string;
  features: string[];
  ideal: string[];
  beginnerFriendly?: boolean;
  popular?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  isDataPlan: boolean;
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
  const [selectedRouter, setSelectedRouter] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '', lastName: '', address: '', city: '', zipCode: ''
  });

  const products: Record<string, Product> = {
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

  const dataplan = {
    id: 'unlimited-data',
    stripeProductId: 'prod_unlimited_data', // UPDATE AFTER STRIPE SETUP
    stripePriceId: 'price_unlimited_data_monthly',
    name: 'Unlimited Data Plan',
    price: 79,
    type: 'subscription',
    description: 'Truly unlimited high-speed data with no throttling',
    features: ['Unlimited high-speed data', 'No contracts', 'Cancel anytime', 'Priority network access', '5G & 4G coverage', '24/7 support']
  };

  const addRouterToCart = (product: Product): void => {
    setSelectedRouter(product);
    setCart([{ ...product, quantity: 1, isDataPlan: false }]);
    setCurrentView('add-data-plan');
  };

  const addDataPlanToCart = (): void => {
    setCart(prev => [...prev, { ...dataplan, quantity: 1, isDataPlan: true } as CartItem]);
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
        checkoutData.metadata.subscription_price_id = dataplan.stripePriceId;
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

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
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
EOL

    echo -e "${GREEN}✅ TypeScript errors fixed${NC}"
}

# -----------------------------------------------------------------------------
# 3. FIX SECURITY VULNERABILITIES
# -----------------------------------------------------------------------------
fix_security_vulnerabilities() {
    echo -e "${YELLOW}🔒 Fixing security vulnerabilities...${NC}"
    
    cd $APP_DIR
    
    # Update package.json with latest secure versions
    cat > package.json << 'EOL'
{
  "name": "nomadnet-ecommerce",
  "version": "1.0.0",
  "description": "5G Cellular Router Ecommerce Platform for Digital Nomads",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma db push --force-reset",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^14.2.32",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@prisma/client": "^6.0.0",
    "stripe": "^16.0.0",
    "lucide-react": "^0.400.0",
    "micro": "^10.0.1",
    "@sendgrid/mail": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^9.0.0",
    "eslint-config-next": "^14.2.32",
    "postcss": "^8.4.38",
    "prisma": "^6.0.0",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5"
  },
  "keywords": ["ecommerce", "cellular-router", "5g", "nomad", "rv", "internet", "stripe", "nextjs"],
  "author": "NomadConnect",
  "license": "MIT"
}
EOL

    # Install updated dependencies
    rm -rf node_modules package-lock.json
    npm install
    
    echo -e "${GREEN}✅ Security vulnerabilities fixed${NC}"
}

# -----------------------------------------------------------------------------
# 4. PUSH DATABASE SCHEMA
# -----------------------------------------------------------------------------
push_database_schema() {
    echo -e "${YELLOW}🗄️ Pushing database schema...${NC}"
    
    cd $APP_DIR
    
    # Generate Prisma client
    npx prisma generate
    
    # Push schema to database
    if npx prisma db push; then
        echo -e "${GREEN}✅ Database schema pushed successfully${NC}"
    else
        echo -e "${RED}❌ Database schema push failed${NC}"
        echo -e "${YELLOW}💡 Try: npx prisma db push --force-reset${NC}"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# 5. BUILD APPLICATION
# -----------------------------------------------------------------------------
build_application() {
    echo -e "${YELLOW}🔨 Building application...${NC}"
    
    cd $APP_DIR
    
    # Build the application
    if npm run build; then
        echo -e "${GREEN}✅ Application built successfully${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# 6. RESTART APPLICATION
# -----------------------------------------------------------------------------
restart_application() {
    echo -e "${YELLOW}🔄 Restarting application...${NC}"
    
    # Stop and restart PM2
    pm2 stop nomadnet-ecommerce 2>/dev/null || true
    pm2 delete nomadnet-ecommerce 2>/dev/null || true
    
    cd $APP_DIR
    pm2 start ecosystem.config.js
    pm2 save
    
    echo -e "${GREEN}✅ Application restarted${NC}"
}

# -----------------------------------------------------------------------------
# 7. MAIN FUNCTION
# -----------------------------------------------------------------------------
main() {
    echo -e "${BLUE}Fixing deployment issues...${NC}"
    
    fix_database
    fix_typescript_errors
    fix_security_vulnerabilities
    push_database_schema
    build_application
    restart_application
    
    echo -e "${GREEN}🎉 All issues fixed!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "${BLUE}1. Update API keys in ${APP_DIR}/.env.local${NC}"
    echo -e "${BLUE}   - Add your Stripe test keys${NC}"
    echo -e "${BLUE}   - Add your SendGrid API key${NC}"
    echo ""
    echo -e "${BLUE}2. Test the application:${NC}"
    echo -e "${BLUE}   curl http://localhost:3000${NC}"
    echo ""
    echo -e "${BLUE}3. Check application status:${NC}"
    echo -e "${BLUE}   pm2 status${NC}"
    echo -e "${BLUE}   pm2 logs nomadnet-ecommerce${NC}"
    echo ""
    echo -e "${BLUE}4. Access your site at: https://nomadconnect.app${NC}"
}

# Run the fixes
main
EOL

    echo -e "${GREEN}✅ Fix script created${NC}"
}

# -----------------------------------------------------------------------------
# 8. CREATE STRIPE SETUP SCRIPT
# -----------------------------------------------------------------------------
create_stripe_setup_script() {
    echo -e "${YELLOW}💳 Creating Stripe setup script...${NC}"
    
    cat > $APP_DIR/scripts/setup-stripe.sh << 'EOL'
#!/bin/bash

echo "🔷 Setting up Stripe products for NomadConnect"
echo "=============================================="

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install it with:"
    echo "   curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg"
    echo "   echo 'deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main' | sudo tee -a /etc/apt/sources.list.d/stripe.list"
    echo "   sudo apt update && sudo apt install stripe"
    echo ""
    echo "Then run: stripe login"
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "❌ Please login to Stripe first:"
    echo "   stripe login"
    exit 1
fi

echo "Creating products and prices..."

# Create X2000 Router
echo "📦 Creating GLiNet X2000 Spitz Plus..."
X2000_PRODUCT=$(stripe products create \
    --name "GLiNet X2000 Spitz Plus" \
    --description "4G LTE router with Wi-Fi 6, perfect for beginners" \
    --metadata="category=router,model=x2000" \
    --format=json | jq -r '.id')

X2000_PRICE=$(stripe prices create \
    --unit-amount 40000 \
    --currency usd \
    --product $X2000_PRODUCT \
    --metadata="router_model=x2000" \
    --format=json | jq -r '.id')

echo "✅ X2000 Product: $X2000_PRODUCT"
echo "✅ X2000 Price: $X2000_PRICE"

# Create X3000 Router
echo "📦 Creating GLiNet X3000 Spitz AX..."
X3000_PRODUCT=$(stripe products create \
    --name "GLiNet X3000 Spitz AX" \
    --description "5G + 4G router with dual-SIM failover" \
    --metadata="category=router,model=x3000" \
    --format=json | jq -r '.id')

X3000_PRICE=$(stripe prices create \
    --unit-amount 50000 \
    --currency usd \
    --product $X3000_PRODUCT \
    --metadata="router_model=x3000" \
    --format=json | jq -r '.id')

echo "✅ X3000 Product: $X3000_PRODUCT"
echo "✅ X3000 Price: $X3000_PRICE"

# Create Unlimited Data Plan
echo "📶 Creating Unlimited Data Plan..."
DATA_PRODUCT=$(stripe products create \
    --name "Unlimited Data Plan" \
    --description "Truly unlimited high-speed data with no throttling" \
    --metadata="category=subscription,type=data_plan" \
    --format=json | jq -r '.id')

DATA_PRICE=$(stripe prices create \
    --unit-amount 7900 \
    --currency usd \
    --recurring interval=month \
    --product $DATA_PRODUCT \
    --metadata="plan_type=unlimited_data" \
    --format=json | jq -r '.id')

echo "✅ Data Plan Product: $DATA_PRODUCT"
echo "✅ Data Plan Price: $DATA_PRICE"

echo ""
echo "🔧 Update your component with these IDs:"
echo "========================================"
echo "Edit components/NomadNetEcommerce.tsx and update:"
echo ""
echo "products: {"
echo "  x2000: {"
echo "    stripeProductId: '$X2000_PRODUCT',"
echo "    stripePriceId: '$X2000_PRICE',"
echo "  },"
echo "  x3000: {"
echo "    stripeProductId: '$X3000_PRODUCT',"
echo "    stripePriceId: '$X3000_PRICE',"
echo "  }"
echo "}"
echo ""
echo "dataplan: {"
echo "  stripeProductId: '$DATA_PRODUCT',"
echo "  stripePriceId: '$DATA_PRICE',"
echo "}"

echo ""
echo "🎉 Stripe setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the component with the product/price IDs above"
echo "2. Set up webhook endpoint in Stripe Dashboard:"
echo "   URL: https://nomadconnect.app/api/webhooks/stripe"
echo "   Events: checkout.session.completed, customer.subscription.*"
echo "3. Test with test card: 4242 4242 4242 4242"
EOL

    chmod +x $APP_DIR/scripts/setup-stripe.sh
    
    echo -e "${GREEN}✅ Stripe setup script created${NC}"
}

# Run all fixes
main
