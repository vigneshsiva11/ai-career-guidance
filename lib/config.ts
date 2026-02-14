// Application Configuration
export const config = {
  // Toll-free numbers for different services
  tollFreeNumbers: {
    sms: "04446313405", // Your SMS toll-free number
    voice: "04446313405", // Your voice toll-free number
    support: "04446313405" // Your support number
  },
  
  // IVR Configuration
  ivr: {
    greeting: "All the servers are busy. Please try again later. We apologize for the inconvenience.",
    smsOption: "1",
    voiceOption: "2",
    invalidInput: "Invalid input. Please press 1 for SMS or 2 for Voice learning.",
    goodbye: "Thank you for using AI Tutor. Goodbye!"
  },
  
  // App settings
  app: {
    name: "Classless",
    description: "Inclusive AI Tutor for All",
    version: "1.0.0"
  },
  
  // API endpoints (if you have them)
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    smsWebhook: "/api/sms/webhook",
    ivrWebhook: "/api/ivr/webhook"
  },
  
  // Supported languages
  languages: {
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
    sa: "Sanskrit"
  }
}

// Helper function to get toll-free number
export const getTollFreeNumber = (service: 'sms' | 'voice' | 'support' = 'sms') => {
  return config.tollFreeNumbers[service]
}

// Helper function to get language name
export const getLanguageName = (code: string) => {
  return config.languages[code as keyof typeof config.languages] || code.toUpperCase()
}
