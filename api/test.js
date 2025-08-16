export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return res.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}