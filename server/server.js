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

// Check environment variables
console.log('Environment check:');
console.log('SNOWFLAKE_ACCOUNT:', process.env.SNOWFLAKE_ACCOUNT ? 'Set' : 'Missing');
console.log('SNOWFLAKE_USERNAME:', process.env.SNOWFLAKE_USERNAME ? 'Set' : 'Missing');
console.log('SNOWFLAKE_PASSWORD:', process.env.SNOWFLAKE_PASSWORD ? 'Set' : 'Missing');
console.log('SNOWFLAKE_WAREHOUSE:', process.env.SNOWFLAKE_WAREHOUSE ? 'Set' : 'Missing');
console.log('SNOWFLAKE_DATABASE:', process.env.SNOWFLAKE_DATABASE ? 'Set' : 'Missing');
console.log('SNOWFLAKE_SCHEMA:', process.env.SNOWFLAKE_SCHEMA ? 'Set' : 'Missing');

// Connect to Snowflake
connection.connect((err, conn) => {
  if (err) {
    console.error('Unable to connect to Snowflake:', err.message);
    console.error('Full error:', err);
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

// Get available cities
app.get('/api/cities', (req, res) => {
  connection.execute({
    sqlText: 'SELECT DISTINCT CITY, STATE, COUNT(*) as PROPERTY_COUNT FROM PROPERTY WHERE CITY IS NOT NULL GROUP BY CITY, STATE ORDER BY PROPERTY_COUNT DESC, CITY',
    complete: function(err, stmt, rows) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      snowflake_account: process.env.SNOWFLAKE_ACCOUNT ? 'Set' : 'Missing',
      snowflake_username: process.env.SNOWFLAKE_USERNAME ? 'Set' : 'Missing',
      snowflake_database: process.env.SNOWFLAKE_DATABASE ? 'Set' : 'Missing'
    }
  });
});

// Welcome message endpoint
app.get('/api/welcome', (req, res) => {
  const welcomeMessage = "Hello! I'm Cresta, your AI-powered commercial real estate assistant, built with Snowflake and Gemini AI. I can provide you with a list of commercial properties and their details — all within the United States. What would you like to explore today?";
  res.json({ message: welcomeMessage });
});

// Parse user input with flexible patterns and grammar tolerance
const parseUserInput = (message) => {
  const lowerMessage = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract building class (Class A, B, C)
  const classMatch = lowerMessage.match(/class\s+([abc])/i);
  const buildingClass = classMatch ? classMatch[1].toUpperCase() : null;
  
  // Extract city name only when explicitly mentioned with location prepositions
  let city = null;
  
  // Only look for cities when there are clear location indicators
  if (lowerMessage.includes(' in ') || lowerMessage.includes(' from ') || lowerMessage.includes(' at ') || lowerMessage.includes(' for ')) {
    const cityMatch = lowerMessage.match(/(?:properties|list|buildings)\s+(?:of\s+properties\s+)?(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|\s*$|,|\.)/i) ||
                     lowerMessage.match(/(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|\s*$|,|\.)/i);
    
    if (cityMatch) {
      const potentialCity = cityMatch[1].trim().replace(/\s+/g, ' ');
      
      // Filter out common phrases that aren't cities
      const excludeWords = ['show me', 'give me', 'list of', 'all', 'some', 'any', 'properties', 'buildings', 'the', 'a', 'an'];
      if (potentialCity && !excludeWords.some(word => potentialCity.toLowerCase().includes(word)) && potentialCity.length >= 2) {
        city = potentialCity;
      }
    }
  }
  
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
  
  switch (fieldName) {
    case 'BUILDING_SIZE':
      return `${value.toLocaleString()} sq ft`;
    case 'NUMBER_OF_FLOORS':
      const floorCount = parseInt(value);
      if (floorCount >= 20) {
        return `${buildingName} is an impressive ${value}-story high-rise, offering commanding views and substantial vertical presence in the market.`;
      } else if (floorCount >= 10) {
        return `${buildingName} features ${value} floors, representing a well-proportioned mid-rise structure.`;
      } else {
        return `${buildingName} has ${value} floors, providing a more intimate, low-rise environment.`;
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
  
  // Check for available cities requests
  if (lowerMessage.includes('what cities are available') || lowerMessage.includes('available cities') ||
      lowerMessage.includes('cities available') || lowerMessage.includes('show me cities') ||
      lowerMessage.includes('list of cities') || lowerMessage.includes('which cities')) {
    sqlQuery = 'SELECT DISTINCT CITY, STATE, COUNT(*) as PROPERTY_COUNT FROM PROPERTY WHERE CITY IS NOT NULL GROUP BY CITY, STATE ORDER BY PROPERTY_COUNT DESC, CITY';
    responseText = 'Here are all the cities available in our commercial real estate database:';
    isPropertyList = true;
  }
  // Check for building class availability requests
  else if (lowerMessage.includes('building classes are available') || lowerMessage.includes('what building classes') ||
      lowerMessage.includes('available building class') || lowerMessage.includes('building class available') ||
      lowerMessage.includes('building classes')) {
    sqlQuery = 'SELECT DISTINCT BUILDING_CLASS FROM PROPERTY WHERE BUILDING_CLASS IS NOT NULL ORDER BY BUILDING_CLASS';
    responseText = 'Our portfolio features premium commercial properties across multiple building classifications:';
    isPropertyList = true;
  }
  // Check for generic "show me properties" without city specification
  else if ((lowerMessage.includes('show me properties') || lowerMessage.includes('list of properties') || 
      lowerMessage.includes('give me list of properties') || lowerMessage.includes('properties list') ||
      lowerMessage.includes('show me list of properties') || lowerMessage.includes('show me list of all properties') ||
      lowerMessage.includes('show me all list of properties') || lowerMessage.includes('give me list of all properties') ||
      lowerMessage.includes('list of all properties') || lowerMessage.includes('all properties')) && !filters.city) {
    // Get list of available cities for suggestions
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
            suggestions: cities,
            showCityPopup: true
          });
        }
      }
    });
    return;
  }
  // Check for general property list requests with city
  else if ((lowerMessage.includes('show me properties') || lowerMessage.includes('list of properties') || 
      lowerMessage.includes('give me list of properties') || lowerMessage.includes('properties list') ||
      lowerMessage.includes('show me list of properties') || lowerMessage.includes('show me list of all properties') ||
      lowerMessage.includes('show me all list of properties') || lowerMessage.includes('give me list of all properties') ||
      lowerMessage.includes('list of all properties') || lowerMessage.includes('all properties')) && filters.city) {
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?) ORDER BY BUILDING_NAME';
    params = [`%${filters.city}%`];
    responseText = '';
    isCityPropertyList = true;
  }
  // Priority order: Building Name > Building Class > City > General queries
  else if (filters.buildingName) {
    if (filters.specificField) {
      sqlQuery = `SELECT BUILDING_NAME, ${filters.specificField} FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?) LIMIT 1`;
      params = [`%${filters.buildingName}%`];
      responseText = '';
      isSpecificField = true;
    } else if (filters.isDetailRequest) {
      sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)';
      params = [`%${filters.buildingName}%`];
      responseText = `Here's a comprehensive overview of ${filters.buildingName}, a premier commercial property.`;
    } else {
      sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)';
      params = [`%${filters.buildingName}%`];
      responseText = `Here's a comprehensive overview of ${filters.buildingName}, a premier commercial property.`;
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
    return res.json({ response: 'I can help you search for specific buildings, cities, building classes (A, B, C), properties, leases, and rent information. Try: "Show me Class A properties", "Properties in New York", or "What cities are available?"' });
  }
  
  // Add connection check
  if (!connection) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  console.log('Original message:', message);
  console.log('Lower message:', lowerMessage);
  console.log('Parsed filters:', filters);
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
              res.json({ response: formattedValue, data: [], count: 0 });
            } else {
              res.json({ response: `Here are all available details for ${rows[0].BUILDING_NAME}:`, data: rows, count: rows.length });
            }
          } else if (isPropertyList) {
            const count = rows.length;
            const intro = responseText || `Here are ${count} premium commercial properties in our portfolio.`;
            const list = rows.map((prop, index) => {
              if (prop.BUILDING_CLASS && !prop.BUILDING_NAME) {
                return `${index + 1}. Class ${prop.BUILDING_CLASS}`;
              } else if (prop.CITY && prop.STATE && prop.PROPERTY_COUNT) {
                return `${index + 1}. ${prop.CITY}, ${prop.STATE} (${prop.PROPERTY_COUNT} properties)`;
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
            const intro = `Here are ${count} premium commercial properties in ${filters.city}.`;
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
            `I couldn't find any information about ${filters.buildingName} in our current portfolio.` :
            filters.city ? 
            `I apologize, but we currently don't have any properties available in ${filters.city}.` :
            filters.buildingClass ? 
            `I apologize, but Class ${filters.buildingClass} properties are not currently available in our portfolio.` :
            'I apologize, but I don\'t have any property information available right now.';
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