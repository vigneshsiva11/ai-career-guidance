// Test script to verify Gemini API key setup
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ GEMINI_API_KEY not set or using placeholder value');
    console.log('Please set your actual Gemini API key in .env.local file');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Hello, this is a test message.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API key is working correctly!');
    console.log('Response:', text);
  } catch (error) {
    console.log('❌ Error testing Gemini API:', error.message);
    if (error.message.includes('API key not valid')) {
      console.log('Please check your GEMINI_API_KEY in .env.local file');
    }
  }
}

testGeminiAPI();
