// /var/www/nomadnet-ecommerce/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">We're sorry, but something unexpected happened. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main App Component
function NomadNetApp({ Component, pageProps, router }: AppProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle route changes for loading states
  React.useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Get page-specific props
  const currentPath = router.asPath;
  const isHomePage = currentPath === '/';
  const isProductPage = currentPath.includes('/products');
  const isCheckoutPage = currentPath.includes('/cart') || currentPath.includes('/checkout');

  // SEO defaults
  const defaultMeta = {
    title: 'NomadNet - Internet Anywhere, Setup-Free 5G Routers',
    description: 'Pre-configured 5G cellular routers for digital nomads, RVers, and remote workers. Ships ready to use with 30 days of unlimited data included.',
    image: '/images/nomadnet-og-image.jpg',
    url: `${process.env.NEXT_PUBLIC_APP_URL}${currentPath}`,
  };

  // Page-specific meta data
  const getPageMeta = () => {
    if (isHomePage) {
      return {
        title: 'NomadNet - Internet Anywhere | Pre-Configured 5G Routers',
        description: 'Never worry about connectivity again. Our 5G routers arrive fully configured and ready to activate. Perfect for digital nomads, RVers, and remote locations.',
      };
    }
    
    if (isProductPage) {
      return {
        title: 'Shop 5G Routers | GLiNet X2000 & X3000 | NomadNet',
        description: 'Choose from beginner-friendly 4G routers or premium 5G models. All routers ship pre-configured with unlimited data plans available.',
      };
    }
    
    if (isCheckoutPage) {
      return {
        title: 'Secure Checkout | NomadNet',
        description: 'Complete your order for pre-configured internet routers with secure checkout and fast shipping.',
      };
    }

    return defaultMeta;
  };

  const pageMeta = getPageMeta();

  return (
    <ErrorBoundary>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageMeta.title}</title>
        <meta name="title" content={pageMeta.title} />
        <meta name="description" content={pageMeta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={defaultMeta.url} />
        <meta property="og:title" content={pageMeta.title} />
        <meta property="og:description" content={pageMeta.description} />
        <meta property="og:image" content={defaultMeta.image} />
        <meta property="og:site_name" content="NomadNet" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={defaultMeta.url} />
        <meta property="twitter:title" content={pageMeta.title} />
        <meta property="twitter:description" content={pageMeta.description} />
        <meta property="twitter:image" content={defaultMeta.image} />
        <meta property="twitter:site" content="@nomadnet" />

        {/* Additional SEO Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="NomadNet" />
        <meta name="keywords" content="5g router, cellular internet, nomad internet, rv internet, remote work, digital nomad, cellular router, portable internet, mobile hotspot, unlimited data" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Canonical URL */}
        <link rel="canonical" href={defaultMeta.url} />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "NomadNet",
              "url": process.env.NEXT_PUBLIC_APP_URL,
              "logo": `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`,
              "description": "Pre-configured 5G cellular routers for digital nomads, RVers, and remote workers.",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "1-800-NOMADNET",
                "contactType": "customer support",
                "areaServed": ["US", "CA"],
                "availableLanguage": "English"
              },
              "sameAs": [
                "https://twitter.com/nomadnet",
                "https://facebook.com/nomadnet",
                "https://instagram.com/nomadnet"
              ]
            })
          }}
        />

        {/* Product schema for product pages */}
        {isProductPage && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "GLiNet 5G Cellular Router",
                "description": "Pre-configured 5G cellular router with unlimited data plans. Ships ready to use for digital nomads and remote workers.",
                "brand": {
                  "@type": "Brand",
                  "name": "GLiNet"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "400",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "NomadNet"
                  }
                }
              })
            }}
          />
        )}

        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </Head>

      {/* Global Loading State */}
      {isLoading && <PageLoader />}

      {/* Main App Content */}
      <div className={isLoading ? 'hidden' : 'block'}>
        <Component {...pageProps} />
      </div>

      {/* Analytics */}
      {process.env.NODE_ENV === 'production' && (
        <>
          <Analytics />
          {/* Google Analytics */}
          {process.env.GOOGLE_ANALYTICS_ID && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID}`}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.GOOGLE_ANALYTICS_ID}');
                  `,
                }}
              />
            </>
          )}
        </>
      )}
    </ErrorBoundary>
  );
}

export default NomadNetApp;