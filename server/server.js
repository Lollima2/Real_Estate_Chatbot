// Basic Express server with Snowflake connection
require('dotenv').config();
const express = require('express');
const snowflake = require('snowflake-sdk');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// Snowflake connection configuration
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  role: 'ACCOUNTADMIN'
});

// Connect to Snowflake
connection.connect((err, conn) => {
  if (err) {
    console.error('Unable to connect to Snowflake:', err.message);
  } else {
    console.log('Successfully connected to Snowflake.');
    console.log('=== Database Configuration ===');
    console.log(`Database: ${process.env.SNOWFLAKE_DATABASE}`);
    console.log(`Schema: ${process.env.SNOWFLAKE_SCHEMA}`);
    console.log(`Tables: PROPERTY, LEASE`);
    console.log(`Warehouse: ${process.env.SNOWFLAKE_WAREHOUSE}`);
    console.log('==============================');
  }
});

// Test endpoint
app.get('/test-snowflake', (req, res) => {
  connection.execute({
    sqlText: 'SHOW TABLES',
    complete: function(err, stmt, rows) {
      if (err) {
        console.error('SHOW TABLES error:', err.message);
        res.status(500).json({ error: err.message });
      } else {
        console.log('Available tables:', rows);
        res.json({ tables: rows });
      }
    }
  });
});

// Debug endpoint to check column names
app.get('/debug-columns', (req, res) => {
  connection.execute({
    sqlText: 'SELECT * FROM PROPERTY LIMIT 1',
    complete: function(err, stmt, rows) {
      if (err) {
        console.error('Column check error:', err.message);
        res.status(500).json({ error: err.message });
      } else {
        const columns = rows && rows[0] ? Object.keys(rows[0]) : [];
        console.log('PROPERTY columns:', columns);
        res.json({ columns: columns });
      }
    }
  });
});

// Get properties data
app.get('/api/properties', (req, res) => {
  connection.execute({
    sqlText: 'SELECT * FROM PROPERTY LIMIT 100',
    complete: function(err, stmt, rows) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  });
});

// Get lease data
app.get('/api/leases', (req, res) => {
  connection.execute({
    sqlText: 'SELECT * FROM LEASE LIMIT 100',
    complete: function(err, stmt, rows) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  });
});

// Parse user input with flexible patterns and grammar tolerance
const parseUserInput = (message) => {
  const lowerMessage = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract building class (Class A, B, C)
  const classMatch = lowerMessage.match(/class\s+([abc])/i);
  const buildingClass = classMatch ? classMatch[1].toUpperCase() : null;
  
  // Extract city name with flexible patterns
  const cityMatch = lowerMessage.match(/(?:properties|list)\s+(?:of\s+properties\s+)?(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s*$|,|\.)/i) ||
                   lowerMessage.match(/(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|\s*$|,|\.)/i) || 
                   lowerMessage.match(/([a-zA-Z\s]+?)\s+(?:properties|buildings)/i);
  const city = cityMatch ? cityMatch[1].trim().replace(/\s+/g, ' ') : null;
  
  // Extract building name with flexible patterns
  const buildingMatch = lowerMessage.match(/(?:details|information|info)\s+(?:of|about|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:year|built|renovated|size|floors).*?(?:of|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:year|built|renovated|size|floors).*?(?:of|for)\s+([0-9]+\s+[a-zA-Z\s]+)/i) ||
                       lowerMessage.match(/(?:year)\s+([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex))\s+(?:built|build)/i) ||
                       lowerMessage.match(/(?:year)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex))\s+(?:was\s+)?(?:built|build|renovated|renovate)/i) ||
                       lowerMessage.match(/([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))\s+(?:was|is)/i) ||
                       lowerMessage.match(/(?:in|of|about|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex|\s+avenue|\s+street))/i) ||
                       lowerMessage.match(/(?:details|information|info)\s+(?:of|about|for)\s+([0-9]+\s+[a-zA-Z\s]+(?:ave|avenue|st|street|rd|road|blvd|boulevard)\s*[a-zA-Z]*)/i) ||
                       lowerMessage.match(/([0-9]+\s+[a-zA-Z\s]+(?:ave|avenue|st|street|rd|road|blvd|boulevard)\s*[a-zA-Z]*)/i);
  const buildingName = buildingMatch ? buildingMatch[1].trim() : null;
  
  // Check for general detail requests
  const isDetailRequest = lowerMessage.includes('detail') || lowerMessage.includes('details') || 
                         lowerMessage.includes('information') || lowerMessage.includes('info');
  
  // Enhanced field mapping with variations and missing fields
  const fieldMap = {
    'size': 'BUILDING_SIZE',
    'building size': 'BUILDING_SIZE',
    'square feet': 'BUILDING_SIZE',
    'sqft': 'BUILDING_SIZE',
    'floors': 'NUMBER_OF_FLOORS',
    'floor': 'NUMBER_OF_FLOORS',
    'stories': 'NUMBER_OF_FLOORS',
    'story': 'NUMBER_OF_FLOORS',
    'levels': 'NUMBER_OF_FLOORS',
    'property subtype': 'PROPERTY_SUB_TYPE',
    'subtype': 'PROPERTY_SUB_TYPE', 
    'sub type': 'PROPERTY_SUB_TYPE',
    'year renovated': 'YEAR_RENOVATED',
    'year of renovation': 'YEAR_RENOVATED', 
    'renovated': 'YEAR_RENOVATED',
    'renovate': 'YEAR_RENOVATED',
    'renovation': 'YEAR_RENOVATED',
    'renovation year': 'YEAR_RENOVATED',
    'year built': 'YEAR_BUILT',
    'built': 'YEAR_BUILT',
    'build': 'YEAR_BUILT',
    'what year': 'YEAR_BUILT',
    'when was': 'YEAR_BUILT',
    'year was built': 'YEAR_BUILT',
    'was built': 'YEAR_BUILT',
    'landlord': 'CURRENT_LANDLORD',
    'current landlord': 'CURRENT_LANDLORD',
    'owner': 'CURRENT_LANDLORD'
  };
  
  let specificField = null;
  for (const [keyword, column] of Object.entries(fieldMap)) {
    if (lowerMessage.includes(keyword)) {
      specificField = column;
      break;
    }
  }
  
  return { buildingClass, city, buildingName, specificField, isDetailRequest };
};

// Format response based on field type with enhanced responses
const formatFieldResponse = (fieldName, value, buildingName) => {
  if (!value || value === null || value === '') return `No ${fieldName.toLowerCase().replace('_', ' ')} information available for ${buildingName}.`;
  
  const currentYear = new Date().getFullYear();
  const yearValue = parseInt(value);
  console.log(`Processing field ${fieldName} with value:`, value, 'parsed as:', yearValue);
  
  switch (fieldName) {
    case 'BUILDING_SIZE':
      return `${value.toLocaleString()} sq ft`;
    case 'NUMBER_OF_FLOORS':
      const floorCount = parseInt(value);
      if (floorCount >= 20) {
        return `${buildingName} is an impressive ${value}-story high-rise, offering commanding views and substantial vertical presence in the market. This tower configuration provides excellent visibility and prestige for tenants.`;
      } else if (floorCount >= 10) {
        return `${buildingName} features ${value} floors, representing a well-proportioned mid-rise structure that balances accessibility with professional stature and efficient vertical transportation.`;
      } else {
        return `${buildingName} has ${value} floors, providing a more intimate, low-rise environment that offers easy access and a human-scale professional atmosphere.`;
      }
    case 'YEAR_BUILT':
      const ageBuilt = currentYear - yearValue;
      return `${buildingName} was built in ${yearValue} (${ageBuilt} years ago).`;
    case 'YEAR_RENOVATED':
    case 'YEAR_OF_RENOVATION':
      if (yearValue > 1900) {
        const ageRenovated = currentYear - yearValue;
        return `${buildingName} was last renovated in ${yearValue} (${ageRenovated} years ago).`;
      } else {
        return `${buildingName} has not been renovated or renovation year is not available.`;
      }
    default:
      return value.toString();
  }
};

// Format property list as numbered bullets
const formatPropertyList = (properties) => {
  return properties.map((prop, index) => 
    `${index + 1}. ${prop.BUILDING_NAME} – ${prop.CITY}, ${prop.STATE || 'N/A'}`
  ).join('\n\n');
};

// Format city-specific property list with header
const formatCityPropertyList = (properties, city) => {
  const header = `Properties in ${city}\n\n`;
  const list = properties.map((prop, index) => 
    `${index + 1}. ${prop.BUILDING_NAME}`
  ).join('\n\n');
  return header + list;
};

// Enhanced property list response using Gemini
const enhancePropertyListResponse = async (properties, city = null) => {
  const propertyNames = properties.map(p => p.BUILDING_NAME).join(', ');
  const count = properties.length;
  
  const prompt = city ? 
    `Create a brief, professional response about ${count} commercial real estate properties in ${city}. The properties are: ${propertyNames}. Make it conversational and informative in 2-3 sentences.` :
    `Create a brief, professional response about ${count} commercial real estate properties. The properties are: ${propertyNames}. Make it conversational and informative in 2-3 sentences.`;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    const enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const list = properties.map((prop, index) => 
      `${index + 1}. ${prop.BUILDING_NAME}`
    ).join('\n\n');
    
    return `${enhancedText}\n\n${list}`;
  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('API Key exists:', !!process.env.GEMINI_API_KEY);
    return city ? formatCityPropertyList(properties, city) : formatPropertyList(properties);
  }
};

// Chatbot endpoint for natural language queries
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();
  const filters = parseUserInput(message);
  
  let sqlQuery = '';
  let responseText = '';
  let params = [];
  let isSpecificField = false;
  let isPropertyList = false;
  let isCityPropertyList = false;
  
  // Check for building class availability requests first
  if (lowerMessage.includes('building classes are available') || lowerMessage.includes('what building classes') ||
      lowerMessage.includes('available building class') || lowerMessage.includes('building class available') ||
      lowerMessage.includes('building classes')) {
    sqlQuery = 'SELECT DISTINCT BUILDING_CLASS FROM PROPERTY WHERE BUILDING_CLASS IS NOT NULL ORDER BY BUILDING_CLASS';
    responseText = 'Our portfolio features premium commercial properties across multiple building classifications:';
    isPropertyList = true;
  }
  // Check for city-specific property list requests
  else if (filters.city && (lowerMessage.includes('show me properties') || lowerMessage.includes('list of properties') || 
      lowerMessage.includes('give me list of properties') || lowerMessage.includes('properties list'))) {
    sqlQuery = 'SELECT BUILDING_NAME FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?) ORDER BY BUILDING_NAME';
    params = [`%${filters.city}%`];
    responseText = '';
    isCityPropertyList = true;
  }
  // Check for general property list requests
  else if (lowerMessage.includes('show me properties') || lowerMessage.includes('list of properties') || 
      lowerMessage.includes('give me list of properties') || lowerMessage.includes('properties list') ||
      lowerMessage.includes('show me list of properties') || lowerMessage.includes('show me list of all properties')) {
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY ORDER BY BUILDING_NAME LIMIT 50';
    responseText = '';
    isPropertyList = true;
  }
  // Priority order: Building Name > Building Class > City > General queries
  else if (filters.buildingName) {
    if (filters.specificField) {
      // Try the query and handle column not found errors
      sqlQuery = `SELECT BUILDING_NAME, ${filters.specificField} FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?) LIMIT 1`;
      params = [`%${filters.buildingName}%`];
      responseText = '';
      isSpecificField = true;
    } else if (filters.isDetailRequest) {
      sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)';
      params = [`%${filters.buildingName}%`];
      responseText = `Here's a comprehensive overview of ${filters.buildingName}, a premier commercial property. This detailed profile showcases the building's key specifications, location advantages, and investment potential in today's dynamic real estate market.`;
    } else {
      sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)';
      params = [`%${filters.buildingName}%`];
      responseText = `Here's a comprehensive overview of ${filters.buildingName}, a premier commercial property. This detailed profile showcases the building's key specifications, location advantages, and investment potential in today's dynamic real estate market.`;
    }
  } else if (filters.buildingClass) {
    sqlQuery = 'SELECT BUILDING_NAME FROM PROPERTY WHERE UPPER(BUILDING_CLASS) = ? ORDER BY BUILDING_NAME';
    params = [filters.buildingClass];
    responseText = `Here's our premium collection of Class ${filters.buildingClass} commercial properties:`;
    isPropertyList = true;
  } else if (filters.city) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?)';
    params = [`%${filters.city}%`];
    responseText = `Properties in ${filters.city}:`;
  } else if (lowerMessage.includes('properties') || lowerMessage.includes('buildings')) {
    sqlQuery = 'SELECT * FROM PROPERTY LIMIT 10';
    responseText = 'Here are properties in our database:';
  } else if (lowerMessage.includes('lease')) {
    sqlQuery = 'SELECT * FROM LEASE LIMIT 10';
    responseText = 'Here is lease information:';
  } else if (lowerMessage.includes('rent') || lowerMessage.includes('average rent')) {
    sqlQuery = 'SELECT AVG(RENT_PSF) as AVG_RENT FROM LEASE WHERE RENT_PSF IS NOT NULL';
    responseText = 'Here is the average rent per square foot:';
  } else {
    return res.json({ response: 'I can help you search for specific buildings, cities, building classes (A, B, C), properties, leases, and rent information. Try: "Show me Class A properties" or "Properties in New York"' });
  }
  
  console.log('Original message:', message);
  console.log('Parsed filters:', filters);
  console.log('Building name detected:', filters.buildingName);
  console.log('Specific field detected:', filters.specificField);
  console.log('Executing SQL:', sqlQuery);
  console.log('Parameters:', params);
  
  connection.execute({
    sqlText: sqlQuery,
    binds: params,
    complete: async function(err, stmt, rows) {
      if (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: err.message });
      } else {
        console.log('Query returned', rows ? rows.length : 0, 'rows');
        if (rows && rows.length > 0) {
          if (isSpecificField && rows[0]) {
            const fieldValue = rows[0][filters.specificField];
            if (fieldValue !== undefined) {
              const formattedValue = formatFieldResponse(filters.specificField, fieldValue, rows[0].BUILDING_NAME);
              console.log('Formatted response:', formattedValue);
              res.json({ response: formattedValue, data: [], count: 0 });
            } else {
              // Field doesn't exist, show all building data instead
              res.json({ response: `Here are all available details for ${rows[0].BUILDING_NAME}:`, data: rows, count: rows.length });
            }
          } else if (isPropertyList) {
            const count = rows.length;
            const intro = responseText || `Here are ${count} premium commercial properties in our portfolio. These assets offer diverse investment opportunities across key markets.`;
            const list = rows.map((prop, index) => {
              if (prop.BUILDING_CLASS && !prop.BUILDING_NAME) {
                return `${index + 1}. Class ${prop.BUILDING_CLASS}`;
              } else if (prop.CITY && prop.STATE) {
                return `${index + 1}. ${prop.BUILDING_NAME} – ${prop.CITY}, ${prop.STATE || 'N/A'}`;
              } else {
                return `${index + 1}. ${prop.BUILDING_NAME}`;
              }
            }).join('\n\n');
            const enhancedResponse = `${intro}\n\n${list}`;
            res.json({ response: enhancedResponse, data: [], count: rows.length });
          } else if (isCityPropertyList) {
            const count = rows.length;
            const intro = `Here are ${count} premium commercial properties in ${filters.city}. These represent excellent investment opportunities in this dynamic market.`;
            const list = rows.map((prop, index) => 
              `${index + 1}. ${prop.BUILDING_NAME}`
            ).join('\n\n');
            const enhancedResponse = `${intro}\n\n${list}`;
            res.json({ response: enhancedResponse, data: [], count: rows.length });
          } else {
            res.json({ response: responseText, data: rows, count: rows.length });
          }
        } else {
          const noDataMessage = filters.buildingName ? 
            `I couldn't find any information about ${filters.buildingName} in our current portfolio. This building may not be in our database or the name might be spelled differently.` :
            filters.city ? 
            `I apologize, but we currently don't have any properties available in ${filters.city}. Our portfolio focuses on other key markets at this time. Would you like to explore properties in our available locations, or I can help you find information about our current inventory in other cities?` :
            filters.buildingClass ? 
            `I apologize, but Class ${filters.buildingClass} properties are not currently available in our portfolio. Our current inventory focuses on other building classifications. Would you like to see what building classes we do have available, or explore properties in a specific location instead?` :
            'I apologize, but I don\'t have any property information available right now. Please try again later or contact support for assistance.';
          res.json({ response: noDataMessage, data: [], count: 0 });
        }
      }
    }
  });
});

app.listen(port, () => {
  console.log(`\n🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Using Snowflake Database: ${process.env.SNOWFLAKE_DATABASE}`);
  console.log(`📋 Schema: ${process.env.SNOWFLAKE_SCHEMA}`);
  console.log(`🏠 Tables: PROPERTY, LEASE`);
  console.log(`💾 Warehouse: ${process.env.SNOWFLAKE_WAREHOUSE}`);
});
