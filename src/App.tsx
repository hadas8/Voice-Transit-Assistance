import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ConversationStep,
  VoiceState,
  TripState,
  TransitOption,
  AccessibilitySettings,
} from './types';
import { speechService } from './services/speechService';
import { transportationService } from './services/transportationService';
import { HandButton } from './components/HandButton';
import { VoiceStatusCard } from './components/VoiceStatusCard';
import { TripResultCard } from './components/TripResultCard';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { getAssistantResponse } from './services/assistantFallback';

export default function App() {
  // State management
  const [step, setStep] = useState<ConversationStep>('IDLE');
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [assistantMessage, setAssistantMessage] = useState<string>(
    'שלום! לחץ על כפתור השלום הגדול כדי להתחיל'
  );
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [tripState, setTripState] = useState<TripState>({
    accessibilityNote: '',
    destination: '',
    userLocationName: 'מיקומך הנוכחי',
  });

  const [transitResult, setTransitResult] = useState<TransitOption | null>(null);

  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'large',
    highContrast: false,
    speechRate: 0.85,
    language: 'he',
  });

  // Keep ref of current step, tripState, and language for voice callback closures
  const stepRef = useRef(step);
  stepRef.current = step;

  const tripStateRef = useRef(tripState);
  tripStateRef.current = tripState;

  const languageRef = useRef(settings.language);
  languageRef.current = settings.language;

  // Initialize speech service settings & sync language
  useEffect(() => {
    speechService.setSpeechRate(settings.speechRate);
    speechService.setLanguage(settings.language);

    // If step is IDLE, update default initial message to match selected language
    if (step === 'IDLE') {
      setAssistantMessage(
        settings.language === 'en'
          ? 'Hello! Press the big waving hand button to start.'
          : 'שלום! לחץ על כפתור השלום הגדול כדי להתחיל'
      );
    }
  }, [settings.speechRate, settings.language, step]);

  // Main Handler when the Big Hand Button is Pressed
  const handleHandButtonClick = async () => {
    setErrorMessage('');

    // If assistant is currently speaking, stop speech
    if (voiceState === 'SPEAKING') {
      speechService.stopSpeaking();
      setVoiceState('IDLE');
      return;
    }

    // If listening, stop listening
    if (voiceState === 'LISTENING') {
      speechService.stopListening();
      setVoiceState('IDLE');
      return;
    }

    // Otherwise, begin or advance conversation turn
    if (step === 'IDLE' || step === 'COMPLETED') {
      startConversation();
    } else {
      // Resume listening for current step
      listenForUserAnswer(step);
    }
  };

  // Step 1: Start Conversation -> Assistant greets the user
  const startConversation = () => {
    const isEn = settings.language === 'en';
    const greetingText = isEn ? 'Hello, how are you doing today?' : 'שלום, מה שלומך היום?';
    setStep('GREETING');
    setAssistantMessage(greetingText);
    setUserTranscript('');
    setTransitResult(null);
    setTripState({
      accessibilityNote: '',
      destination: '',
      userLocationName: isEn ? 'Current location' : 'מיקומך הנוכחי',
    });

    speakAndThenListen(greetingText, 'GREETING');
  };

  // Helper: Speaks assistant text aloud, then automatically listens for user answer
  const speakAndThenListen = async (textToSpeak: string, currentStep: ConversationStep) => {
    setVoiceState('SPEAKING');
    await speechService.speak(textToSpeak, () => {
      // After speaking finishes, automatically start microphone listening
      listenForUserAnswer(currentStep);
    });
  };

  // Start Speech Recognition for the current step
  const listenForUserAnswer = (currentStep: ConversationStep) => {
    const isEn = settings.language === 'en';
    if (!speechService.isSupported()) {
      setErrorMessage(
        isEn
          ? 'Voice recognition is not supported in this browser. You can tap quick options below.'
          : 'דפדפן זה אינו תומך בזיהוי קולי. אפשר ללחוץ על התשובות המהירות.'
      );
      setVoiceState('IDLE');
      return;
    }

    setVoiceState('LISTENING');
    setUserTranscript('');

    speechService.startListening(
      (transcript, isFinal) => {
        setUserTranscript(transcript);
        if (isFinal && transcript.trim().length > 0) {
          processUserSpeech(transcript, currentStep);
        }
      },
      (err) => {
        setErrorMessage(err);
        setVoiceState('ERROR');
      },
      (isListening, isSpeaking) => {
        if (!isListening && !isSpeaking && voiceState === 'LISTENING') {
          // If listening ended naturally without text
          if (!userTranscript) {
            setVoiceState('IDLE');
          }
        }
      }
    );
  };

  // Process User Speech through Gemini server API or Fallback
  const processUserSpeech = async (speech: string, currentStep: ConversationStep) => {
    speechService.stopListening();
    setVoiceState('THINKING');

    try {
      // Runs in the browser rather than calling the server, so the app can be
      // served as a static site. Same logic the server used when no Gemini key
      // was configured.
      const data = getAssistantResponse(
        currentStep,
        speech,
        tripStateRef.current,
        settings.language
      );

      const nextAssistantMsg = data.assistantMessage;
      // Was implicitly `any` when this came back from response.json(); the
      // values are the same ConversationStep strings the server returned.
      const nextStep = (data.nextStep || data.step) as ConversationStep;

      // Update accumulated trip state
      if (data.extractedAccessibility) {
        setTripState((prev) => ({ ...prev, accessibilityNote: data.extractedAccessibility }));
      }
      if (data.extractedDestination) {
        setTripState((prev) => ({ ...prev, destination: data.extractedDestination }));
      }

      setAssistantMessage(nextAssistantMsg);

      // Handle Step Transitions
      if (nextStep === 'RESULT' || (data.extractedDestination && currentStep === 'DESTINATION')) {
        const dest = data.extractedDestination || tripStateRef.current.destination || speech;
        const accNote = data.extractedAccessibility || tripStateRef.current.accessibilityNote;
        calculateAndPresentTrip(dest, accNote);
      } else {
        setStep(nextStep);
        speakAndThenListen(nextAssistantMsg, nextStep);
      }
    } catch (err) {
      console.error('Error processing speech:', err);
      // Fallback transition
      handleFallbackStep(speech, currentStep);
    }
  };

  // Fallback step transition if server API is offline
  const handleFallbackStep = (speech: string, currentStep: ConversationStep) => {
    const isEn = settings.language === 'en';
    if (currentStep === 'GREETING') {
      const msg = isEn
        ? 'Nice to meet you! Are there physical accessibility needs the driver should know about?'
        : 'נעים מאוד! יש מגבלה פיזית שהנהג צריך לדעת עליה?';
      setStep('ACCESSIBILITY');
      setAssistantMessage(msg);
      speakAndThenListen(msg, 'ACCESSIBILITY');
    } else if (currentStep === 'ACCESSIBILITY') {
      const accNote = isEn
        ? speech.toLowerCase().includes('no')
          ? 'None'
          : speech
        : speech.includes('לא')
        ? 'ללא מגבלה'
        : speech;
      setTripState((prev) => ({ ...prev, accessibilityNote: accNote }));
      const msg = isEn
        ? `Recorded: ${accNote}. Where do you need to go?`
        : `נרשם: ${accNote}. לאן אתה צריך להגיע?`;
      setStep('DESTINATION');
      setAssistantMessage(msg);
      speakAndThenListen(msg, 'DESTINATION');
    } else if (currentStep === 'DESTINATION') {
      setTripState((prev) => ({ ...prev, destination: speech }));
      calculateAndPresentTrip(speech, tripStateRef.current.accessibilityNote);
    }
  };

  // Fetch Public Transit Options & Speak Spoken Answer
  const calculateAndPresentTrip = async (destination: string, accessibilityNote: string) => {
    const isEn = settings.language === 'en';
    setStep('CALCULATING');
    setVoiceState('THINKING');
    const calculatingText = isEn
      ? `Finding the best public transit to ${destination}...`
      : `מחפש עבורך את התחבורה הציבורית הטובה ביותר אל ${destination}...`;
    setAssistantMessage(calculatingText);

    try {
      const result = await transportationService.findNextOption(
        destination,
        accessibilityNote,
        settings.language
      );
      setTransitResult(result);
      setStep('RESULT');

      const spokenSummary =
        isEn && result.spokenSummaryEnglish
          ? result.spokenSummaryEnglish
          : result.spokenSummaryHebrew;

      setAssistantMessage(spokenSummary);

      // Speak the complete spoken transportation answer aloud
      setVoiceState('SPEAKING');
      await speechService.speak(spokenSummary, () => {
        setVoiceState('IDLE');
      });
    } catch (err) {
      console.error('Error calculating trip:', err);
      const errorText = isEn
        ? 'Failed to search route. Please try saying your destination again.'
        : 'התרחשה תקלה בחיפוש הקו. אפשר לנסות לומר את היעד שוב.';
      setAssistantMessage(errorText);
      setStep('DESTINATION');
      setVoiceState('IDLE');
    }
  };

  // Handle Quick Answer Chips
  const handleQuickAnswer = (selectedText: string) => {
    setUserTranscript(selectedText);
    processUserSpeech(selectedText, step);
  };

  // Repeat current audio answer aloud
  const handleRepeatAudio = () => {
    const isEn = settings.language === 'en';
    const textToRepeat =
      (isEn && transitResult?.spokenSummaryEnglish) ||
      transitResult?.spokenSummaryHebrew ||
      assistantMessage ||
      (isEn ? 'Hello! Press the waving hand button to start.' : 'שלום! לחץ על כפתור השלום כדי להתחיל.');
    setVoiceState('SPEAKING');
    speechService.speak(textToRepeat, () => {
      setVoiceState('IDLE');
    });
  };

  // Reset entire trip conversation
  const handleReset = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    const isEn = settings.language === 'en';
    setStep('IDLE');
    setVoiceState('IDLE');
    setAssistantMessage(
      isEn
        ? 'Hello! Press the big waving hand button to start.'
        : 'שלום! לחץ על כפתור השלום הגדול כדי להתחיל'
    );
    setUserTranscript('');
    setErrorMessage('');
    setTransitResult(null);
    setTripState({
      accessibilityNote: '',
      destination: '',
      userLocationName: isEn ? 'Current location' : 'מיקומך הנוכחי',
    });
  };

  const isEn = settings.language === 'en';

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 select-none ${
        settings.highContrast ? 'bg-black text-white' : 'bg-white text-stone-900'
      }`}
    >
      {/* Top Minimal Accessibility Toolbar */}
      <AccessibilityToolbar
        settings={settings}
        onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
        onReset={handleReset}
      />

      {/* Main Single-Screen Accessibility View */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-between">
        {/* Top Instructional Banner for Seniors */}
        <div className="text-center my-2 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-800 tracking-tight">
            {step === 'IDLE'
              ? isEn
                ? 'Press the hand and speak with us'
                : 'לחץ על היד ונדבר ביחד'
              : step === 'RESULT'
              ? isEn
                ? 'Here are your trip details'
                : 'הנה פרטי הנסיעה שלך'
              : isEn
              ? 'Answer the question aloud'
              : 'ענה בקול לשאלה'}
          </h2>
          <p className="text-lg sm:text-xl font-bold text-stone-600 mt-1">
            {isEn ? 'No typing or navigating menus required' : 'אין צורך להקליד או לנווט בתפריטים'}
          </p>
        </div>

        {/* Centerpiece: ONE Giant Waving Hand Button 👋 */}
        <HandButton
          voiceState={voiceState}
          onClick={handleHandButtonClick}
          highContrast={settings.highContrast}
          language={settings.language}
        />

        {/* Dynamic Context View: Active Voice Question OR Transit Result Card */}
        <AnimatePresence mode="wait">
          {step === 'RESULT' && transitResult ? (
            <motion.div
              key="result-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex justify-center"
            >
              <TripResultCard
                transit={transitResult}
                tripState={tripState}
                highContrast={settings.highContrast}
                fontSize={settings.fontSize}
                language={settings.language}
                onRepeatAudio={handleRepeatAudio}
                onResetTrip={handleReset}
              />
            </motion.div>
          ) : (
            <motion.div
              key="voice-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex justify-center"
            >
              <VoiceStatusCard
                step={step}
                voiceState={voiceState}
                assistantMessage={assistantMessage}
                userTranscript={userTranscript}
                tripState={tripState}
                errorMessage={errorMessage}
                highContrast={settings.highContrast}
                fontSize={settings.fontSize}
                language={settings.language}
                onRepeatAudio={handleRepeatAudio}
                onQuickAnswer={
                  step === 'ACCESSIBILITY' || step === 'DESTINATION'
                    ? handleQuickAnswer
                    : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Simple Reset Footer */}
        <footer className="w-full text-center py-4 border-t border-stone-200 mt-6">
          <p className="text-base font-bold text-stone-500">
            {isEn
              ? 'Accessible Voice Transit Assistant for Seniors • Press the hand 👋 and speak'
              : 'סייען תחבורה קולי נגיש לקשישים • פשוט לחץ על היד 👋 ודבר'}
          </p>
        </footer>
      </main>
    </div>
  );
}
