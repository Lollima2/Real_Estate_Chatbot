module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Check environment variables
    const envCheck = {
      SNOWFLAKE_ACCOUNT: !!process.env.SNOWFLAKE_ACCOUNT,
      SNOWFLAKE_USERNAME: !!process.env.SNOWFLAKE_USERNAME,
      SNOWFLAKE_PASSWORD: !!process.env.SNOWFLAKE_PASSWORD,
      SNOWFLAKE_DATABASE: !!process.env.SNOWFLAKE_DATABASE,
      SNOWFLAKE_SCHEMA: !!process.env.SNOWFLAKE_SCHEMA,
      SNOWFLAKE_WAREHOUSE: !!process.env.SNOWFLAKE_WAREHOUSE,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
    };
    
    res.json({
      status: 'API is working',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      method: req.method,
      url: req.url
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ error: error.message });
  }
};