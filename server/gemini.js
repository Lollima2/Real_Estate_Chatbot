// Gemini API helper for Node.js
const axios = require('axios');

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
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

module.exports = callGemini;
