// Speech recognition declaration for TypeScript browser types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechStateCallback = (isListening: boolean, isSpeaking: boolean) => void;

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private speechRate: number = 0.85; // Slow, calm rate for seniors
  private language: 'he' | 'en' = 'he';
  private onResultCb: SpeechRecognitionCallback | null = null;
  private onErrorCb: ((err: string) => void) | null = null;
  private onStateCb: SpeechStateCallback | null = null;

  constructor() {
    this.initRecognition();
  }

  public setLanguage(lang: 'he' | 'en') {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang === 'he' ? 'he-IL' : 'en-US';
    }
  }

  private initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language === 'he' ? 'he-IL' : 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notifyState();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (this.onResultCb && currentText) {
          this.onResultCb(currentText, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        this.notifyState();
        if (this.onErrorCb) {
          if (event.error === 'not-allowed') {
            this.onErrorCb('אנא אשר גישה למיקרופון כדי לבצע שיחה קולית');
          } else if (event.error === 'no-speech') {
            this.onErrorCb('לא נשמע דיבור. אפשר לנסות לומר זאת שוב.');
          } else {
            this.onErrorCb('לא הצלחנו לקלוט את השמע. נסה שוב.');
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyState();
      };
    }
  }

  public setSpeechRate(rate: number) {
    this.speechRate = rate;
  }

  public isSupported(): boolean {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public startListening(
    onResult: SpeechRecognitionCallback,
    onError?: (err: string) => void,
    onState?: SpeechStateCallback
  ) {
    if (!this.recognition) {
      this.initRecognition();
    }

    // Stop speaking if currently talking
    this.stopSpeaking();

    this.onResultCb = onResult;
    this.onErrorCb = onError || null;
    this.onStateCb = onState || null;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // Recognition might already be running
        console.log('Recognition restart:', e);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    this.isListening = false;
    this.notifyState();
  }

  public speak(text: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      // Stop recognition while speaking to avoid hearing itself
      this.stopListening();

      if (!('speechSynthesis' in window)) {
        console.warn('Browser does not support Speech Synthesis');
        resolve();
        if (onEnd) onEnd();
        return;
      }

      // Cancel ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language === 'he' ? 'he-IL' : 'en-US';
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;

      // Select voice matching language if available
      const voices = window.speechSynthesis.getVoices();
      if (this.language === 'he') {
        const hebrewVoice = voices.find((v) => v.lang.includes('he') || v.lang.includes('HE'));
        if (hebrewVoice) utterance.voice = hebrewVoice;
      } else {
        const englishVoice = voices.find((v) => v.lang.includes('en') || v.lang.includes('EN'));
        if (englishVoice) utterance.voice = englishVoice;
      }

      this.isSpeaking = true;
      this.notifyState();

      utterance.onend = () => {
        this.isSpeaking = false;
        this.notifyState();
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis error:', err);
        this.isSpeaking = false;
        this.notifyState();
        if (onEnd) onEnd();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.notifyState();
  }

  private notifyState() {
    if (this.onStateCb) {
      this.onStateCb(this.isListening, this.isSpeaking);
    }
  }
}

export const speechService = new SpeechService();
