// SMS Service for Classless - Handles SMS interactions
// Mock implementation for hackathon - replace with Twilio/Exotel in production

import { getUserByPhone, createUser, createQuestion } from "./database"
import { aiService } from "./ai-service"
import type { User } from "./types"

export interface SMSMessage {
  from: string // Phone number
  body: string // Message content
  messageId: string
  timestamp: string
}

export interface SMSResponse {
  to: string
  message: string
  success: boolean
}

export class SMSService {
  // Process incoming SMS messages
  async processIncomingSMS(smsMessage: SMSMessage): Promise<SMSResponse> {
    try {
      const phoneNumber = this.normalizePhoneNumber(smsMessage.from)
      const messageBody = smsMessage.body.trim()

      // Check if user exists
      const user = await getUserByPhone(phoneNumber)

      // Handle registration flow
      if (!user) {
        return await this.handleNewUserRegistration(phoneNumber, messageBody)
      }

      // Handle different command types
      if (messageBody.toLowerCase().startsWith("help")) {
        return this.getHelpMessage(phoneNumber)
      }

      if (messageBody.toLowerCase().startsWith("profile")) {
        return this.getUserProfile(user)
      }

      if (messageBody.toLowerCase().startsWith("subjects")) {
        return this.getSubjectsList(phoneNumber)
      }

      // Default: treat as a question
      return await this.handleQuestion(user, messageBody)
    } catch (error) {
      console.error("Error processing SMS:", error)
      return {
        to: smsMessage.from,
        message: "Sorry, there was an error processing your message. Please try again or call our support line.",
        success: false,
      }
    }
  }

  // Handle new user registration via SMS
  private async handleNewUserRegistration(phoneNumber: string, messageBody: string): Promise<SMSResponse> {
    // Simple registration: "REGISTER [Name] [Language]"
    if (messageBody.toLowerCase().startsWith("register")) {
      const parts = messageBody.split(" ")
      if (parts.length >= 2) {
        const name = parts.slice(1, -1).join(" ") || "Student"
        const language = parts[parts.length - 1]?.toLowerCase() || "en"

        // Create new user
        await createUser({
          phone_number: phoneNumber,
          name: name,
          user_type: "student",
          preferred_language: language,
          location: "SMS User",
          education_level: "unknown",
        })

        return {
          to: phoneNumber,
          message: `Welcome to Classless, ${name}! 🎓\n\nYou can now:\n• Ask questions directly\n• Type "HELP" for commands\n• Type "SUBJECTS" to see available topics\n\nExample: "What is 2+2?" or "Explain photosynthesis"`,
          success: true,
        }
      }
    }

    // If not a registration command, guide them to register
    return {
      to: phoneNumber,
      message: `Welcome to Classless! 📚\n\nTo get started, please register:\nREGISTER [Your Name] [Language]\n\nExample:\nREGISTER John Smith EN\nREGISTER राम कुमार HI\n\nSupported languages: EN, HI, PA, BN, TA`,
      success: true,
    }
  }

  // Handle question from registered user
  private async handleQuestion(user: User, questionText: string): Promise<SMSResponse> {
    try {
      // Detect subject from question (simple keyword matching)
      const subjectId = this.detectSubject(questionText)

      // Create question in database
      const question = await createQuestion({
        user_id: user.id,
        subject_id: subjectId,
        question_text: questionText,
        question_type: "text",
        language: user.preferred_language,
        difficulty_level: "medium",
      })

      // Get AI answer
      const aiResponse = await aiService.processQuestion(question)

      // Format response for SMS (keep it concise)
      const formattedAnswer = this.formatAnswerForSMS(aiResponse.answer, user.preferred_language)

      return {
        to: user.phone_number,
        message: formattedAnswer,
        success: true,
      }
    } catch (error) {
      console.error("Error handling question:", error)
      return {
        to: user.phone_number,
        message: "Sorry, I couldn't process your question right now. Please try again later.",
        success: false,
      }
    }
  }

  // Detect subject from question text
  private detectSubject(questionText: string): number {
    const text = questionText.toLowerCase()

    // Math keywords
    if (
      text.includes("calculate") ||
      text.includes("solve") ||
      text.includes("equation") ||
      text.includes("math") ||
      text.includes("algebra") ||
      text.includes("geometry") ||
      /\d+[+\-*/]\d+/.test(text)
    ) {
      return 1 // Mathematics
    }

    // Science keywords
    if (
      text.includes("physics") ||
      text.includes("chemistry") ||
      text.includes("biology") ||
      text.includes("science") ||
      text.includes("experiment") ||
      text.includes("formula")
    ) {
      return 2 // Science
    }

    // Default to English/General
    return 3
  }

  // Format AI answer for SMS (shorter, more concise)
  private formatAnswerForSMS(answer: string, language: string): string {
    // Truncate long answers and add continuation message
    const maxLength = 1500 // SMS character limit consideration

    let formattedAnswer = answer

    // Remove excessive formatting for SMS
    formattedAnswer = formattedAnswer.replace(/\n\n+/g, "\n")

    if (formattedAnswer.length > maxLength) {
      formattedAnswer =
        formattedAnswer.substring(0, maxLength - 100) + "...\n\n📱 For complete answer, visit: classless.app"
    }

    // Add footer based on language
    const footer =
      language === "hi"
        ? "\n\n💡 और सवाल? बस टाइप करें!\n📞 कॉल करें: +91-XXXXX"
        : "\n\n💡 More questions? Just type them!\n📞 Call: +91-XXXXX"

    return formattedAnswer + footer
  }

  // Get help message
  private getHelpMessage(phoneNumber: string): SMSResponse {
    return {
      to: phoneNumber,
      message: `📚 Classless SMS Help\n\nCommands:\n• Just type your question\n• HELP - This message\n• PROFILE - Your info\n• SUBJECTS - Available topics\n\nExamples:\n• "What is gravity?"\n• "Solve 2x + 5 = 15"\n• "Explain photosynthesis"\n\n📞 Call +91-XXXXX for voice support`,
      success: true,
    }
  }

  // Get user profile
  private getUserProfile(user: User): SMSResponse {
    return {
      to: user.phone_number,
      message: `👤 Your Profile\n\nName: ${user.name}\nType: ${user.user_type}\nLanguage: ${user.preferred_language.toUpperCase()}\nLocation: ${user.location || "Not set"}\n\n📱 Visit classless.app for full dashboard`,
      success: true,
    }
  }

  // Get subjects list
  private getSubjectsList(phoneNumber: string): SMSResponse {
    return {
      to: phoneNumber,
      message: `📖 Available Subjects\n\n• Mathematics\n• Science (Physics, Chemistry, Biology)\n• English\n• Hindi\n• Social Studies\n• Computer Science\n• Vocational Skills\n\nJust ask questions on any topic!`,
      success: true,
    }
  }

  // Normalize phone number format
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "")

    // Add +91 if it's a 10-digit Indian number
    if (digits.length === 10) {
      return `+91${digits}`
    }

    // Add + if missing
    if (!phoneNumber.startsWith("+")) {
      return `+${digits}`
    }

    return phoneNumber
  }

  // Send SMS (mock implementation)
  async sendSMS(to: string, message: string): Promise<boolean> {
    // In production, integrate with Twilio/Exotel
    console.log(`[SMS] To: ${to}`)
    console.log(`[SMS] Message: ${message}`)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return true
  }
}

// Singleton instance
export const smsService = new SMSService()
