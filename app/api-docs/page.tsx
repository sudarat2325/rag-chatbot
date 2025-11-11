'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
  useEffect(() => {
    // Load Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css';
    document.head.appendChild(link);

    // Load Swagger UI Bundle
    const scriptBundle = document.createElement('script');
    scriptBundle.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js';

    // Load Swagger UI Standalone Preset
    const scriptStandalone = document.createElement('script');
    scriptStandalone.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js';

    let loadedScripts = 0;
    const checkAndInit = () => {
      loadedScripts++;
      if (loadedScripts === 2) {
        // Initialize Swagger UI after both scripts are loaded
        if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
          (window as any).ui = (window as any).SwaggerUIBundle({
            url: '/swagger.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIStandalonePreset,
            ],
            plugins: [
              (window as any).SwaggerUIBundle.plugins.DownloadUrl,
            ],
            layout: 'StandaloneLayout',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            filter: true,
            showRequestHeaders: true,
            tryItOutEnabled: true,
          });
        }
      }
    };

    scriptBundle.onload = checkAndInit;
    scriptStandalone.onload = checkAndInit;

    document.body.appendChild(scriptBundle);
    document.body.appendChild(scriptStandalone);

    return () => {
      if (link.parentNode) {
        document.head.removeChild(link);
      }
      if (scriptBundle.parentNode) {
        document.body.removeChild(scriptBundle);
      }
      if (scriptStandalone.parentNode) {
        document.body.removeChild(scriptStandalone);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
          <p className="text-blue-100">
            Food Delivery System with RAG Chatbot & Driver Management
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="/"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              ← Back to Home
            </a>
            <a
              href="/swagger.json"
              target="_blank"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
            >
              View OpenAPI Spec
            </a>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              🚀 Base URL
            </h3>
            <code className="text-sm text-green-800 bg-green-200 px-2 py-1 rounded">
              http://localhost:3000
            </code>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              📚 Version
            </h3>
            <code className="text-sm text-blue-800 bg-blue-200 px-2 py-1 rounded">
              v1.0.0
            </code>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-2">
              🔐 Auth Type
            </h3>
            <code className="text-sm text-purple-800 bg-purple-200 px-2 py-1 rounded">
              None / Session
            </code>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 API Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <h4 className="font-semibold text-gray-900">Authentication & Users</h4>
                <p className="text-sm text-gray-600">Register, login, and user management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏪</span>
              <div>
                <h4 className="font-semibold text-gray-900">Restaurants</h4>
                <p className="text-sm text-gray-600">Restaurant and menu management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛒</span>
              <div>
                <h4 className="font-semibold text-gray-900">Orders</h4>
                <p className="text-sm text-gray-600">Order placement and tracking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏍️</span>
              <div>
                <h4 className="font-semibold text-gray-900">Drivers & Deliveries</h4>
                <p className="text-sm text-gray-600">Driver registration and delivery tracking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h4 className="font-semibold text-gray-900">RAG Chatbot</h4>
                <p className="text-sm text-gray-600">AI-powered chatbot with document retrieval</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <h4 className="font-semibold text-gray-900">Documents</h4>
                <p className="text-sm text-gray-600">Document upload and management for RAG</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="container mx-auto px-4 pb-12">
        <div id="swagger-ui"></div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            Built with Next.js, Prisma, MongoDB, and Claude AI •{' '}
            <a href="https://github.com" className="text-blue-600 hover:underline">
              View on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
