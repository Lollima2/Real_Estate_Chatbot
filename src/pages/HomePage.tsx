import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, MapPin, Search, BarChart3, Users } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: Search,
      title: 'Smart Property Search',
      description: 'Ask natural language questions about real estate markets across the US.'
    },
    {
      icon: BarChart3,
      title: 'Market Analytics',
      description: 'Get instant insights on price trends, market conditions, and investment opportunities.'
    },
    {
      icon: MapPin,
      title: 'Location Intelligence',
      description: 'Compare neighborhoods, schools, amenities, and local market data.'
    },
    {
      icon: Users,
      title: 'Agent Network',
      description: 'Connect with local real estate professionals and get personalized guidance.'
    }
  ];

  const marketData = [
    { city: 'San Francisco', medianPrice: '$1,450,000', change: '+5.2%', trend: 'up' },
    { city: 'Austin', medianPrice: '$565,000', change: '+8.1%', trend: 'up' },
    { city: 'Miami', medianPrice: '$485,000', change: '+3.7%', trend: 'up' },
    { city: 'Denver', medianPrice: '$520,000', change: '-2.1%', trend: 'down' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              AI-Powered Real Estate
              <span className="block text-emerald-200">Intelligence</span>
            </h1>
            <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
              Get instant insights into the US real estate market with our AI chatbot. 
              Search properties, analyze trends, and make informed decisions backed by comprehensive data.
            </p>
            {/* Powered By Section */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-6">
                <span className="text-emerald-200/80 text-sm">Powered by</span>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/snowflake-color.png" 
                      alt="Snowflake" 
                      className="w-6 h-6 filter brightness-0 invert"
                    />
                    <span className="text-white font-medium">Snowflake</span>
                  </div>
                  <div className="w-px h-4 bg-white/30"></div>
                  <div className="flex items-center space-x-2">
                    <img 
                      src="https://www.pngall.com/wp-content/uploads/16/Google-Gemini-Logo-Transparent.png" 
                      alt="Gemini AI" 
                      className="w-6 h-6 filter brightness-0 invert"
                    />
                    <span className="text-white font-medium">Gemini AI</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/chat"
                className="bg-white text-emerald-800 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Start Chatting</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Real Estate Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform provides comprehensive insights to help you navigate 
              the complex real estate market with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="py-12 bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              Important Disclaimer
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>This website and its chatbot are developed for project purposes only and are not intended for commercial use.</strong> 
              </p>
              <p>
                The property information provided is sourced from the Snowflake Marketplace listing "Commercial Real Estate Data" by CompStak (view listing). The dataset covers the United States and represents a snapshot as of 2023 Q2.
              </p>
              <p>
                This data is for informational purposes only and may not reflect the most current market conditions. We do not guarantee the accuracy, completeness, or timeliness of the information. Users should verify details independently before making any real estate, investment, or business decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="py-20 bg-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Make Smarter Real Estate Decisions?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
            Join thousands of investors, agents, and homebuyers who trust our AI-powered insights 
            to navigate the real estate market successfully.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center space-x-2 bg-white text-emerald-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Start Your Free Chat</span>
          </Link>
        </div>
      </div>
      
    </div>
  );
};

export default HomePage;