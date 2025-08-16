module.exports = async (req, res) => {
  try {
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

    // Simple responses without database connection
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('cities')) {
      return res.json({ 
        response: 'I can help you with real estate data, but I\'m currently experiencing database connectivity issues. Please try again later or contact support.' 
      });
    }
    
    if (lowerMessage.includes('rent') || lowerMessage.includes('average')) {
      return res.json({ 
        response: 'I can provide rent information, but I\'m currently experiencing database connectivity issues. Please try again later or contact support.' 
      });
    }
    
    if (lowerMessage.includes('lease')) {
      return res.json({ 
        response: 'I can show lease data, but I\'m currently experiencing database connectivity issues. Please try again later or contact support.' 
      });
    }
    
    if (lowerMessage.includes('properties')) {
      return res.json({ 
        response: 'I can list properties, but I\'m currently experiencing database connectivity issues. Please try again later or contact support.' 
      });
    }
    
    return res.json({ 
      response: 'Hello! I\'m your real estate assistant. I can help with properties, cities, leases, and rent information, but I\'m currently experiencing database connectivity issues. Please try again later.' 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
};



  const conn = initConnection();
  const lowerMessage = message.toLowerCase();
  const filters = parseUserInput(message);
  
  let sqlQuery = '';
  let responseText = '';
  let params = [];
  let isPropertyList = false;
  let isCityPropertyList = false;

  // Comprehensive query logic matching server.js
  // Check for landlord detail requests for specific building
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
  // Check for landlord portfolio requests for specific building
  else if (lowerMessage.includes('landlord') && lowerMessage.includes('portfolio') && filters.buildingName) {
    sqlQuery = `
      SELECT
          p.current_landlord,
          p.building_name,
          p.street_address,
          p.city,
          p.state,
          p.year_built,
          p.building_class,
          avg(l.adjusted_starting_rent) as average_starting_rent
      FROM
          lease l
          JOIN property p ON l.property_id = p.id
      WHERE UPPER(p.building_name) LIKE UPPER(?)
      GROUP BY
          p.current_landlord, p.building_name, p.street_address, p.city, p.state, p.year_built, p.building_class
    `;
    params = [`%${filters.buildingName}%`];
    responseText = `Landlord portfolio details for ${filters.buildingName}:`;
  }
  // Check for general landlord portfolio requests
  else if (lowerMessage.includes('landlord') && (lowerMessage.includes('portfolio') || lowerMessage.includes('average rent') || lowerMessage.includes('rent'))) {
    sqlQuery = `
      SELECT
          p.current_landlord,
          p.street_address,
          avg(l.adjusted_starting_rent) as average_starting_rent
      FROM
          lease l
          JOIN property p ON l.property_id = p.id
      GROUP BY
          p.current_landlord, p.street_address
      ORDER BY average_starting_rent DESC
      LIMIT 15
    `;
    responseText = 'Here are landlord portfolios with average rents:';
  }
  // Check for lease and property join requests
  else if (lowerMessage.includes('lease') && (lowerMessage.includes('properties') || lowerMessage.includes('property')) && 
      (lowerMessage.includes('join') || lowerMessage.includes('combined') || lowerMessage.includes('together'))) {
    sqlQuery = `
      SELECT
          l.id,
          l.street_address,
          l.city,
          l.state,
          p.building_name,
          l.starting_rent,
          l.net_effective_rent,
          l.lease_type,
          l.transaction_type,
          l.lease_term,
          p.year_built,
          p.building_class,
          p.current_landlord    
      FROM
          lease l
          JOIN property p ON l.property_id = p.id
      ORDER BY l.execution_date DESC
      LIMIT 20
    `;
    responseText = 'Here are lease and property details combined:';
  }

  else if (lowerMessage.includes('cities') && (lowerMessage.includes('available') || lowerMessage.includes('what') || 
      lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('which') || 
      lowerMessage.includes('tell') || lowerMessage.includes('find') || lowerMessage.includes('all'))) {
    sqlQuery = 'SELECT DISTINCT CITY, STATE, COUNT(*) as PROPERTY_COUNT FROM PROPERTY WHERE CITY IS NOT NULL GROUP BY CITY, STATE ORDER BY PROPERTY_COUNT DESC, CITY';
    responseText = 'Here are all the cities available in our commercial real estate database:';
    isPropertyList = true;
  }
  else if (lowerMessage.includes('building class') && (lowerMessage.includes('available') || lowerMessage.includes('what') || 
      lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('which') || 
      lowerMessage.includes('tell') || lowerMessage.includes('find') || lowerMessage.includes('all'))) {
    sqlQuery = 'SELECT DISTINCT BUILDING_CLASS FROM PROPERTY WHERE BUILDING_CLASS IS NOT NULL ORDER BY BUILDING_CLASS';
    responseText = 'Our portfolio features premium commercial properties across multiple building classifications:';
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
          console.error('Snowflake connection error (cities query):', err);
          res.status(500).json({ error: `Database connection failed: ${err.message}` });
          resolve();
          return;
        }
        
        conn.execute({
          sqlText: sqlQuery,
          complete: function(err, stmt, rows) {
            if (err) {
              console.error('SQL execution error (cities query):', err);
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
  else if (filters.buildingClass) {
    sqlQuery = 'SELECT BUILDING_NAME FROM PROPERTY WHERE UPPER(BUILDING_CLASS) = ? ORDER BY BUILDING_NAME';
    params = [filters.buildingClass];
    responseText = `Here's our premium collection of Class ${filters.buildingClass} commercial properties:`;
    isPropertyList = true;
  }
  else if (filters.city) {
    sqlQuery = 'SELECT * FROM PROPERTY WHERE UPPER(CITY) LIKE UPPER(?)';
    params = [`%${filters.city}%`];
    responseText = `Properties in ${filters.city}:`;
  }
  else if ((lowerMessage.includes('properties') || lowerMessage.includes('buildings')) && 
      (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('give') || 
       lowerMessage.includes('find') || lowerMessage.includes('tell') || lowerMessage.includes('what') || 
       lowerMessage.includes('all') || lowerMessage.includes('display'))) {
    sqlQuery = 'SELECT * FROM PROPERTY LIMIT 10';
    responseText = 'Here are properties in our database:';
  }
  // Check for lease-specific building name queries first
  else if (lowerMessage.includes('lease') && filters.buildingName) {
    sqlQuery = `
      SELECT
          l.id,
          l.street_address,
          l.city,
          l.state,
          l.zip_code,
          l.starting_rent,
          l.net_effective_rent,
          l.lease_type,
          l.transaction_type,
          l.lease_term,
          l.execution_date,
          l.commencement_date,
          l.expiration_date
      FROM
          lease l
          JOIN property p ON l.property_id = p.id
      WHERE UPPER(p.building_name) LIKE UPPER(?)
      ORDER BY l.execution_date DESC
    `;
    params = [`%${filters.buildingName}%`];
    responseText = `Lease details for ${filters.buildingName}:`;
  }
  // Check for lease information with city filter
  else if (lowerMessage.includes('lease') && filters.city) {
    sqlQuery = `
      SELECT
          l.id,
          l.street_address,
          l.city,
          l.state,
          p.building_name,
          l.starting_rent,
          l.net_effective_rent,
          l.lease_type,
          l.lease_term,
          p.building_class
      FROM
          lease l
          JOIN property p ON l.property_id = p.id
      WHERE UPPER(l.city) LIKE UPPER(?)
      ORDER BY l.execution_date DESC
      LIMIT 15
    `;
    params = [`%${filters.city}%`];
    responseText = `Lease information for properties in ${filters.city}:`;
  }
  else if ((lowerMessage.includes('lease') || lowerMessage.includes('leases')) && !filters.city && 
      (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('give') || 
       lowerMessage.includes('find') || lowerMessage.includes('tell') || lowerMessage.includes('what') || 
       lowerMessage.includes('all') || lowerMessage.includes('display') || lowerMessage.includes('recent'))) {
    sqlQuery = `
      SELECT
          l.street_address,
          l.city,
          l.state,
          p.building_name,
          l.starting_rent,
          l.net_effective_rent,
          l.lease_type,
          l.lease_term,
          p.building_class
      FROM
          lease l
          JOIN property p ON l.property_id = p.id
      ORDER BY l.execution_date DESC
      LIMIT 10
    `;
    responseText = 'Here is recent lease information with property details:';
  }
  else if ((lowerMessage.includes('rent') || lowerMessage.includes('rental') || lowerMessage.includes('price')) && 
      (lowerMessage.includes('average') || lowerMessage.includes('show') || lowerMessage.includes('what') || 
       lowerMessage.includes('tell') || lowerMessage.includes('find') || lowerMessage.includes('get'))) {
    if (filters.city) {
      sqlQuery = 'SELECT AVG(l.starting_rent) as AVG_STARTING_RENT, AVG(l.net_effective_rent) as AVG_NET_RENT FROM lease l JOIN property p ON l.property_id = p.id WHERE UPPER(l.city) LIKE UPPER(?)';
      params = [`%${filters.city}%`];
      responseText = `Average rent information for ${filters.city}:`;
    } else {
      sqlQuery = 'SELECT AVG(starting_rent) as AVG_STARTING_RENT, AVG(net_effective_rent) as AVG_NET_RENT FROM lease WHERE starting_rent IS NOT NULL';
      responseText = 'Here is the average rent information:';
    }
  }
  else {
    return res.json({ response: 'I can help you search for specific buildings, cities, building classes (A, B, C), properties, leases, and rent information. Try: "Show me Class A properties", "Properties in New York", or "What cities are available?"' });
  }

  return new Promise((resolve) => {
    conn.connect((err) => {
      if (err) {
        console.error('Snowflake connection error:', err);
        res.status(500).json({ error: `Database connection failed: ${err.message}` });
        resolve();
        return;
      }
      
      conn.execute({
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
                
                try {
                  const dataContext = JSON.stringify(rows.slice(0, 3));
                  const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this property data: ${dataContext}, provide a brief, professional response (2-3 sentences) that introduces the ${count} properties found. Be conversational and helpful.`;
                  const enhancedIntro = await callGemini(geminiPrompt);
                  const enhancedResponse = enhancedIntro ? `${enhancedIntro}\n\n${list}` : `${responseText}\n\n${list}`;
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
                  const enhancedResponse = enhancedIntro ? `${enhancedIntro}\n\n${list}` : `Here are ${count} premium commercial properties in ${filters.city}.\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                } catch (error) {
                  const intro = `Here are ${count} premium commercial properties in ${filters.city}.`;
                  const enhancedResponse = `${intro}\n\n${list}`;
                  res.json({ response: enhancedResponse, data: [], count: rows.length });
                }
              } else {
                // Format lease data for better display
                if (lowerMessage.includes('lease') || lowerMessage.includes('rent')) {
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
                    const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this lease/rent data: ${dataContext}, provide a brief, professional response (2-3 sentences) that explains what the data shows. Be conversational and helpful.`;
                    const enhancedResponse = await callGemini(geminiPrompt);
                    res.json({ response: enhancedResponse || responseText, data: removeUnderscores(formattedRows), count: formattedRows.length });
                  } catch (error) {
                    res.json({ response: responseText, data: removeUnderscores(formattedRows), count: formattedRows.length });
                  }
                } else {
                  try {
                    const dataContext = JSON.stringify(rows.slice(0, 3));
                    const geminiPrompt = `You are a commercial real estate assistant. Based on this user query: "${message}" and this data: ${dataContext}, provide a brief, professional response (2-3 sentences) that explains what the data shows. Be conversational and helpful.`;
                    const enhancedResponse = await callGemini(geminiPrompt);
                    res.json({ response: enhancedResponse || responseText, data: removeUnderscores(rows), count: rows.length });
                  } catch (error) {
                    res.json({ response: responseText, data: removeUnderscores(rows), count: rows.length });
                  }
                }
              }
            } else {
              try {
                const geminiPrompt = `You are a commercial real estate assistant. The user asked: "${message}" but no data was found. Provide a brief, professional and helpful response (1-2 sentences) explaining that no results were found and suggest alternative searches. Be conversational and supportive.`;
                const enhancedResponse = await callGemini(geminiPrompt);
                res.json({ response: enhancedResponse || 'No data found for your query.', data: [], count: 0 });
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
  } catch (error) {
    console.error('Unexpected error in chat API:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
};