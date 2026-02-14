// Test script for Image Generation functionality
const testImageRequests = [
  {
    question: "Generate an image of a cat",
    expectedBehavior:
      "Should detect image generation request and create a cat image",
  },
  {
    question: "Can you draw a beautiful sunset over mountains?",
    expectedBehavior: "Should generate a sunset landscape image",
  },
  {
    question: "Create a cartoon-style image of a robot",
    expectedBehavior: "Should generate a cartoon robot image",
  },
  {
    question: "Show me a diagram of the solar system",
    expectedBehavior: "Should generate a solar system diagram",
  },
  {
    question: "What is photosynthesis?",
    expectedBehavior: "Should provide text explanation (not image generation)",
  },
];

async function testImageGeneration() {
  console.log("🎨 Testing Image Generation Functionality...\n");

  for (const test of testImageRequests) {
    console.log(`📝 Testing: "${test.question}"`);
    console.log(`🎯 Expected: ${test.expectedBehavior}`);

    try {
      const response = await fetch("http://localhost:3000/api/ai/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_text: test.question,
          question_type: "text",
          language: "en",
          response_language: "en",
          grade: 8,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Answer: ${result.data.answer.substring(0, 100)}...`);

        if (result.data.isImageGeneration) {
          console.log(`🖼️  Image Generation: YES`);
          if (result.data.generatedImage) {
            console.log(
              `📸 Image Data: ${result.data.generatedImage.data.substring(
                0,
                50
              )}...`
            );
            console.log(`🎨 MIME Type: ${result.data.generatedImage.mimeType}`);
          } else {
            console.log(`❌ No image data returned`);
          }
        } else {
          console.log(`📝 Text Response: YES`);
        }

        if (
          result.data.followUpQuestions &&
          result.data.followUpQuestions.length > 0
        ) {
          console.log(
            `💭 Follow-up questions: ${result.data.followUpQuestions.length}`
          );
        }
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    console.log("─".repeat(80));
  }
}

async function testDirectImageGeneration() {
  console.log("🎨 Testing Direct Image Generation API...\n");

  const testPrompts = [
    "A cute cat sitting on a windowsill",
    "A beautiful sunset over mountains",
    "A cartoon robot with big eyes",
    "A scientific diagram of the solar system",
  ];

  for (const prompt of testPrompts) {
    console.log(`📝 Testing prompt: "${prompt}"`);

    try {
      const response = await fetch(
        "http://localhost:3000/api/ai/generate-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            style: "realistic",
            size: "1024x1024",
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Image generated successfully!`);
        console.log(
          `📸 Image Data: ${result.data.image.data.substring(0, 50)}...`
        );
        console.log(`🎨 MIME Type: ${result.data.image.mimeType}`);
        console.log(`⏰ Timestamp: ${result.data.timestamp}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    console.log("─".repeat(80));
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  console.log("🚀 Starting Image Generation Tests...\n");

  // Test through the main AI service
  testImageGeneration()
    .then(() => {
      console.log("\n" + "=".repeat(80));
      console.log("🎨 Now testing direct image generation API...\n");
      return testDirectImageGeneration();
    })
    .then(() => {
      console.log("\n✅ All tests completed!");
    })
    .catch(console.error);
}

module.exports = {
  testImageGeneration,
  testDirectImageGeneration,
  testImageRequests,
};
