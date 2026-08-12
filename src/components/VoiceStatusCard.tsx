import React from 'react';
import { ConversationStep, VoiceState, TripState } from '../types';
import { MessageSquare, RefreshCw, Volume2, Mic, AlertCircle } from 'lucide-react';

interface VoiceStatusCardProps {
  step: ConversationStep;
  voiceState: VoiceState;
  assistantMessage: string;
  userTranscript: string;
  tripState: TripState;
  errorMessage?: string;
  highContrast?: boolean;
  fontSize?: 'normal' | 'large' | 'huge';
  language?: 'he' | 'en';
  onRepeatAudio: () => void;
  onQuickAnswer?: (text: string) => void;
}

export const VoiceStatusCard: React.FC<VoiceStatusCardProps> = ({
  step,
  voiceState,
  assistantMessage,
  userTranscript,
  tripState,
  errorMessage,
  highContrast,
  fontSize = 'large',
  language = 'he',
  onRepeatAudio,
  onQuickAnswer,
}) => {
  const isEn = language === 'en';

  // Determine text size classes
  const titleSizeClass =
    fontSize === 'huge'
      ? 'text-3xl sm:text-4xl'
      : fontSize === 'large'
      ? 'text-2xl sm:text-3xl'
      : 'text-xl sm:text-2xl';

  const bodySizeClass =
    fontSize === 'huge'
      ? 'text-2xl sm:text-3xl'
      : fontSize === 'large'
      ? 'text-xl sm:text-2xl'
      : 'text-lg sm:text-xl';

  const cardBg = highContrast
    ? 'bg-black text-white border-4 border-yellow-400'
    : 'bg-stone-50 border-2 border-stone-200 text-stone-900 shadow-md';

  return (
    <div className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 my-4 transition-all ${cardBg}`}>
      {/* Error alert if mic was blocked or misunderstood */}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-900 flex items-center gap-3 text-lg font-bold">
          <AlertCircle className="w-8 h-8 text-amber-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Assistant spoken question / prompt */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <span className="flex items-center gap-2 font-bold text-red-700 text-lg sm:text-xl">
            <MessageSquare className="w-6 h-6" />
            <span>{isEn ? 'Assistant says:' : 'העוזרת האישית אומרת:'}</span>
          </span>

          <button
            onClick={onRepeatAudio}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-100 hover:bg-red-200 text-red-900 font-bold text-lg cursor-pointer transition-all border border-red-300 active:scale-95"
            aria-label={isEn ? 'Listen again' : 'השמע את התשובה שוב'}
          >
            <Volume2 className="w-6 h-6 text-red-700" />
            <span>{isEn ? 'Listen again 🔊' : 'שמע שוב 🔊'}</span>
          </button>
        </div>

        {/* Main message text */}
        <p className={`font-black leading-snug tracking-tight text-stone-950 ${titleSizeClass}`}>
          "{assistantMessage || (isEn ? 'Hello! Press the waving hand button to start.' : 'שלום! לחץ על כפתור היד כדי להתחיל.')}"
        </p>

        {/* Live user transcript feedback */}
        {(userTranscript || voiceState === 'LISTENING') && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-stone-800">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-base mb-1">
              <Mic className="w-5 h-5 animate-pulse text-amber-600" />
              <span>{isEn ? 'What we heard so far:' : 'מה ששמענו עד כה:'}</span>
            </div>
            <p className={`font-semibold text-stone-900 ${bodySizeClass}`}>
              {userTranscript
                ? `"${userTranscript}"`
                : isEn
                ? 'Listening to your voice... Speak now please'
                : 'שומע את קולך... דבר כעת בבקשה'}
            </p>
          </div>
        )}

        {/* Quick option helper chips if user prefers one-tap options for current question */}
        {onQuickAnswer && step === 'ACCESSIBILITY' && (
          <div className="mt-4 pt-3 border-t border-stone-200">
            <p className="font-bold text-stone-600 text-base mb-3">
              {isEn
                ? 'Tap a quick answer or speak out loud:'
                : 'אפשר ללחוץ על תשובה מהירה או פשוט לומר בקול:'}
            </p>
            <div className="flex flex-wrap gap-3">
              {(isEn
                ? ['No mobility restriction', 'Wheelchair ♿', 'Walker 🚶‍♂️', 'Difficulty with stairs 🦯']
                : ['אין מגבלה', 'כיסא גלגלים ♿', 'הליכון 🚶‍♂️', 'קושי במדרגות 🦯']
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => onQuickAnswer(opt)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-red-50 text-stone-900 font-bold text-lg sm:text-xl border-2 border-stone-300 hover:border-red-500 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {onQuickAnswer && step === 'DESTINATION' && (
          <div className="mt-4 pt-3 border-t border-stone-200">
            <p className="font-bold text-stone-600 text-base mb-3">
              {isEn ? 'Popular quick destinations:' : 'יעדים נפוצים לבחירה מהירה בלחיצה:'}
            </p>
            <div className="flex flex-wrap gap-3">
              {(isEn
                ? ['Ichilov Hospital 🏥', 'Azrieli Center 🏢', 'Central Station 🚌', 'Sheba Medical Center 🏥', 'Western Wall 🏛️']
                : ['בית חולים איכילוב 🏥', 'קניון עזריאלי 🏢', 'תחנה מרכזית 🚌', 'בית חולים שיבא 🏥', 'כותל 🏛️']
              ).map((dest) => (
                <button
                  key={dest}
                  onClick={() => onQuickAnswer(dest)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-sky-50 text-stone-900 font-bold text-lg sm:text-xl border-2 border-stone-300 hover:border-sky-500 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
