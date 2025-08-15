import { Database, Brain, BarChart3, Users } from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      icon: Database,
      title: 'Snowflake-Powered Data',
      description: 'Built on enterprise-grade Snowflake infrastructure with real-time data from MLS feeds, county records, and trusted market sources.'
    },
    {
      icon: Brain,
      title: 'AI-Driven Insights',
      description: 'Leverages Snowflake Cortex and advanced language models to convert natural language queries into actionable real estate intelligence.'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              About RealEstate AI
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              We're revolutionizing real estate intelligence with AI-powered insights backed by 
              comprehensive US market data on the Snowflake platform.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              To democratize access to professional-grade real estate intelligence through 
              conversational AI, empowering everyone from first-time homebuyers to seasoned 
              investors with the insights they need to make confident decisions.
            </p>
            <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200">
              <p className="text-lg text-emerald-800 font-medium">
                "Making complex real estate data as accessible as asking a question"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powered by Enterprise Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with enterprise-grade data infrastructure 
              to deliver reliable, accurate, and actionable real estate insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              System Architecture
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on modern cloud architecture for scalability, reliability, and performance
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Layer</h3>
                <p className="text-gray-600 text-sm">
                  Snowflake data warehouse with automated ingestion from 1,200+ sources including 
                  MLS feeds, county records, and market aggregators.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-emerald-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Layer</h3>
                <p className="text-gray-600 text-sm">
                  Snowflake Cortex with fallback to external LLMs for natural language processing 
                  and intelligent query conversion.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Layer</h3>
                <p className="text-gray-600 text-sm">
                  React frontend with Node.js backend, Redis caching, and role-based security 
                  for optimal user experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
              Built by Real Estate & Tech Experts
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Our team combines decades of real estate industry experience with cutting-edge 
              technology expertise to deliver the most advanced property intelligence platform.
            </p>
            <div className="bg-emerald-700 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <BarChart3 className="w-6 h-6" />
                <span className="text-lg font-semibold">Ready to explore the data?</span>
              </div>
              <p className="mb-6 opacity-90">
                Start asking questions about any US real estate market and get instant, 
                AI-powered insights backed by comprehensive data.
              </p>
              <a
                href="/chat"
                className="inline-flex items-center space-x-2 bg-white text-emerald-700 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors duration-200"
              >
                <span>Start Chatting</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;