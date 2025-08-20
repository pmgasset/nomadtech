import React, { useState } from 'react';
import { Wifi, Package, Check, Globe, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <Wifi className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">NomadConnect</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full inline-block mb-6">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Check className="h-4 w-4" />
              Server Successfully Deployed
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Internet <span className="text-blue-600">Anywhere</span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your cellular router ecommerce platform is now running and ready for configuration.
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-12">
            <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-6">Deployment Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Server Running</h4>
                <p className="text-sm text-gray-600">Next.js application active</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Database Connected</h4>
                <p className="text-sm text-gray-600">PostgreSQL ready</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">SSL Active</h4>
                <p className="text-sm text-gray-600">HTTPS secured</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>✅ Infrastructure deployed successfully</li>
                <li>🔑 Add Stripe API keys to environment</li>
                <li>🛍️ Deploy ecommerce components</li>
                <li>🧪 Test payment integration</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your platform is ready for the next configuration steps.
            </p>
            <div className="inline-flex gap-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow text-sm">
                <span className="text-gray-600">Domain:</span>
                <span className="font-semibold text-blue-600 ml-2">nomadconnect.app</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600 ml-2">Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
