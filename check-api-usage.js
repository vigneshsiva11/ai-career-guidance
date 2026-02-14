// Script to check Gemini API usage and limits
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkAPIUsage() {
  console.log("🔍 Checking Gemini API Usage...\n");

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    console.log("❌ No API key found in environment variables");
    console.log("💡 Make sure you have GEMINI_API_KEY in your .env.local file");
    return;
  }

  console.log("✅ API Key found:", apiKey.substring(0, 10) + "...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try a simple request to test the API
    console.log("🧪 Testing API connection...");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      "Hello, this is a test message."
    );
    const response = await result.response;
    const text = response.text();

    console.log("✅ API is working!");
    console.log("📝 Test response:", text.substring(0, 100) + "...");
  } catch (error) {
    console.log("❌ API Error:", error.message);

    if (error.message.includes("429")) {
      console.log("\n🚨 RATE LIMIT EXCEEDED!");
      console.log("📊 You've hit the Gemini API rate limits");
      console.log("⏰ Wait for quota reset (usually daily)");
      console.log(
        "💡 Or upgrade your plan at: https://makersuite.google.com/app/apikey"
      );
    } else if (error.message.includes("403")) {
      console.log("\n🔒 API KEY ISSUE!");
      console.log("📝 Your API key might be invalid or restricted");
      console.log(
        "💡 Check your API key at: https://makersuite.google.com/app/apikey"
      );
    } else if (error.message.includes("quota")) {
      console.log("\n📊 QUOTA EXCEEDED!");
      console.log("📈 You've used up your daily quota");
      console.log("⏰ Wait for quota reset (usually daily)");
    } else {
      console.log("\n❓ UNKNOWN ERROR!");
      console.log("🔍 Check the error message above for details");
    }
  }
}

// Run the check
if (require.main === module) {
  checkAPIUsage().catch(console.error);
}

module.exports = { checkAPIUsage };
