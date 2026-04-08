exports.handler = async (event, context) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tripInput } = JSON.parse(event.body);
    
    // 调用 OpenAI API
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
            content: `You are a road trip planning assistant. Generate a detailed itinerary based on user input.
Return ONLY a valid JSON object in this exact format:
{
  "title": "Trip Name",
  "duration": "X Days",
  "travelers": X,
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

    const data = await response.json();
    const itinerary = JSON.parse(data.choices[0].message.content);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(itinerary)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
