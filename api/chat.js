const snowflake = require('snowflake-sdk');
const axios = require('axios');

// Gemini API helper
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
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
    return 'Sorry, there was an error generating a response.';
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

let connection;

function initConnection() {
  if (!connection) {
    connection = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      role: 'ACCOUNTADMIN'
    });
  }
  return connection;
}

// Parse user input
const parseUserInput = (message) => {
  const lowerMessage = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const classMatch = lowerMessage.match(/class\s+([abc])/i);
  const buildingClass = classMatch ? classMatch[1].toUpperCase() : null;
  
  let city = null;
  if (lowerMessage.includes(' in ') || lowerMessage.includes(' from ') || lowerMessage.includes(' at ') || lowerMessage.includes(' for ')) {
    const cityMatch = lowerMessage.match(/(?:properties|list|buildings)\s+(?:of\s+properties\s+)?(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|\s*$|,|\.)/i) ||
                     lowerMessage.match(/(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|\s*$|,|\.)/i);
    
    if (cityMatch) {
      const potentialCity = cityMatch[1].trim().replace(/\s+/g, ' ');
      const excludeWords = ['show me', 'give me', 'list of', 'all', 'some', 'any', 'properties', 'buildings', 'the', 'a', 'an'];
      if (potentialCity && !excludeWords.some(word => potentialCity.toLowerCase().includes(word)) && potentialCity.length >= 2) {
        city = potentialCity;
      }
    }
  }
  
  const buildingMatch = lowerMessage.match(/(?:lease)\s+(?:of|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:details|information|info)\s+(?:of|about|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:landlord)\s+(?:of|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:current\s+landlord)\s+(?:of|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:show|details|information)\s+(?:me\s+)?(?:of|about)?\s*([0-9]+\s+[a-zA-Z\s]+(?:ave|avenue|st|street|rd|road|blvd|boulevard)\s*[a-zA-Z]*)/i) ||
                       lowerMessage.match(/(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/([0-9]+\s+[a-zA-Z\s]+(?:ave|avenue|st|street|rd|road|blvd|boulevard)\s*[a-zA-Z]*)/i);
  const buildingName = buildingMatch ? buildingMatch[1].trim() : null;
  
  const isDetailRequest = lowerMessage.includes('detail') || lowerMessage.includes('details') || 
                         lowerMessage.includes('information') || lowerMessage.includes('info');
  
  return { buildingClass, city, buildingName, isDetailRequest };
};

module.exports = async (req, res) => {
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

  const conn = initConnection();
  const lowerMessage = message.toLowerCase();
  const filters = parseUserInput(message);
  
  let sqlQuery = '';
  let responseText = '';
  let params = [];
  let isPropertyList = false;
  let isCityPropertyList = false;

  // Enhanced query logic with all patterns
  if (filters.buildingName && (lowerMessage.includes('landlord') || lowerMessage.includes('owner') || lowerMessage.includes('owns')) && 
      (lowerMessage.includes('details') || lowerMessage.includes('of') || lowerMessage.includes('portfolio') || 
       lowerMessage.includes('who') || lowerMessage.includes('show') || lowerMessage.includes('tell') || 
       lowerMessage.includes('information') || lowerMessage.includes('about') || lowerMessage.includes('find'))) {
    sqlQuery = `
      SELECT
          p.current_landlord,
          p.building_name,
          p.street_address,
          p.city,
          p.state,
          p.year_built,
          p.building_class
      FROM
          property p
      WHERE UPPER(p.building_name) LIKE UPPER(?) OR UPPER(p.building_name) LIKE UPPER(?)
    `;
    params = [`%${filters.buildingName}%`, `%${filters.buildingName.replace(/building|tower|center|plaza/gi, '').trim()}%`];
    responseText = `Landlord details for ${filters.buildingName}:`;
  }
  else if (lowerMessage.includes('cities') && (lowerMessage.includes('available') || lowerMessage.includes('what') || 
      lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('which') || 
      lowerMessage.includes('tell') || lowerMessage.includes('find') || lowerMessage.includes('all'))) {
    sqlQuery = 'SELECT DISTINCT CITY, STATE, COUNT(*) as PROPERTY_COUNT FROM PROPERTY WHERE CITY IS NOT NULL GROUP BY CITY, STATE ORDER BY PROPERTY_COUNT DESC, CITY';
    responseText = 'Here are all the cities available in our commercial real estate database:';
    isPropertyList = true;
  }
  else if (lowerMessage.includes('properties') && !filters.city && 
      (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('give') || 
       lowerMessage.includes('find') || lowerMessage.includes('tell') || lowerMessage.includes('what') || 
       lowerMessage.includes('all') || lowerMessage.includes('display'))) {
    sqlQuery = 'SELECT DISTINCT CITY FROM PROPERTY WHERE CITY IS NOT NULL ORDER BY CITY LIMIT 15';
    responseText = 'What city would you like to see properties in?';
    
    return new Promise((resolve) => {
      conn.connect((err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          resolve();
          return;
        }
        
        conn.execute({
          sqlText: sqlQuery,
          complete: function(err, stmt, rows) {
            if (err) {
              res.status(500).json({ error: err.message });
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
    });
  }
  else if (lowerMessage.includes('properties') && filters.city && 
      (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('give') || 
       lowerMessage.includes('find') || lowerMessage.includes('tell') || lowerMessage.includes('what') || 
       lowerMessage.includes('all') || lowerMessage.includes('display'))) {
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?) ORDER BY BUILDING_NAME';
    params = [`%${filters.city}%`];
    responseText = '';
    isCityPropertyList = true;
  }
  else if (filters.buildingName) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?) OR UPPER(STREET_ADDRESS) LIKE UPPER(?)';
    params = [`%${filters.buildingName}%`, `%${filters.buildingName}%`];
    responseText = `Here are the details for ${filters.buildingName}:`;
  }
  else if (filters.city) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?)';
    params = [`%${filters.city}%`];
    responseText = `Properties in ${filters.city}:`;
  }
  else {
    return res.json({ response: 'I can help you search for specific buildings, cities, building classes (A, B, C), properties, leases, and rent information. Try: "Show me Class A properties", "Properties in New York", or "What cities are available?"' });
  }

  return new Promise((resolve) => {
    conn.connect((err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        resolve();
        return;
      }
      
      conn.execute({
        sqlText: sqlQuery,
        binds: params,
        complete: async function(err, stmt, rows) {
          if (err) {
            res.status(500).json({ error: err.message });
            resolve();
          } else {
            if (rows && rows.length > 0) {
              if (isPropertyList) {
                const count = rows.length;
                const list = rows.map((prop, index) => {
                  if (prop.CITY && prop.STATE && prop.PROPERTY_COUNT) {
                    return `${index + 1}. ${prop.CITY}, ${prop.STATE} (${prop.PROPERTY_COUNT} properties)`;
                  } else {
                    return `${index + 1}. ${prop.BUILDING_NAME}`;
                  }
                }).join('\n\n');
                
                try {
                  const dataContext = JSON.stringify(rows.slice(0, 3));
                  const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this property data: ${dataContext}, provide a brief, professional response (2-3 sentences) that introduces the ${count} properties found. Be conversational and helpful.`;
                  const enhancedIntro = await callGemini(geminiPrompt);
                  const enhancedResponse = `${enhancedIntro}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                } catch (error) {
                  const intro = responseText || `Here are ${count} premium commercial properties in our portfolio.`;
                  const enhancedResponse = `${intro}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                }
              } else if (isCityPropertyList) {
                const count = rows.length;
                const list = rows.map((prop, index) => 
                  `${index + 1}. ${prop.BUILDING_NAME}`
                ).join('\n\n');
                
                try {
                  const dataContext = JSON.stringify(rows.slice(0, 3));
                  const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this property data in ${filters.city}: ${dataContext}, provide a brief, professional response (2-3 sentences) that introduces the ${count} properties found in ${filters.city}. Be conversational and helpful.`;
                  const enhancedIntro = await callGemini(geminiPrompt);
                  const enhancedResponse = `${enhancedIntro}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                } catch (error) {
                  const intro = `Here are ${count} premium commercial properties in ${filters.city}.`;
                  const enhancedResponse = `${intro}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                }
              } else {
                try {
                  const dataContext = JSON.stringify(rows.slice(0, 3));
                  const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this data: ${dataContext}, provide a brief, professional response (2-3 sentences) that explains what the data shows. Be conversational and helpful.`;
                  const enhancedResponse = await callGemini(geminiPrompt);
                  res.json({ response: enhancedResponse, data: removeUnderscores(rows), count: rows.length });
                } catch (error) {
                  res.json({ response: responseText, data: removeUnderscores(rows), count: rows.length });
                }
              }
            } else {
              try {
                const geminiPrompt = `You are a commercial real estate assistant. The user asked: "${message}" but no data was found. Provide a brief, professional and helpful response (1-2 sentences) explaining that no results were found and suggest alternative searches. Be conversational and supportive.`;
                const enhancedResponse = await callGemini(geminiPrompt);
                res.json({ response: enhancedResponse, data: [], count: 0 });
              } catch (error) {
                const noDataMessage = filters.buildingName ? 
                  `I couldn't find any information about ${filters.buildingName} in our current portfolio.` :
                  filters.city ? 
                  `I apologize, but we currently don't have any properties available in ${filters.city}.` :
                  'I apologize, but I don\'t have any property information available right now.';
                res.json({ response: noDataMessage, data: [], count: 0 });
              }
            }
            resolve();
          }
        }
      });
    });
  });
};