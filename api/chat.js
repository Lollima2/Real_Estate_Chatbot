const snowflake = require('snowflake-sdk');

let connection;

// Initialize Snowflake connection
if (!connection) {
  connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE
  });

  connection.connect((err) => {
    if (err) {
      console.error('Unable to connect to Snowflake:', err.message);
    } else {
      console.log('Successfully connected to Snowflake');
    }
  });
}

module.exports = (req, res) => {
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

  const lowerMessage = message.toLowerCase();
  let sqlQuery = '';
  let responseText = '';

  // Simple property search logic
  if (lowerMessage.includes('show me properties') && !lowerMessage.includes('in ')) {
    sqlQuery = 'SELECT DISTINCT CITY FROM PROPERTY WHERE CITY IS NOT NULL ORDER BY CITY LIMIT 15';
    responseText = 'What city would you like to see properties in?';
    
    connection.execute({
      sqlText: sqlQuery,
      complete: function(err, stmt, rows) {
        if (err) {
          console.error('SQL Error:', err.message);
          res.status(500).json({ error: err.message });
        } else {
          const cities = rows ? rows.map(row => row.CITY) : [];
          res.json({ 
            response: responseText, 
            data: [], 
            count: 0,
            suggestions: cities.slice(0, 10)
          });
        }
      }
    });
    return;
  }
  
  // City-specific property search
  const cityMatch = lowerMessage.match(/properties in ([a-zA-Z\s]+)/);
  if (cityMatch) {
    const city = cityMatch[1].trim();
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?) ORDER BY BUILDING_NAME LIMIT 10';
    
    connection.execute({
      sqlText: sqlQuery,
      binds: [`%${city}%`],
      complete: function(err, stmt, rows) {
        if (err) {
          console.error('SQL Error:', err.message);
          res.status(500).json({ error: err.message });
        } else {
          if (rows && rows.length > 0) {
            const list = rows.map((prop, index) => 
              `${index + 1}. ${prop.BUILDING_NAME}`
            ).join('\n\n');
            const response = `Here are ${rows.length} properties in ${city}:\n\n${list}`;
            res.json({ response, data: rows, count: rows.length });
          } else {
            res.json({ 
              response: `I couldn't find any properties in ${city}.`, 
              data: [], 
              count: 0 
            });
          }
        }
      }
    });
    return;
  }

  // Default response
  res.json({ 
    response: 'I can help you search for properties. Try: "Show me properties" or "Properties in New York"',
    count: 0
  });
};