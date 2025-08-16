const snowflake = require('snowflake-sdk');
const axios = require('axios');

// Gemini API helper
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return null;
  }
  
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    return (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a response.'
    );
  } catch (err) {
    console.error('Gemini API error:', err?.response?.data || err.message);
    return null;
  }
}

// Utility function to remove underscores from object keys
const removeUnderscores = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(removeUnderscores);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = key.replace(/_/g, ' ');
      newObj[newKey] = removeUnderscores(value);
    }
    return newObj;
  }
  return obj;
};

export default function handler(req, res) {
  return new Promise((resolve) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      resolve();
      return;
    }
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      resolve();
      return;
    }

    const { message } = req.body || {};
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      resolve();
      return;
    }

    // Check environment variables
    const requiredEnvVars = ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USERNAME', 'SNOWFLAKE_PASSWORD', 'SNOWFLAKE_DATABASE', 'SNOWFLAKE_SCHEMA', 'SNOWFLAKE_WAREHOUSE'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      res.status(500).json({ error: `Missing environment variables: ${missingVars.join(', ')}` });
      resolve();
      return;
    }

    // Create Snowflake connection
    const connection = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      role: 'ACCOUNTADMIN'
    });

    const lowerMessage = message.toLowerCase();
    let sqlQuery = '';
    let responseText = '';
    let params = [];
    let isPropertyList = false;

    // Simple query logic
    if (lowerMessage.includes('cities')) {
      sqlQuery = 'SELECT DISTINCT CITY, STATE, COUNT(*) as PROPERTY_COUNT FROM PROPERTY WHERE CITY IS NOT NULL GROUP BY CITY, STATE ORDER BY PROPERTY_COUNT DESC, CITY LIMIT 20';
      responseText = 'Here are cities available in our database:';
      isPropertyList = true;
    } else if (lowerMessage.includes('properties') && !lowerMessage.includes(' in ')) {
      // Show city popup for generic property requests
      sqlQuery = 'SELECT DISTINCT CITY FROM PROPERTY WHERE CITY IS NOT NULL ORDER BY CITY LIMIT 15';
      responseText = 'What city would you like to see properties in?';
      
      connection.connect((err) => {
        if (err) {
          console.error('Snowflake connection error:', err);
          res.status(500).json({ error: `Database connection failed: ${err.message}` });
          resolve();
          return;
        }
        
        connection.execute({
          sqlText: sqlQuery,
          complete: function(err, stmt, rows) {
            if (err) {
              console.error('SQL execution error:', err);
              res.status(500).json({ error: `Query failed: ${err.message}` });
            } else {
              const cities = rows ? rows.map(row => row.CITY) : [];
              res.json({ 
                response: responseText, 
                data: [], 
                count: 0,
                suggestions: cities,
                showCityPopup: true
              });
            }
            resolve();
          }
        });
      });
      return;
    } else if (lowerMessage.includes('properties') && lowerMessage.includes(' in ')) {
      // Extract city name from "Properties in [City]" query
      const cityMatch = lowerMessage.match(/properties\s+in\s+([a-zA-Z\s]+)/i);
      if (cityMatch) {
        const cityName = cityMatch[1].trim();
        sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?) ORDER BY BUILDING_NAME LIMIT 20';
        params = [`%${cityName}%`];
        responseText = `Properties in ${cityName}:`;
        isPropertyList = true;
      } else {
        sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE BUILDING_NAME IS NOT NULL ORDER BY BUILDING_NAME LIMIT 10';
        responseText = 'Here are some properties:';
        isPropertyList = true;
      }
    } else if (lowerMessage.includes('properties')) {
      sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE BUILDING_NAME IS NOT NULL ORDER BY BUILDING_NAME LIMIT 10';
      responseText = 'Here are some properties:';
      isPropertyList = true;
    } else if (lowerMessage.includes('lease')) {
      sqlQuery = `
        SELECT
            l.street_address,
            l.city,
            l.state,
            p.building_name,
            l.starting_rent,
            l.net_effective_rent,
            l.lease_type,
            l.lease_term
        FROM
            lease l
            JOIN property p ON l.property_id = p.id
        ORDER BY l.execution_date DESC
        LIMIT 10
      `;
      responseText = 'Here is recent lease information:';
    } else if (lowerMessage.includes('rent') || lowerMessage.includes('average')) {
      sqlQuery = 'SELECT AVG(starting_rent) as AVG_STARTING_RENT, AVG(net_effective_rent) as AVG_NET_RENT FROM lease WHERE starting_rent IS NOT NULL';
      responseText = 'Here is the average rent information:';
    } else {
      res.json({ response: 'I can help you search for cities, properties, leases, and rent information. Try: "Show me properties", "What cities are available?", or "Show me lease data"' });
      resolve();
      return;
    }

    connection.connect((err) => {
      if (err) {
        console.error('Snowflake connection error:', err);
        res.status(500).json({ error: `Database connection failed: ${err.message}` });
        resolve();
        return;
      }
      
      connection.execute({
        sqlText: sqlQuery,
        binds: params,
        complete: async function(err, stmt, rows) {
          if (err) {
            console.error('SQL execution error:', err);
            res.status(500).json({ error: `Query failed: ${err.message}` });
            resolve();
          } else {
            if (rows && rows.length > 0) {
              if (isPropertyList) {
                const count = rows.length;
                const list = rows.map((prop, index) => {
                  if (prop.CITY && prop.STATE && prop.PROPERTY_COUNT) {
                    return `${index + 1}. ${prop.CITY}, ${prop.STATE} (${prop.PROPERTY_COUNT} properties)`;
                  } else {
                    return `${index + 1}. ${prop.BUILDING_NAME} – ${prop.CITY}, ${prop.STATE || 'N/A'}`;
                  }
                }).join('\n\n');
                
                try {
                  const dataContext = JSON.stringify(rows.slice(0, 3));
                  const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this property data: ${dataContext}, provide a brief, professional response (2-3 sentences) that introduces the ${count} results found. Be conversational and helpful.`;
                  const enhancedIntro = await callGemini(geminiPrompt);
                  const enhancedResponse = enhancedIntro ? `${enhancedIntro}\n\n${list}` : `${responseText}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                } catch (error) {
                  const enhancedResponse = `${responseText}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                }
              } else {
                // Format lease/rent data
                const formattedRows = rows.map(row => {
                  if (row.AVG_STARTING_RENT || row.AVG_NET_RENT) {
                    return {
                      ...row,
                      AVG_STARTING_RENT: row.AVG_STARTING_RENT ? `$${parseFloat(row.AVG_STARTING_RENT).toFixed(2)}` : 'N/A',
                      AVG_NET_RENT: row.AVG_NET_RENT ? `$${parseFloat(row.AVG_NET_RENT).toFixed(2)}` : 'N/A'
                    };
                  }
                  return row;
                });
                
                try {
                  const dataContext = JSON.stringify(formattedRows.slice(0, 3));
                  const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this data: ${dataContext}, provide a brief, professional response (2-3 sentences) that explains what the data shows. Be conversational and helpful.`;
                  const enhancedResponse = await callGemini(geminiPrompt);
                  res.json({ response: enhancedResponse || responseText, data: removeUnderscores(formattedRows), count: formattedRows.length });
                } catch (error) {
                  res.json({ response: responseText, data: removeUnderscores(formattedRows), count: formattedRows.length });
                }
              }
            } else {
              res.json({ response: 'No data found for your query.', data: [], count: 0 });
            }
            resolve();
          }
        }
      });
    });
  });
}