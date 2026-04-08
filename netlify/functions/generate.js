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
'Authorization': `Bearer ${process.env.
