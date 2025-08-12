// Basic Express server with Snowflake connection
require('dotenv').config();
const express = require('express');
const snowflake = require('snowflake-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001; // You can change the port if needed

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

// Parse user input to extract specific filters
const parseUserInput = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Extract building class (Class A, B, C)
  const classMatch = lowerMessage.match(/class\s+([abc])/i);
  const buildingClass = classMatch ? classMatch[1].toUpperCase() : null;
  
  // Extract city name (look for "in [city]" or "[city] properties")
  const cityMatch = lowerMessage.match(/(?:in|from|at)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i) || 
                   lowerMessage.match(/([a-zA-Z\s]+?)\s+(?:properties|buildings|real estate)/i);
  const city = cityMatch ? cityMatch[1].trim() : null;
  
  // Extract building name (look for specific building references)
  const buildingMatch = lowerMessage.match(/(?:building|property)\s+(?:named|called)?\s*["']?([a-zA-Z0-9\s]+)["']?/i) ||
                       lowerMessage.match(/["']([a-zA-Z0-9\s]+)["']/i);
  const buildingName = buildingMatch ? buildingMatch[1].trim() : null;
  
  return { buildingClass, city, buildingName };
};

// Chatbot endpoint for natural language queries
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();
  const filters = parseUserInput(message);
  
  let sqlQuery = '';
  let responseText = '';
  let params = [];
  
  // Priority order: Building Name > Building Class > City > General queries
  if (filters.buildingName) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(BUILDING_NAME) LIKE UPPER(?)';
    params = [`%${filters.buildingName}%`];
    responseText = `Searching for building: ${filters.buildingName}`;
  } else if (filters.buildingClass) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE BUILDING_CLASS = ?';
    params = [filters.buildingClass];
    responseText = `Here are Class ${filters.buildingClass} properties:`;
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
          console.log('Sample row:', rows[0]);
          res.json({ response: responseText, data: rows, count: rows.length });
        } else {
          res.json({ response: 'The PROPERTY table is empty. No data available.', data: [], count: 0 });
        }
      }
    }
  });
});

app.listen(port, () => {
  console.log(`\n🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Using Snowflake Database: ${process.env.SNOWFLAKE_DATABASE}`);
  console.log(`📋 Schema: ${process.env.SNOWFLAKE_SCHEMA}`);
  console.log(`🏠 Tables: PROPERTIES, LEASE`);
  console.log(`💾 Warehouse: ${process.env.SNOWFLAKE_WAREHOUSE}`);
});
