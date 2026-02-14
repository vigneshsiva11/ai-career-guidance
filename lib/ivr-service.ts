// IVR (Interactive Voice Response) Service for Classless
// Mock implementation for hackathon - replace with Twilio/Exotel in production

import { getUserByPhone, createUser, createQuestion } from "./database"
import { aiService } from "./ai-service"
import { openaiTranscriptionService } from "./openai-transcription-service"
import type { User } from "./types"

export interface IVRCall {
  from: string // Phone number
  callId: string
  sessionId: string
  timestamp: string
}

export interface IVRResponse {
  action: "say" | "gather" | "record" | "hangup" | "redirect"
  text?: string
  language?: string
  nextUrl?: string
  timeout?: number
  finishOnKey?: string
}

export interface VoiceInput {
  transcription: string
  confidence: number
  language: string
}

export class IVRService {
  // Handle incoming call
  async handleIncomingCall(call: IVRCall): Promise<IVRResponse> {
    const phoneNumber = this.normalizePhoneNumber(call.from)
    const user = await getUserByPhone(phoneNumber)

    if (!user) {
      return this.getWelcomeMessageForNewUser(phoneNumber)
    }

    return this.getWelcomeMessageForExistingUser(user)
  }

  // Welcome message for new users
  private getWelcomeMessageForNewUser(phoneNumber: string): IVRResponse {
    return {
      action: "say",
      text: `Welcome to Classless, your AI tutor! I notice this is your first call. 
             To register, please say your name followed by your preferred language. 
             For example, say "My name is John Smith, English" or "मेरा नाम राम है, हिंदी"`,
      language: "en",
      nextUrl: `/api/ivr/register?phone=${encodeURIComponent(phoneNumber)}`,
    }
  }

  // Welcome message for existing users
  private getWelcomeMessageForExistingUser(user: User): IVRResponse {
    const greeting =
      user.preferred_language === "hi"
        ? `नमस्ते ${user.name}! मैं आपका AI शिक्षक हूं। आप मुझसे कोई भी सवाल पूछ सकते हैं।`
        : `Hello ${user.name}! I'm your AI tutor. You can ask me any question.`

    return {
      action: "say",
      text: greeting,
      language: user.preferred_language,
      nextUrl: `/api/ivr/question?user_id=${user.id}`,
    }
  }

  // Handle user registration via voice
  async handleRegistration(phoneNumber: string, voiceInput: VoiceInput): Promise<IVRResponse> {
    try {
      // Parse name and language from transcription
      const { name, language } = this.parseRegistrationInput(voiceInput.transcription)

      if (!name) {
        return {
          action: "say",
          text: "I couldn't understand your name. Please say your name clearly followed by your language preference.",
          nextUrl: `/api/ivr/register?phone=${encodeURIComponent(phoneNumber)}`,
        }
      }

      // Create user
      await createUser({
        phone_number: phoneNumber,
        name: name,
        user_type: "student",
        preferred_language: language,
        location: "IVR User",
        education_level: "unknown",
      })

      const welcomeMessage =
        language === "hi"
          ? `धन्यवाद ${name}! आपका पंजीकरण हो गया है। अब आप मुझसे कोई भी सवाल पूछ सकते हैं।`
          : `Thank you ${name}! You are now registered. You can ask me any question.`

      return {
        action: "say",
        text: welcomeMessage,
        language: language,
        nextUrl: `/api/ivr/question?phone=${encodeURIComponent(phoneNumber)}`,
      }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        action: "say",
        text: "Sorry, there was an error with registration. Please try again or use our SMS service.",
        nextUrl: `/api/ivr/register?phone=${encodeURIComponent(phoneNumber)}`,
      }
    }
  }

  // Handle question via voice
  async handleQuestion(user: User, voiceInput: VoiceInput): Promise<IVRResponse> {
    try {
      if (voiceInput.confidence < 0.6) {
        const retryMessage =
          user.preferred_language === "hi"
            ? "मुझे आपका सवाल समझ नहीं आया। कृपया स्पष्ट रूप से दोहराएं।"
            : "I couldn't understand your question clearly. Please repeat it clearly."

        return {
          action: "say",
          text: retryMessage,
          language: user.preferred_language,
          nextUrl: `/api/ivr/question?user_id=${user.id}`,
        }
      }

      // Detect subject and create question
      const subjectId = this.detectSubject(voiceInput.transcription)
      const question = await createQuestion({
        user_id: user.id,
        subject_id: subjectId,
        question_text: voiceInput.transcription,
        question_type: "voice",
        language: user.preferred_language,
        difficulty_level: "medium",
      })

      // Get AI answer
      const aiResponse = await aiService.processQuestion(question)

      // Format answer for voice
      const voiceAnswer = this.formatAnswerForVoice(aiResponse.answer, user.preferred_language)

      return {
        action: "say",
        text: voiceAnswer,
        language: user.preferred_language,
        nextUrl: `/api/ivr/continue?user_id=${user.id}`,
      }
    } catch (error) {
      console.error("Question handling error:", error)
      const errorMessage =
        user.preferred_language === "hi"
          ? "क्षमा करें, आपके सवाल का जवाब देने में समस्या हुई। कृपया बाद में कोशिश करें।"
          : "Sorry, there was an error processing your question. Please try again later."

      return {
        action: "say",
        text: errorMessage,
        language: user.preferred_language,
      }
    }
  }

  // Handle continuation (ask another question or end call)
  async handleContinuation(user: User, voiceInput: VoiceInput): Promise<IVRResponse> {
    const input = voiceInput.transcription.toLowerCase()

    // Check if user wants to ask another question
    if (
      input.includes("yes") ||
      input.includes("another") ||
      input.includes("more") ||
      input.includes("हां") ||
      input.includes("और")
    ) {
      const continueMessage =
        user.preferred_language === "hi" ? "बहुत अच्छा! आपका अगला सवाल क्या है?" : "Great! What's your next question?"

      return {
        action: "say",
        text: continueMessage,
        language: user.preferred_language,
        nextUrl: `/api/ivr/question?user_id=${user.id}`,
      }
    }

    // End call
    const goodbyeMessage =
      user.preferred_language === "hi"
        ? "धन्यवाद! Classless का उपयोग करने के लिए आपका शुक्रिया। फिर मिलेंगे!"
        : "Thank you for using Classless! Have a great day and keep learning!"

    return {
      action: "say",
      text: goodbyeMessage,
      language: user.preferred_language,
    }
  }

  // Parse registration input to extract name and language
  private parseRegistrationInput(transcription: string): { name: string; language: string } {
    const text = transcription.toLowerCase()

    // Extract language
    let language = "en"
    if (text.includes("hindi") || text.includes("हिंदी")) language = "hi"
    else if (text.includes("punjabi") || text.includes("पंजाबी")) language = "pa"
    else if (text.includes("bengali") || text.includes("বাংলা")) language = "bn"
    else if (text.includes("tamil") || text.includes("தமிழ்")) language = "ta"

    // Extract name (simple pattern matching)
    let name = ""
    const namePatterns = [
      /my name is ([a-zA-Z\s]+)/i,
      /i am ([a-zA-Z\s]+)/i,
      /मेरा नाम ([a-zA-Z\s]+) है/i,
      /([a-zA-Z\s]+) है मेरा नाम/i,
    ]

    for (const pattern of namePatterns) {
      const match = transcription.match(pattern)
      if (match && match[1]) {
        name = match[1].trim()
        break
      }
    }

    // Fallback: take first few words as name
    if (!name) {
      const words = transcription.split(" ").filter((w) => w.length > 2)
      name = words.slice(0, 2).join(" ")
    }

    return { name, language }
  }

  // Detect subject from voice input
  private detectSubject(transcription: string): number {
    const text = transcription.toLowerCase()

    // Math keywords
    if (
      text.includes("calculate") ||
      text.includes("solve") ||
      text.includes("math") ||
      text.includes("algebra") ||
      text.includes("गणित") ||
      text.includes("हिसाब")
    ) {
      return 1
    }

    // Science keywords
    if (
      text.includes("science") ||
      text.includes("physics") ||
      text.includes("chemistry") ||
      text.includes("biology") ||
      text.includes("विज्ञान")
    ) {
      return 2
    }

    return 3 // Default to English/General
  }

  // Format answer for voice (shorter, more conversational)
  private formatAnswerForVoice(answer: string, language: string): string {
    // Make it more conversational for voice
    let voiceAnswer = answer

    // Remove formatting that doesn't work well in voice
    voiceAnswer = voiceAnswer.replace(/\n+/g, ". ")
    voiceAnswer = voiceAnswer.replace(/•/g, "")
    voiceAnswer = voiceAnswer.replace(/Step \d+:/g, "First, ")

    // Limit length for voice (people can't listen to very long answers)
    if (voiceAnswer.length > 800) {
      voiceAnswer = voiceAnswer.substring(0, 800) + "..."
    }

    // Add continuation prompt
    const continuePrompt =
      language === "hi" ? " क्या आपका कोई और सवाल है? हां या ना कहें।" : " Do you have another question? Say yes or no."

    return voiceAnswer + continuePrompt
  }

  // Normalize phone number
  private normalizePhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, "")
    if (digits.length === 10) {
      return `+91${digits}`
    }
    return phoneNumber.startsWith("+") ? phoneNumber : `+${digits}`
  }

  // Convert text to speech (mock implementation)
  async textToSpeech(text: string, language: string): Promise<string> {
    // In production, integrate with Google Text-to-Speech or similar
    console.log(`[TTS] Language: ${language}`)
    console.log(`[TTS] Text: ${text}`)

    // Return mock audio URL
    return `/api/tts/audio?text=${encodeURIComponent(text)}&lang=${language}`
  }

  // Convert speech to text using OpenAI Whisper
  async speechToText(audioUrl: string, language: string): Promise<VoiceInput> {
    try {
      console.log(`[STT] Processing audio: ${audioUrl}, Language: ${language}`)
      
      // Download audio file from URL
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`)
      }
      
      const audioBlob = await response.blob()
      const audioFile = new File([audioBlob], 'voice-input.wav', { type: audioBlob.type })
      
      // Use OpenAI Whisper for transcription
      if (openaiTranscriptionService.isAvailable()) {
        const result = await openaiTranscriptionService.transcribeAudio(audioFile, language)
        
        console.log(`[STT] OpenAI transcription successful: ${result.text}`)
        
        return {
          transcription: result.text,
          confidence: result.confidence,
          language: result.language,
        }
      } else {
        // Fallback to mock transcription if OpenAI is not available
        console.log(`[STT] OpenAI not available, using mock transcription`)
        return {
          transcription: "What is photosynthesis?", // Mock transcription
          confidence: 0.85,
          language: language,
        }
      }
    } catch (error) {
      console.error(`[STT] Transcription error:`, error)
      
      // Return mock transcription on error
      return {
        transcription: "What is photosynthesis?", // Mock transcription
        confidence: 0.85,
        language: language,
      }
    }
  }
}

// Singleton instance
export const ivrService = new IVRService()
