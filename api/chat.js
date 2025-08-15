module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Simple response for now
  if (message.toLowerCase().includes('show me properties')) {
    return res.status(200).json({ 
      response: 'On what city do you want to see the properties?',
      suggestions: ['Properties in New York', 'Properties in Los Angeles', 'Properties in Chicago'],
      count: 0
    });
  }

  return res.status(200).json({ 
    response: 'I can help you search for properties by city. Try: "Show me properties"',
    count: 0
  });
};