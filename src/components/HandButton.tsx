import React from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2, Hand, Loader2 } from 'lucide-react';
import { VoiceState } from '../types';

interface HandButtonProps {
  voiceState: VoiceState;
  onClick: () => void;
  highContrast?: boolean;
  language?: 'he' | 'en';
}

export const HandButton: React.FC<HandButtonProps> = ({
  voiceState,
  onClick,
  highContrast,
  language = 'he',
}) => {
  const isListening = voiceState === 'LISTENING';
  const isSpeaking = voiceState === 'SPEAKING';
  const isThinking = voiceState === 'THINKING';

  // Dynamic styling based on state and high contrast mode
  let buttonBg = highContrast
    ? 'bg-blue-900 border-4 border-yellow-400 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200/50 border-4 border-red-400';

  if (isListening) {
    buttonBg = highContrast
      ? 'bg-yellow-400 text-black border-4 border-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xl shadow-amber-300/60 border-4 border-amber-300';
  } else if (isSpeaking) {
    buttonBg = highContrast
      ? 'bg-cyan-800 text-white border-4 border-cyan-300'
      : 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xl shadow-sky-300/60 border-4 border-sky-300';
  } else if (isThinking) {
    buttonBg = highContrast
      ? 'bg-purple-900 text-white border-4 border-purple-300'
      : 'bg-indigo-600 text-white shadow-xl shadow-indigo-300/50 border-4 border-indigo-400';
  }

  // Text translations
  const labels = {
    listening: language === 'he' ? 'מקשיב לך...' : 'Listening...',
    speaking: language === 'he' ? 'מקריא...' : 'Speaking...',
    thinking: language === 'he' ? 'חושב...' : 'Thinking...',
    idleTitle: language === 'he' ? 'שלום! לחץ כאן' : 'Hello! Press here',
    speakNow: language === 'he' ? 'דבר עכשיו' : 'Speak now',
    tapToPause: language === 'he' ? 'הקש להפסקה' : 'Tap to stop',
    pleaseWait: language === 'he' ? 'אנא המתן' : 'Please wait',
    toStart: language === 'he' ? 'כדי להתחיל' : 'to start',
  };

  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="relative flex items-center justify-center">
        {/* Subtle slow pulsing ring during listening or speaking */}
        {(isListening || isSpeaking) && (
          <motion.div
            className={`absolute rounded-full pointer-events-none ${
              isListening
                ? 'bg-amber-400/30 border-2 border-amber-500'
                : 'bg-sky-400/30 border-2 border-sky-500'
            }`}
            style={{ width: '280px', height: '280px' }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.button
          id="main-waving-hand-button"
          onClick={onClick}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          className={`relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-full flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-8 focus:ring-red-300 ${buttonBg}`}
          aria-label={
            language === 'he'
              ? 'כפתור שלום - לחץ כאן להתחיל שיחה קולית'
              : 'Hello button - Press here to start voice conversation'
          }
        >
          {/* Main Icon representation */}
          <div className="mb-2">
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Mic className="w-24 h-24 sm:w-28 sm:h-28 text-white stroke-[2.5]" />
              </motion.div>
            ) : isSpeaking ? (
              <motion.div
                animate={{ rotate: [-4, 4, -4] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Volume2 className="w-24 h-24 sm:w-28 sm:h-28 text-white stroke-[2.5]" />
              </motion.div>
            ) : isThinking ? (
              <Loader2 className="w-24 h-24 sm:w-28 sm:h-28 text-white animate-spin stroke-[2.5]" />
            ) : (
              <motion.div
                animate={{ rotate: [0, 15, -10, 15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <Hand className="w-24 h-24 sm:w-28 sm:h-28 text-white stroke-[2.5]" />
              </motion.div>
            )}
          </div>

          {/* Action text inside big button */}
          <span className="text-2xl sm:text-3xl font-extrabold tracking-wide leading-tight px-2">
            {isListening
              ? labels.listening
              : isSpeaking
              ? labels.speaking
              : isThinking
              ? labels.thinking
              : labels.idleTitle}
          </span>

          <span className="text-lg sm:text-xl font-medium opacity-90 mt-1">
            {isListening
              ? labels.speakNow
              : isSpeaking
              ? labels.tapToPause
              : isThinking
              ? labels.pleaseWait
              : labels.toStart}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
