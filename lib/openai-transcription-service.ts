import "server-only"
import OpenAI from 'openai'

export interface TranscriptionResult {
  text: string
  confidence: number
  language: string
  duration: number
  words: number
  source: 'openai-whisper'
}

export class OpenAITranscriptionService {
  private openai: OpenAI | null = null

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      })
    }
  }

  async transcribeAudio(audioFile: File, language: string = 'en'): Promise<TranscriptionResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.')
    }

    try {
      console.log('[OpenAI] Starting transcription with Whisper API...')
      console.log('[OpenAI] Audio file:', audioFile.name, audioFile.size, 'bytes')
      console.log('[OpenAI] Language:', language)

      // Convert audio file to buffer
      const arrayBuffer = await audioFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Create a file object for OpenAI
      const file = new File([buffer], audioFile.name, { type: audioFile.type })

      // Map language codes to OpenAI Whisper language codes
      const whisperLanguage = this.mapLanguageToWhisper(language)

      // Transcribe using OpenAI Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: whisperLanguage,
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      })

      console.log('[OpenAI] Transcription successful!')
      console.log('[OpenAI] Transcribed text:', transcription.text)
      console.log('[OpenAI] Language detected:', transcription.language)
      console.log('[OpenAI] Duration:', transcription.duration)

      return {
        text: transcription.text,
        confidence: this.calculateConfidence(transcription),
        language: transcription.language || language,
        duration: transcription.duration || 0,
        words: transcription.text.split(' ').length,
        source: 'openai-whisper'
      }

    } catch (error) {
      console.error('[OpenAI] Transcription error:', error)
      throw new Error(`Failed to transcribe audio: ${error.message}`)
    }
  }

  private mapLanguageToWhisper(language: string): string {
    // Map common language codes to Whisper language codes
    const languageMap: { [key: string]: string } = {
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'hi': 'hi',
      'hi-IN': 'hi',
      'ta': 'ta',
      'ta-IN': 'ta',
      'bn': 'bn',
      'te': 'te',
      'mr': 'mr',
      'gu': 'gu',
      'pa': 'pa',
      'ur': 'ur',
      'kn': 'kn',
      'ml': 'ml',
      'or': 'or',
      'as': 'as',
      'ne': 'ne',
      'si': 'si',
      'my': 'my',
      'km': 'km',
      'lo': 'lo',
      'th': 'th',
      'vi': 'vi',
      'id': 'id',
      'ms': 'ms',
      'tl': 'tl',
      'zh': 'zh',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'pt': 'pt',
      'it': 'it',
      'ru': 'ru',
      'ar': 'ar',
      'he': 'he',
      'fa': 'fa',
      'tr': 'tr',
      'pl': 'pl',
      'nl': 'nl',
      'sv': 'sv',
      'da': 'da',
      'no': 'no',
      'fi': 'fi',
      'hu': 'hu',
      'cs': 'cs',
      'sk': 'sk',
      'ro': 'ro',
      'bg': 'bg',
      'hr': 'hr',
      'sr': 'sr',
      'sl': 'sl',
      'et': 'et',
      'lv': 'lv',
      'lt': 'lt',
      'el': 'el',
      'uk': 'uk',
      'be': 'be',
      'mk': 'mk',
      'sq': 'sq',
      'hy': 'hy',
      'ka': 'ka',
      'az': 'az',
      'kk': 'kk',
      'ky': 'ky',
      'uz': 'uz',
      'tg': 'tg',
      'mn': 'mn',
      'bo': 'bo',
      'dz': 'dz',
      'am': 'am',
      'ti': 'ti',
      'so': 'so',
      'sw': 'sw',
      'zu': 'zu',
      'af': 'af',
      'xh': 'xh',
      'st': 'st',
      'tn': 'tn',
      'ts': 'ts',
      'ss': 'ss',
      've': 've',
      'rw': 'rw',
      'lg': 'lg',
      'ak': 'ak',
      'yo': 'yo',
      'ig': 'ig',
      'ha': 'ha',
      'ff': 'ff',
      'wo': 'wo',
      'sn': 'sn',
      'ny': 'ny',
      'mg': 'mg',
      'rw': 'rw',
      'lg': 'lg',
      'ak': 'ak',
      'yo': 'yo',
      'ig': 'ig',
      'ha': 'ha',
      'ff': 'ff',
      'wo': 'wo',
      'sn': 'sn',
      'ny': 'ny',
      'mg': 'mg'
    }

    return languageMap[language.toLowerCase()] || 'en'
  }

  private calculateConfidence(transcription: any): number {
    // Whisper doesn't provide confidence scores directly
    // We can estimate based on various factors
    let confidence = 0.85 // Base confidence

    // If we have word-level timestamps, we can analyze them
    if (transcription.words && Array.isArray(transcription.words)) {
      const wordCount = transcription.words.length
      const textLength = transcription.text.length
      
      // Higher confidence if we have more words and longer text
      if (wordCount > 5) confidence += 0.05
      if (textLength > 50) confidence += 0.05
      
      // Check for gaps in timestamps (might indicate unclear speech)
      let gaps = 0
      for (let i = 1; i < transcription.words.length; i++) {
        const gap = transcription.words[i].start - transcription.words[i-1].end
        if (gap > 0.5) gaps++ // Gap of more than 0.5 seconds
      }
      
      if (gaps > 0) {
        confidence -= (gaps / wordCount) * 0.1
      }
    }

    // Ensure confidence is between 0.5 and 0.98
    return Math.max(0.5, Math.min(0.98, confidence))
  }

  isAvailable(): boolean {
    return this.openai !== null
  }
}

// Export singleton instance
export const openaiTranscriptionService = new OpenAITranscriptionService()
