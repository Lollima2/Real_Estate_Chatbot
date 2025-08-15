import { useState } from 'react';
import { BarChart3, Database, Settings, Users, CheckCircle, Activity, Clock } from 'lucide-react';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'ingestion', label: 'Data Ingestion', icon: Database },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const systemMetrics = [
    { label: 'Active Queries/Hour', value: '1,247', change: '+12%', status: 'good' },
    { label: 'Avg Response Time', value: '1.2s', change: '-0.3s', status: 'good' },
    { label: 'Data Freshness', value: '< 5 min', change: 'Real-time', status: 'good' },
    { label: 'System Uptime', value: '99.9%', change: '+0.1%', status: 'good' },
  ];

  const ingestionStatus = [
    { source: 'MLS - California', status: 'active', lastUpdate: '2 min ago', records: '15,432' },
    { source: 'MLS - Texas', status: 'active', lastUpdate: '1 min ago', records: '12,891' },
    { source: 'County Records - NY', status: 'warning', lastUpdate: '15 min ago', records: '8,234' },
    { source: 'Rental Aggregator', status: 'active', lastUpdate: '3 min ago', records: '23,567' },
  ];

  const recentQueries = [
    { query: "Show me median home prices in Austin, TX", user: "user@example.com", time: "2 min ago", status: "success" },
    { query: "Compare rent prices between NYC and SF", user: "investor@demo.com", time: "5 min ago", status: "success" },
    { query: "Best investment markets 2024", user: "agent@realty.com", time: "8 min ago", status: "success" },
    { query: "3-bedroom homes under $500k Denver", user: "buyer@gmail.com", time: "12 min ago", status: "success" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor system performance, manage data ingestion, and configure settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Metrics */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">{metric.label}</span>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                    <div className="text-sm text-emerald-600">{metric.change} from last hour</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Query Activity</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Live Query Feed</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentQueries.map((query, index) => (
                    <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">{query.query}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{query.user}</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{query.time}</span>
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                          {query.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Ingestion Tab */}
        {activeTab === 'ingestion' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Source Status</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Active Data Pipelines</span>
                    <span className="text-sm text-gray-500">Last updated: 30 seconds ago</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {ingestionStatus.map((source, index) => (
                    <div key={index} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            source.status === 'active' ? 'bg-emerald-500' : 
                            source.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{source.source}</p>
                            <p className="text-xs text-gray-500">
                              {source.records} records • Updated {source.lastUpdate}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          source.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : source.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {source.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingestion Controls */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pipeline Controls</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Manual Sync</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Trigger a manual data synchronization from all active sources
                  </p>
                  <button className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors duration-200">
                    Start Sync
                  </button>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Pipeline Health</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View detailed logs and performance metrics for all pipelines
                  </p>
                  <button className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200">
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Analytics</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-700 mb-1">2,847</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-1">15,234</div>
                  <div className="text-sm text-gray-600">Total Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-700 mb-1">94.2%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Management</h2>
              <p className="text-gray-600 mb-4">Configure user roles and permissions for system access</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Administrator</span>
                    <span className="text-sm text-gray-500 ml-2">Full system access</span>
                  </div>
                  <span className="text-sm text-gray-500">5 users</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Analyst</span>
                    <span className="text-sm text-gray-500 ml-2">Read-only data access</span>
                  </div>
                  <span className="text-sm text-gray-500">23 users</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Standard User</span>
                    <span className="text-sm text-gray-500 ml-2">Chat interface access</span>
                  </div>
                  <span className="text-sm text-gray-500">2,819 users</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">AI Model</span>
                    <p className="text-sm text-gray-500">Primary language model for query processing</p>
                  </div>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Snowflake Cortex</option>
                    <option>OpenAI GPT-4</option>
                    <option>Google Gemini</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Rate Limiting</span>
                    <p className="text-sm text-gray-500">Maximum queries per user per hour</p>
                  </div>
                  <input 
                    type="number" 
                    defaultValue="100" 
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Cache TTL</span>
                    <p className="text-sm text-gray-500">Cache time-to-live in seconds</p>
                  </div>
                  <input 
                    type="number" 
                    defaultValue="300" 
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Query Logging</span>
                    <p className="text-sm text-gray-500">Enable detailed logging for all user queries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">PII Masking</span>
                    <p className="text-sm text-gray-500">Automatically mask personally identifiable information</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;