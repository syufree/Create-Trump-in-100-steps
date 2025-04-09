const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testAPI() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log('API密钥有效！响应:', response.choices[0].message.content);
  } catch (error) {
    console.error('API密钥验证失败:', error.message);
  }
}

testAPI(); 