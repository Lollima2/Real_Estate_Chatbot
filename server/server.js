// Basic Express server with Snowflake connection
require('dotenv').config();
const express = require('express');
const snowflake = require('snowflake-sdk');
const cors = require('cors');

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
  const cityMatch = lowerMessage.match(/(?:in|from|at|for)\s+([a-zA-Z\s]+?)(?:\s+(?:city|properties|buildings)|$|,|\.)/i) || 
                   lowerMessage.match(/([a-zA-Z\s]+?)\s+(?:properties|buildings)/i);
  const city = cityMatch ? cityMatch[1].trim().replace(/\s+/g, ' ') : null;
  
  // Extract building name with flexible patterns
  const buildingMatch = lowerMessage.match(/(?:in|of|about|for)\s+(?:the\s+)?([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex))/i) ||
                       lowerMessage.match(/(?:building|property|tower|center)\s+(?:named|called)?\s*([a-zA-Z0-9\s&.-]+)/i) ||
                       lowerMessage.match(/([a-zA-Z0-9\s&.-]+(?:\s+building|\s+tower|\s+center|\s+plaza|\s+complex))/i);
  const buildingName = buildingMatch ? buildingMatch[1].trim() : null;
  
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
    'property subtype': 'PROPERTY_SUBTYPE',
    'subtype': 'PROPERTY_SUBTYPE',
    'sub type': 'PROPERTY_SUBTYPE',
    'year renovated': 'YEAR_OF_RENOVATION',
    'year of renovation': 'YEAR_OF_RENOVATION',
    'renovated': 'YEAR_OF_RENOVATION',
    'renovation': 'YEAR_OF_RENOVATION',
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
  
  return { buildingClass, city, buildingName, specificField };
};

// Format response based on field type
const formatFieldResponse = (fieldName, value, buildingName) => {
  if (!value || value === null || value === '') return `No ${fieldName.toLowerCase().replace('_', ' ')} information available for ${buildingName}.`;
  
  switch (fieldName) {
    case 'BUILDING_SIZE':
      return `${value.toLocaleString()} sq ft`;
    case 'NUMBER_OF_FLOORS':
      return `${value} floors`;
    case 'YEAR_BUILT':
    case 'YEAR_OF_RENOVATION':
      return value.toString();
    default:
      return value.toString();
  }
};

// Format property list as plain text
const formatPropertyList = (properties) => {
  return properties.map(prop => 
    `${prop.BUILDING_NAME} – ${prop.CITY}, ${prop.STATE || 'N/A'}`
  ).join('\n');
};

// Chatbot endpoint for natural language queries
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();
  const filters = parseUserInput(message);
  
  let sqlQuery = '';
  let responseText = '';
  let params = [];
  let isSpecificField = false;
  let isPropertyList = false;
  
  // Check for property list requests first
  if (lowerMessage.includes('show me properties') || lowerMessage.includes('list of properties') || 
      lowerMessage.includes('give me list of properties') || lowerMessage.includes('properties list')) {
    sqlQuery = 'SELECT BUILDING_NAME, CITY, STATE FROM PROPERTY ORDER BY BUILDING_NAME LIMIT 50';
    responseText = '';
    isPropertyList = true;
  }
  // Priority order: Building Name > Building Class > City > General queries
  else if (filters.buildingName) {
    if (filters.specificField) {
      sqlQuery = `SELECT BUILDING_NAME, ${filters.specificField} FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)`;
      params = [`%${filters.buildingName}%`];
      responseText = '';
      isSpecificField = true;
    } else {
      sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)';
      params = [`%${filters.buildingName}%`];
      responseText = `Building details for: ${filters.buildingName}`;
    }
  } else if (filters.buildingClass) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_CLASS) = ?';
    params = [filters.buildingClass];
    responseText = `Class ${filters.buildingClass} properties:`;
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
  
  console.log('Parsed filters:', filters);
  console.log('Executing SQL:', sqlQuery);
  console.log('Parameters:', params);
  
  connection.execute({
    sqlText: sqlQuery,
    binds: params,
    complete: function(err, stmt, rows) {
      if (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: err.message });
      } else {
        console.log('Query returned', rows ? rows.length : 0, 'rows');
        if (rows && rows.length > 0) {
          if (isSpecificField && rows[0]) {
            const fieldValue = rows[0][filters.specificField];
            const formattedValue = formatFieldResponse(filters.specificField, fieldValue, rows[0].BUILDING_NAME);
            res.json({ response: formattedValue, data: [], count: 0 });
          } else if (isPropertyList) {
            const formattedList = formatPropertyList(rows);
            res.json({ response: formattedList, data: [], count: rows.length });
          } else {
            res.json({ response: responseText, data: rows, count: rows.length });
          }
        } else {
          const noDataMessage = filters.buildingName ? 
            'The PROPERTY table is empty. No data available.' :
            filters.city ? 
            `No properties found in: ${filters.city}` :
            filters.buildingClass ? 
            `No Class ${filters.buildingClass} properties found` :
            'The PROPERTY table is empty. No data available.';
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
