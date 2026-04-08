// netlify/functions/generate.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tripInput } = JSON.parse(event.body);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a road trip planning assistant. Generate a detailed itinerary.
Return ONLY valid JSON in this format:
{
  "title": "Trip Name",
  "duration": "X Days",
  "travelers": 2,
  "days": [
    {
      "date": "Dec 21 Sat",
      "dayNum": "Day 1",
      "from": "City, ST",
      "to": "City, ST",
      "distance": "XXX mi",
      "activity": "Description",
      "gas": 50,
      "hotel": 120,
      "food": 60,
      "other": 0,
      "details": {
        "hotelName": "Hotel Name",
        "hotelAddress": "123 Main St",
        "dining": "Restaurant info",
        "driving": "Drive tips"
      }
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Plan this road trip: ${tripInput}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI response format');
    }

    const content = data.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const itinerary = JSON.parse(jsonStr);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(itinerary)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more info'
      })
    };
  }
};
