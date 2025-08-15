import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Home, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
  suggestions?: string[];
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I’m Cresta, your AI-powered commercial real estate assistant, built with Snowflake and Gemini AI. I can provide you with a list of commercial properties and their details — all within the United States. The property information is sourced from the Snowflake Marketplace listing Commercial Real Estate Data by CompStak (view listing) and represents a snapshot as of 2023 Q2. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    "Show me properties",
    "What cities are available?",
    "What's the average rent?",
    "Show me lease data"
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api/chat' : '/api/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('API Response:', data);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || 'Sorry, there was an error generating a response.',
        timestamp: new Date(),
        data: data.data || [],
        suggestions: data.suggestions
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: error instanceof Error ? error.message : 'Sorry, I\'m having trouble connecting to the database. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    }
    
    setIsTyping(false);
  };



  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    // Auto-send the suggestion
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Real Estate AI Assistant</h1>
            <p className="text-sm text-gray-500">Powered by Snowflake & AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-emerald-700 ml-3' 
                  : 'bg-gray-200 mr-3'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                </div>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2 text-emerald-700 font-medium mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span>Suggested cities:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(suggestion)}
                          className="text-left text-sm p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200 border border-transparent hover:border-emerald-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Data visualization */}
                {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                  <div className="mt-3 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2 text-emerald-700 font-medium mb-3">
                      <Home className="w-4 h-4" />
                      <span>Database Results ({message.data.length} records)</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {message.data.map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                          {Object.entries(item).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1">
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="text-gray-900">{value?.toString() || 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs text-gray-400 mt-1 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">Try asking:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-left text-sm p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200 border border-transparent hover:border-emerald-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask about real estate markets, prices, trends..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all duration-200"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;