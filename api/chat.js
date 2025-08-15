// Vercel serverless function for chat endpoint
const snowflake = require('snowflake-sdk');

// Parse user input
const parseUserInput = (message) => {
  const lowerMessage = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const classMatch = lowerMessage.match(/class\s+([abc])/i);
  const buildingClass = classMatch ? classMatch[1].toUpperCase() : null;
  
  const cityMatch = lowerMessage.match(/(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|\s*$|,|\.)/i) || 
                   lowerMessage.match(/([a-zA-Z\s]+?)\s+(?:properties|buildings)/i);
  const city = cityMatch ? cityMatch[1].trim().replace(/\s+/g, ' ') : null;
  
  return { buildingClass, city };
};

export default async function handler(req, res) {
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

  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const lowerMessage = message.toLowerCase();
  const filters = parseUserInput(message);
  
  // Simple query logic
  if (lowerMessage.includes('show me properties') && !filters.city) {
    return res.json({ 
      response: 'On what city do you want to see the properties?',
      suggestions: ['Properties in New York', 'Properties in Los Angeles', 'Properties in Chicago']
    });
  }

  // Create connection
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    role: 'ACCOUNTADMIN'
  });

  let sqlQuery = '';
  let responseText = '';
  let params = [];
  
  if (filters.city) {
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?) ORDER BY BUILDING_NAME LIMIT 10';
    params = [`%${filters.city}%`];
    responseText = `Properties in ${filters.city}:`;
  } else if (filters.buildingClass) {
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE UPPER(BUILDING_CLASS) = ? ORDER BY BUILDING_NAME LIMIT 10';
    params = [filters.buildingClass];
    responseText = `Class ${filters.buildingClass} properties:`;
  } else {
    return res.json({ response: 'I can help you search for properties by city or building class. Try: "Show me properties" or "Class A properties"' });
  }

  try {
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sqlQuery,
        binds: params,
        complete: function(err, stmt, rows) {
          if (err) reject(err);
          else resolve(rows);
        }
      });
    });

    if (result && result.length > 0) {
      const list = result.map((prop, index) => 
        `${index + 1}. ${prop.BUILDING_NAME} – ${prop.CITY}, ${prop.STATE}`
      ).join('\n\n');
      
      res.json({ 
        response: `${responseText}\n\n${list}`,
        count: result.length 
      });
    } else {
      res.json({ 
        response: `No properties found for your search.`,
        count: 0 
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
}