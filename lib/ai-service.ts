// AI Service for Classless - Now using Google Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Question } from "./types";
import {
  imageGenerationService,
  ImageGenerationService,
} from "./image-generation-service";

export interface AIResponse {
  answer: string;
  confidence: number;
  language: string;
  sources?: string[];
  followUpQuestions?: string[];
  needsHumanReview: boolean;
  generatedImage?: {
    data: string;
    mimeType: string;
  };
  isImageGeneration?: boolean;
}

export class AIService {
  private isMockMode = false;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    // Check if we have the required API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[AI Service] API Key found:", apiKey ? "YES" : "NO");
    console.log(
      "[AI Service] API Key value:",
      apiKey ? apiKey.substring(0, 10) + "..." : "NOT FOUND"
    );

    this.isMockMode = !apiKey || apiKey === "your-gemini-api-key-here";
    if (this.isMockMode) {
      console.warn(
        "[AI Service] Running in mock mode - GEMINI_API_KEY not found or invalid"
      );
    } else {
      console.log("[AI Service] Initializing Gemini AI with API key...");
      this.genAI = new GoogleGenerativeAI(apiKey!);
      console.log("[AI Service] Gemini AI initialized successfully!");
    }
  }

  async processQuestion(question: Question): Promise<AIResponse> {
    console.log("[AI Service] Processing question:", question.question_text);
    console.log("[AI Service] Mock mode:", this.isMockMode);

    // Check if this is an image generation request
    if (
      ImageGenerationService.isImageGenerationRequest(question.question_text)
    ) {
      console.log("[AI Service] Detected image generation request");
      return await this.handleImageGenerationRequest(question);
    }

    // If in mock mode, return mock responses
    if (this.isMockMode) {
      console.log("[AI Service] Returning mock response due to mock mode");
      return this.getMockResponse(question);
    }

    try {
      if (!this.genAI) {
        throw new Error("Gemini AI not initialized");
      }

      // Create system prompt based on language
      const systemPrompt = this.createSystemPrompt(question);

      // Generate AI response using Gemini with retry and proper content structure
      const text = await this.generateWithRetry(
        `${systemPrompt}\n\nQuestion:\n${question.question_text}`,
        3,
        500
      );

      // Calculate confidence based on response quality
      const confidence = this.calculateConfidence(question, text);

      // Generate follow-up questions
      const followUpQuestions = await this.generateFollowUpQuestions(
        question,
        text
      );

      return {
        answer: text,
        confidence,
        language:
          (question as any).response_language || question.language || "en",
        sources: ["Google Gemini AI", "Educational Knowledge Base"],
        followUpQuestions,
        needsHumanReview: confidence < 0.7,
      };
    } catch (error) {
      console.error("[AI Service] Error processing question:", error);

      // Fallback to basic response if AI fails
      const responseLanguage =
        (question as any).response_language || question.language || "en";
      const fallbackMessage = this.getFallbackMessage(responseLanguage);

      return {
        answer: fallbackMessage,
        confidence: 0.3,
        language: responseLanguage,
        sources: ["Fallback Response"],
        followUpQuestions: this.getFallbackFollowUpQuestions(responseLanguage),
        needsHumanReview: true,
      };
    }
  }

  private async generateWithRetry(
    prompt: string,
    maxRetries = 3,
    baseDelayMs = 500
  ): Promise<string> {
    if (!this.genAI) throw new Error("Gemini AI not initialized");

    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
    ];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const modelName = modelsToTry[Math.min(attempt, modelsToTry.length - 1)];
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) return text;
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        const isOverloaded =
          status === 503 ||
          (err?.message && String(err.message).includes("overloaded"));
        if (attempt < maxRetries - 1 && isOverloaded) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        // If not retriable or last attempt, rethrow
        throw err;
      }
    }
    throw new Error("Failed to generate content after retries");
  }

  private createSystemPrompt(question: Question): string {
    const basePrompt =
      "You are a helpful educational tutor. Explain concepts clearly with step-by-step solutions, examples, and real-world applications.";

    // Use response_language if available, otherwise fall back to question language
    const responseLanguage =
      (question as any).response_language || question.language || "en";

    const languageInstruction = this.getLanguageInstruction(responseLanguage);

    return (
      basePrompt +
      languageInstruction +
      " Always be encouraging and supportive. If you're not certain about something, say so clearly."
    );
  }

  private getLanguageInstruction(language: string): string {
    const languageMap: { [key: string]: string } = {
      en: " Please respond in English.",
      hi: " Please respond in Hindi (हिंदी).",
      ta: " Please respond in Tamil (தமிழ்).",
      bn: " Please respond in Bengali (বাংলা).",
      te: " Please respond in Telugu (తెలుగు).",
      mr: " Please respond in Marathi (मराठी).",
      gu: " Please respond in Gujarati (ગુજરાતી).",
      kn: " Please respond in Kannada (ಕನ್ನಡ).",
      ml: " Please respond in Malayalam (മലയാളം).",
      pa: " Please respond in Punjabi (ਪੰਜਾਬੀ).",
      ur: " Please respond in Urdu (اردو).",
      or: " Please respond in Odia (ଓଡ଼ିଆ).",
      as: " Please respond in Assamese (অসমীয়া).",
      sa: " Please respond in Sanskrit (संस्कृतम्).",
    };

    return languageMap[language] || languageMap["en"];
  }

  private calculateConfidence(question: Question, aiResponse: string): number {
    let confidence = 0.8; // Base confidence for real AI

    // Adjust based on response length and detail
    const wordCount = aiResponse.split(" ").length;
    if (wordCount < 20) {
      confidence -= 0.2; // Very short responses might be incomplete
    } else if (wordCount > 200) {
      confidence += 0.1; // Detailed responses are usually better
    }

    // Adjust based on question type
    if (question.question_type === "image") {
      confidence -= 0.1; // OCR might introduce errors
    } else if (question.question_type === "voice") {
      confidence -= 0.05; // Speech recognition might introduce errors
    }

    // Check for uncertainty indicators in AI response
    const uncertaintyWords = [
      "not sure",
      "might be",
      "possibly",
      "unclear",
      "uncertain",
    ];
    const hasUncertainty = uncertaintyWords.some((word) =>
      aiResponse.toLowerCase().includes(word)
    );
    if (hasUncertainty) {
      confidence -= 0.2;
    }

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private async generateFollowUpQuestions(
    question: Question,
    aiResponse: string
  ): Promise<string[]> {
    try {
      if (!this.genAI) {
        throw new Error("Gemini AI not initialized");
      }

      // Use response_language if available, otherwise fall back to question language
      const responseLanguage =
        (question as any).response_language || question.language || "en";
      const languageName = this.getLanguageName(responseLanguage);

      const prompt = `Generate 2 helpful follow-up questions based on the student's original question and the answer provided.\nQuestions should help the student learn more or practice the concept.\nRespond in ${languageName}.\nFormat as a simple list, one question per line.\n\nOriginal question: ${question.question_text}\n\nAnswer provided: ${aiResponse}`;
      const text = await this.generateWithRetry(prompt, 2, 400);

      return text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 2);
    } catch (error) {
      console.error(
        "[AI Service] Error generating follow-up questions:",
        error
      );

      // Fallback follow-up questions based on response language
      const responseLanguage =
        (question as any).response_language || question.language || "en";
      const fallbacks = this.getFallbackFollowUpQuestions(responseLanguage);

      return fallbacks;
    }
  }

  private getLanguageName(language: string): string {
    const languageMap: { [key: string]: string } = {
      en: "English",
      hi: "Hindi",
      ta: "Tamil",
      bn: "Bengali",
      te: "Telugu",
      mr: "Marathi",
      gu: "Gujarati",
      kn: "Kannada",
      ml: "Malayalam",
      pa: "Punjabi",
      ur: "Urdu",
      or: "Odia",
      as: "Assamese",
      sa: "Sanskrit",
    };

    return languageMap[language] || "English";
  }

  private getFallbackFollowUpQuestions(language: string): string[] {
    const fallbackMap: { [key: string]: string[] } = {
      en: [
        "Would you like to learn more about this topic?",
        "Do you have any other questions?",
      ],
      hi: [
        "क्या आप इस विषय के बारे में और जानना चाहेंगे?",
        "क्या आपका कोई और सवाल है?",
      ],
      ta: [
        "இந்த தலைப்பைப் பற்றி மேலும் அறிய விரும்புகிறீர்களா?",
        "உங்களுக்கு வேறு கேள்விகள் உள்ளதா?",
      ],
      bn: ["আপনি কি এই বিষয়ে আরও জানতে চান?", "আপনার কি অন্য কোন প্রশ্ন আছে?"],
      te: [
        "మీరు ఈ అంశం గురించి మరింత తెలుసుకోవాలనుకుంటున్నారా?",
        "మీకు మరేమైనా ప్రశ్నలు ఉన్నాయా?",
      ],
      mr: [
        "तुम्हाला या विषयाबद्दल आणखी जाणून घ्यायचे आहे का?",
        "तुमच्याकडे आणखी काही प्रश्न आहेत का?",
      ],
      gu: [
        "શું તમે આ વિષય વિશે વધુ જાણવા માંગો છો?",
        "શું તમારી પાસે બીજા કોઈ પ્રશ્નો છે?",
      ],
      kn: [
        "ಈ ವಿಷಯದ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?",
        "ನಿಮಗೆ ಬೇರೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ?",
      ],
      ml: [
        "ഈ വിഷയത്തെക്കുറിച്ച് കൂടുതൽ അറിയാൻ നിങ്ങൾ ആഗ്രഹിക്കുന്നുണ്ടോ?",
        "നിങ്ങൾക്ക് മറ്റ് ചോദ്യങ്ങൾ ഉണ്ടോ?",
      ],
      pa: [
        "ਕੀ ਤੁਸੀਂ ਇਸ ਵਿਸ਼ੇ ਬਾਰੇ ਹੋਰ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
        "ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਹੋਰ ਕੋਈ ਸਵਾਲ ਹਨ?",
      ],
      ur: [
        "کیا آپ اس موضوع کے بارے میں مزید جاننا چاہتے ہیں؟",
        "کیا آپ کے پاس کوئی اور سوالات ہیں؟",
      ],
      or: [
        "ଆପଣ ଏହି ବିଷୟ ବିଷୟରେ ଅଧିକ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି କି?",
        "ଆପଣଙ୍କ ପାଖରେ ଅନ୍ୟ କୌଣସି ପ୍ରଶ୍ନ ଅଛି କି?",
      ],
      as: [
        "আপুনি এই বিষয়ৰ বিষয়ে অধিক জানিব বিচাৰে নে?",
        "আপোনাৰ আন কোনো প্ৰশ্ন আছে নে?",
      ],
      sa: ["किं त्वं विषयेऽधिकं ज्ञातुमिच्छसि?", "किं तवान्ये प्रश्नाः सन्ति?"],
    };

    return fallbackMap[language] || fallbackMap["en"];
  }

  private getFallbackMessage(language: string): string {
    const fallbackMap: { [key: string]: string } = {
      en: "I'm having trouble processing your question right now. Please try again or contact a human teacher for help.",
      hi: "मुझे अभी आपके प्रश्न को संसाधित करने में समस्या हो रही है। कृपया पुनः प्रयास करें या मदद के लिए किसी मानव शिक्षक से संपर्क करें।",
      ta: "உங்கள் கேள்வியை இப்போது செயலாக்குவதில் எனக்கு சிக்கல் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது உதவிக்கு மனித ஆசிரியரை தொடர்பு கொள்ளவும்.",
      bn: "আমি এখন আপনার প্রশ্ন প্রক্রিয়া করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন বা সাহায্যের জন্য একজন মানব শিক্ষকের সাথে যোগাযোগ করুন।",
      te: "నేను ఇప్పుడు మీ ప్రశ్నను ప్రాసెస్ చేయడంలో సమస్యను ఎదుర్కొంటున్నాను. దయచేసి మళ్లీ ప్రయత్నించండి లేదా సహాయం కోసం మానవ ఉపాధ్యాయునితో సంప్రదించండి.",
      mr: "मला आता तुमचा प्रश्न प्रक्रिया करण्यात समस्या येत आहे. कृपया पुन्हा प्रयत्न करा किंवा मदतीसाठी मानवी शिक्षकाशी संपर्क साधा.",
      gu: "મને હમણાં તમારો પ્રશ્ન પ્રક્રિયા કરવામાં સમસ્યા આવી રહી છે. કૃપા કરીને ફરીથી પ્રયાસ કરો અથવા મદદ માટે માનવ શિક્ષકનો સંપર્ક કરો.",
      kn: "ನನಗೆ ಈಗ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಸಂಸ್ಕರಿಸಲು ತೊಂದರೆ ಆಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಸಹಾಯಕ್ಕಾಗಿ ಮಾನವ ಶಿಕ್ಷಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
      ml: "നിങ്ങളുടെ ചോദ്യം ഇപ്പോൾ പ്രോസസ്സ് ചെയ്യുന്നതിൽ എനിക്ക് പ്രശ്നം ഉണ്ട്. ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ സഹായത്തിനായി മനുഷ്യ ടീച്ചറെ സമീപിക്കുക.",
      pa: "ਮੈਨੂੰ ਹੁਣ ਤੁਹਾਡੇ ਸਵਾਲ ਨੂੰ ਪ੍ਰੋਸੈਸ ਕਰਨ ਵਿੱਚ ਮੁਸ਼ਕਲ ਆ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਮਦਦ ਲਈ ਮਨੁੱਖੀ ਅਧਿਆਪਕ ਨੂੰ ਸੰਪਰਕ ਕਰੋ।",
      ur: "مجھے اب آپ کے سوال کو پروسیس کرنے میں مسئلہ آ رہا ہے۔ براہ کرم دوبارہ کوشش کریں یا مدد کے لیے انسانی استاد سے رابطہ کریں۔",
      or: "ମୁଁ ବର୍ତ୍ତମାନ ତୁମର ପ୍ରଶ୍ନ ପ୍ରକ୍ରିୟା କରିବାରେ ସମସ୍ୟା ଅନୁଭବ କରୁଛି। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା ସହାୟତା ପାଇଁ ମାନବ ଶିକ୍ଷକଙ୍କ ସହ ସମ୍ପର୍କ କରନ୍ତୁ।",
      as: "মই এতিয়া আপোনাৰ প্ৰশ্ন প্ৰক্ৰিয়া কৰাত সমস্যা অনুভৱ কৰিছোঁ। অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক বা সহায়ৰ বাবে মানৱ শিক্ষকৰ সৈতে যোগাযোগ কৰক।",
      sa: "मम अधुना तव प्रश्नं प्रक्रियां कर्तुं समस्या अनुभवति। कृपया पुनः प्रयत्नं कुरुत वा साहाय्याय मानवशिक्षकं संपर्कं कुरुत।",
    };

    return fallbackMap[language] || fallbackMap["en"];
  }

  private getMockResponse(question: Question): AIResponse {
    const questionText = question.question_text.toLowerCase();

    // Use response_language if available, otherwise fall back to question language
    const responseLanguage =
      (question as any).response_language || question.language || "en";

    // Mock responses for common educational topics
    if (
      questionText.includes("photosynthesis") ||
      questionText.includes("phtosynthesis")
    ) {
      return this.getPhotosynthesisResponse(responseLanguage);
    }

    if (
      questionText.includes("quadratic") ||
      questionText.includes("equation")
    ) {
      return this.getQuadraticResponse(responseLanguage);
    }

    // Generic mock response for other questions
    return this.getGenericResponse(question.question_text, responseLanguage);
  }

  private getPhotosynthesisResponse(language: string): AIResponse {
    const responses: {
      [key: string]: { answer: string; followUpQuestions: string[] };
    } = {
      en: {
        answer: `Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy. Here's how it works:

1. **Light Absorption**: Plants capture sunlight using chlorophyll (green pigment)
2. **Carbon Dioxide**: Plants take in CO2 from the air
3. **Water**: Plants absorb water through their roots
4. **Chemical Reaction**: Sunlight + CO2 + H2O → Glucose (sugar) + Oxygen
5. **Oxygen Release**: Plants release oxygen as a byproduct

This process is essential for life on Earth as it:
- Provides food for plants and animals
- Produces oxygen for breathing
- Removes CO2 from the atmosphere

Plants are like nature's solar panels, converting sunlight into food! 🌱☀️`,
        followUpQuestions: [
          "What is chlorophyll and why is it green?",
          "How do plants use the glucose they produce?",
        ],
      },
      ta: {
        answer: `ஒளிச்சேர்க்கை என்பது தாவரங்கள், பாசிகள் மற்றும் சில பாக்டீரியாக்கள் ஒளி ஆற்றலை வேதியியல் ஆற்றலாக மாற்றும் செயல்முறை ஆகும். இது எப்படி வேலை செய்கிறது:

1. **ஒளி உறிஞ்சுதல்**: தாவரங்கள் குளோரோபில் (பச்சை நிறமி) பயன்படுத்தி சூரிய ஒளியைப் பிடிக்கின்றன
2. **கரியமில வாயு**: தாவரங்கள் காற்றிலிருந்து CO2 ஐ எடுத்துக்கொள்கின்றன
3. **தண்ணீர்**: தாவரங்கள் வேர்கள் மூலம் தண்ணீரை உறிஞ்சுகின்றன
4. **வேதியியல் எதிர்வினை**: சூரிய ஒளி + CO2 + H2O → குளுக்கோஸ் (சர்க்கரை) + ஆக்சிஜன்
5. **ஆக்சிஜன் வெளியேற்றம்**: தாவரங்கள் ஆக்சிஜனை துணைப் பொருளாக வெளியேற்றுகின்றன

இந்த செயல்முறை பூமியில் உயிர்க்கு அவசியமானது:
- தாவரங்கள் மற்றும் விலங்குகளுக்கு உணவு வழங்குகிறது
- சுவாசிப்பதற்கு ஆக்சிஜன் உற்பத்தி செய்கிறது
- வளிமண்டலத்திலிருந்து CO2 ஐ நீக்குகிறது

தாவரங்கள் இயற்கையின் சூரிய பேனல்கள் போன்றவை, சூரிய ஒளியை உணவாக மாற்றுகின்றன! 🌱☀️`,
        followUpQuestions: [
          "குளோரோபில் என்றால் என்ன, ஏன் பச்சை நிறமாக உள்ளது?",
          "தாவரங்கள் உற்பத்தி செய்யும் குளுக்கோஸை எப்படி பயன்படுத்துகின்றன?",
        ],
      },
      mr: {
        answer: `प्रकाशसंश्लेषण ही एक प्रक्रिया आहे ज्याद्वारे वनस्पती, शेवाळे आणि काही जीवाणू प्रकाश ऊर्जेचे रासायनिक ऊर्जेत रूपांतर करतात. हे कसे काम करते:

1. **प्रकाश शोषण**: वनस्पती क्लोरोफिल (हिरवा रंगद्रव्य) वापरून सूर्यप्रकाश पकडतात
2. **कार्बन डायऑक्साईड**: वनस्पती हवेतून CO2 घेतात
3. **पाणी**: वनस्पती मुळांद्वारे पाणी शोषतात
4. **रासायनिक प्रतिक्रिया**: सूर्यप्रकाश + CO2 + H2O → ग्लुकोज (साखर) + ऑक्सिजन
5. **ऑक्सिजन सोडणे**: वनस्पती ऑक्सिजनला उपउत्पादन म्हणून सोडतात

ही प्रक्रिया पृथ्वीवरील जीवनासाठी आवश्यक आहे कारण:
- वनस्पती आणि प्राण्यांना अन्न पुरवते
- श्वासोच्छ्वासासाठी ऑक्सिजन तयार करते
- वातावरणातून CO2 काढून टाकते

वनस्पती निसर्गाच्या सोलर पॅनेल्ससारख्या आहेत, सूर्यप्रकाशाचे अन्नात रूपांतर करतात! 🌱☀️`,
        followUpQuestions: [
          "क्लोरोफिल म्हणजे काय आणि ते हिरवे का आहे?",
          "वनस्पती तयार केलेल्या ग्लुकोजचा कसा वापर करतात?",
        ],
      },
    };

    const response = responses[language] || responses["en"];

    return {
      answer: response.answer,
      confidence: 0.9,
      language: language,
      sources: ["Mock AI Response - Educational Knowledge Base"],
      followUpQuestions: response.followUpQuestions,
      needsHumanReview: false,
    };
  }

  private getQuadraticResponse(language: string): AIResponse {
    const responses: {
      [key: string]: { answer: string; followUpQuestions: string[] };
    } = {
      en: {
        answer: `A quadratic equation is a second-degree polynomial equation in the form: ax² + bx + c = 0

**How to solve quadratic equations:**

1. **Factoring Method**: Find two numbers that multiply to 'ac' and add to 'b'
2. **Quadratic Formula**: x = (-b ± √(b² - 4ac)) / 2a
3. **Completing the Square**: Rewrite in the form (x + h)² = k

**Example**: Solve x² + 5x + 6 = 0
- Factoring: (x + 2)(x + 3) = 0
- Solutions: x = -2 or x = -3

**Key Points:**
- Always check if the equation can be factored first
- Use the quadratic formula as a backup method
- The discriminant (b² - 4ac) tells you about the nature of solutions

Would you like me to show you a specific example? 📐`,
        followUpQuestions: [
          "What is the discriminant and how does it help?",
          "Can you show me how to complete the square?",
        ],
      },
      ta: {
        answer: `இருபடி சமன்பாடு என்பது ax² + bx + c = 0 வடிவத்தில் உள்ள இரண்டாம் படி பல்லுறுப்புக்கோவை சமன்பாடு ஆகும்

**இருபடி சமன்பாடுகளை எப்படி தீர்ப்பது:**

1. **காரணிப்படுத்தல் முறை**: 'ac' க்கு பெருக்கி 'b' க்கு கூட்டும் இரண்டு எண்களைக் கண்டறியவும்
2. **இருபடி சூத்திரம்**: x = (-b ± √(b² - 4ac)) / 2a
3. **வர்க்க நிறைவு**: (x + h)² = k வடிவத்தில் மாற்றி எழுதவும்

**எடுத்துக்காட்டு**: x² + 5x + 6 = 0 ஐத் தீர்க்கவும்
- காரணிப்படுத்தல்: (x + 2)(x + 3) = 0
- தீர்வுகள்: x = -2 அல்லது x = -3

**முக்கிய புள்ளிகள்:**
- சமன்பாட்டை முதலில் காரணிப்படுத்த முடியுமா என்பதை எப்போதும் சரிபார்க்கவும்
- காப்பு முறையாக இருபடி சூத்திரத்தைப் பயன்படுத்தவும்
- பாகுபாடு (b² - 4ac) தீர்வுகளின் தன்மையைப் பற்றி கூறுகிறது

ஒரு குறிப்பிட்ட எடுத்துக்காட்டைக் காட்ட விரும்புகிறீர்களா? 📐`,
        followUpQuestions: [
          "பாகுபாடு என்றால் என்ன, அது எப்படி உதவுகிறது?",
          "வர்க்க நிறைவை எப்படி செய்வது என்பதைக் காட்ட முடியுமா?",
        ],
      },
      mr: {
        answer: `द्विघात समीकरण हे ax² + bx + c = 0 या स्वरूपातील द्वितीय पदवीचे बहुपदी समीकरण आहे

**द्विघात समीकरणे कशी सोडवायची:**

1. **गुणक पद्धत**: 'ac' ला गुणून 'b' ला मिळणारे दोन अंक शोधा
2. **द्विघात सूत्र**: x = (-b ± √(b² - 4ac)) / 2a
3. **वर्ग पूर्ण करणे**: (x + h)² = k या स्वरूपात पुन्हा लिहा

**उदाहरण**: x² + 5x + 6 = 0 सोडवा
- गुणक: (x + 2)(x + 3) = 0
- उत्तरे: x = -2 किंवा x = -3

**मुख्य मुद्दे:**
- समीकरण गुणक करता येते का हे नेहमी तपासा
- बॅकअप पद्धती म्हणून द्विघात सूत्र वापरा
- भेदक (b² - 4ac) उत्तरांच्या स्वरूपाबद्दल सांगतो

तुम्हाला एक विशिष्ट उदाहरण दाखवायचे आहे का? 📐`,
        followUpQuestions: [
          "भेदक म्हणजे काय आणि तो कसा मदत करतो?",
          "वर्ग पूर्ण कसे करायचे ते दाखवू शकता का?",
        ],
      },
    };

    const response = responses[language] || responses["en"];

    return {
      answer: response.answer,
      confidence: 0.9,
      language: language,
      sources: ["Mock AI Response - Mathematics Knowledge Base"],
      followUpQuestions: response.followUpQuestions,
      needsHumanReview: false,
    };
  }

  private getGenericResponse(
    questionText: string,
    language: string
  ): AIResponse {
    const responses: {
      [key: string]: { answer: string; followUpQuestions: string[] };
    } = {
      en: {
        answer: `I'm currently running in demo mode while the AI service is being configured. Here's what I can tell you about "${questionText}":

This appears to be an educational question that I would normally answer using advanced AI capabilities. In the full version, I would:
- Provide detailed, accurate explanations
- Include examples and step-by-step solutions
- Suggest follow-up questions for deeper learning
- Adapt my response to your grade level and subject

To get real AI responses, please configure your API keys in the .env.local file.`,
        followUpQuestions: [
          "Would you like to learn more about this topic?",
          "Do you have any other questions?",
        ],
      },
      ta: {
        answer: `நான் தற்போது AI சேவை கட்டமைக்கப்படும்போது டெமோ பயன்முறையில் இயங்குகிறேன். "${questionText}" பற்றி நான் சொல்லக்கூடியது:

இது ஒரு கல்வி கேள்வியாகத் தெரிகிறது, இதை நான் பொதுவாக மேம்பட்ட AI திறன்களைப் பயன்படுத்தி பதிலளிப்பேன். முழு பதிப்பில், நான்:
- விரிவான, துல்லியமான விளக்கங்களை வழங்குவேன்
- எடுத்துக்காட்டுகள் மற்றும் படிப்படியான தீர்வுகளை சேர்ப்பேன்
- ஆழமான கற்றலுக்கு தொடர் கேள்விகளை பரிந்துரைப்பேன்
- உங்கள் தரம் மற்றும் பாடத்திற்கு ஏற்ப என் பதிலை மாற்றியமைப்பேன்

உண்மையான AI பதில்களைப் பெற, .env.local கோப்பில் உங்கள் API விசைகளை கட்டமைக்கவும்.`,
        followUpQuestions: [
          "இந்த தலைப்பைப் பற்றி மேலும் அறிய விரும்புகிறீர்களா?",
          "உங்களுக்கு வேறு கேள்விகள் உள்ளதா?",
        ],
      },
      mr: {
        answer: `मी सध्या AI सेवा कॉन्फिगर केली जात असताना डेमो मोडमध्ये चालत आहे. "${questionText}" बद्दल मी सांगू शकतो:

हे एक शैक्षणिक प्रश्न वाटत आहे ज्याला मी सामान्यतः प्रगत AI क्षमता वापरून उत्तर देतो. पूर्ण आवृत्तीमध्ये, मी:
- तपशीलवार, अचूक स्पष्टीकरणे देईन
- उदाहरणे आणि चरण-दर-चरण उपाय समाविष्ट करीन
- खोल शिकण्यासाठी अनुवर्ती प्रश्न सुचवीन
- तुमच्या ग्रेड पातळी आणि विषयानुसार माझे उत्तर जुळवून घेईन

वास्तविक AI उत्तरे मिळवण्यासाठी, कृपया .env.local फाईलमध्ये तुमचे API की कॉन्फिगर करा.`,
        followUpQuestions: [
          "तुम्हाला या विषयाबद्दल आणखी जाणून घ्यायचे आहे का?",
          "तुमच्याकडे आणखी काही प्रश्न आहेत का?",
        ],
      },
    };

    const response = responses[language] || responses["en"];

    return {
      answer: response.answer,
      confidence: 0.7,
      language: language,
      sources: ["Mock AI Response - Demo Mode"],
      followUpQuestions: response.followUpQuestions,
      needsHumanReview: true,
    };
  }

  // Method to improve AI responses based on teacher feedback
  async improveResponse(
    questionId: number,
    teacherFeedback: string,
    improvedAnswer: string
  ): Promise<void> {
    // In production, this could be used to fine-tune the model or update knowledge base
    console.log(`[AI Learning] Question ${questionId}: ${teacherFeedback}`);
    console.log(`[AI Learning] Improved answer: ${improvedAnswer}`);

    // Store feedback for potential model improvement
    // This could be sent to a training pipeline or knowledge base
  }

  // Method to check if question needs human escalation
  shouldEscalateToHuman(aiResponse: AIResponse, question: Question): boolean {
    return (
      aiResponse.confidence < 0.6 ||
      aiResponse.needsHumanReview ||
      question.question_type === "image" // Complex image questions
    );
  }

  // Handle image generation requests
  private async handleImageGenerationRequest(
    question: Question
  ): Promise<AIResponse> {
    try {
      const imagePrompt = ImageGenerationService.extractImagePrompt(
        question.question_text
      );

      console.log("[AI Service] Extracted image prompt:", imagePrompt);

      const imageResponse = await imageGenerationService.generateImage({
        prompt: imagePrompt,
        style: "realistic", // Default style, could be made configurable
        size: "1024x1024",
      });

      if (imageResponse.success && imageResponse.image) {
        const responseLanguage =
          (question as any).response_language || question.language || "en";

        return {
          answer: `I've generated an image for you: "${imagePrompt}". The image has been created and is displayed below.`,
          confidence: 0.9,
          language: responseLanguage,
          sources: ["Google Gemini AI - Image Generation"],
          followUpQuestions: [
            "Would you like me to generate another image?",
            "Would you like to modify this image in any way?",
          ],
          needsHumanReview: false,
          generatedImage: imageResponse.image,
          isImageGeneration: true,
        };
      } else {
        // Fallback to text response if image generation fails
        const responseLanguage =
          (question as any).response_language || question.language || "en";

        // Check if it's a rate limit error
        const isRateLimit =
          imageResponse.error && imageResponse.error.includes("Rate limit");

        let answer = `I understand you'd like me to generate an image of "${imagePrompt}", but I'm having trouble creating it right now.`;

        if (isRateLimit) {
          answer += `\n\n🚨 **Rate Limit Exceeded**: You've hit the Gemini API rate limits. Here are your options:\n\n`;
          answer += `• **Wait**: Try again in a few hours (limits reset daily)\n`;
          answer += `• **Upgrade**: Consider upgrading your Gemini API plan for higher limits\n`;
          answer += `• **Alternative**: I can describe what the image would look like instead\n\n`;
          answer += `For now, let me describe what a "${imagePrompt}" would look like:`;
        } else {
          answer += ` ${imageResponse.error || "Please try again later."}`;
        }

        return {
          answer: answer,
          confidence: 0.5,
          language: responseLanguage,
          sources: ["AI Service"],
          followUpQuestions: [
            "Would you like me to describe what the image would look like instead?",
            "Would you like to try a different image request?",
            isRateLimit
              ? "How can I upgrade my API plan?"
              : "Would you like to try again later?",
          ],
          needsHumanReview: true,
          isImageGeneration: true,
        };
      }
    } catch (error: any) {
      console.error(
        "[AI Service] Error handling image generation request:",
        error
      );

      const responseLanguage =
        (question as any).response_language || question.language || "en";
      return {
        answer:
          "I encountered an error while trying to generate the image. Please try again or contact support if the issue persists.",
        confidence: 0.3,
        language: responseLanguage,
        sources: ["AI Service - Error"],
        followUpQuestions: [
          "Would you like me to describe what the image would look like instead?",
          "Would you like to try a different request?",
        ],
        needsHumanReview: true,
        isImageGeneration: true,
      };
    }
  }
}

// Singleton instance
export const aiService = new AIService();
