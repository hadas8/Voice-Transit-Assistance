import React from 'react';
import { Eye, Type, RefreshCw, Globe } from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface AccessibilityToolbarProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onReset: () => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  settings,
  onUpdateSettings,
  onReset,
}) => {
  const isEn = settings.language === 'en';

  return (
    <header className="w-full bg-stone-100 border-b-2 border-stone-200 py-3 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3">
      {/* Title logo/app descriptor */}
      <div className="flex items-center gap-3">
        <span className="text-2xl sm:text-3xl">👋</span>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          {isEn ? 'Voice Transit Assistant' : 'סייען תחבורה קולי'}
        </h1>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Language Toggle Button */}
        <button
          id="language-toggle-button"
          onClick={() => onUpdateSettings({ language: isEn ? 'he' : 'en' })}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold border-2 border-blue-700 text-base sm:text-lg cursor-pointer transition-all shadow-sm active:scale-95"
          aria-label={isEn ? 'Switch to Hebrew' : 'החלף לאנגלית'}
        >
          <Globe className="w-5 h-5" />
          <span>{isEn ? '🇮🇱 עברית' : '🇺🇸 English'}</span>
        </button>

        {/* High Contrast Toggle */}
        <button
          onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-base sm:text-lg font-bold border-2 cursor-pointer transition-all ${
            settings.highContrast
              ? 'bg-yellow-400 text-black border-yellow-500'
              : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
          }`}
          aria-label={isEn ? 'High Contrast' : 'ניגודיות גבוהה'}
        >
          <Eye className="w-5 h-5" />
          <span className="hidden sm:inline">{isEn ? 'Contrast' : 'ניגודיות'}</span>
        </button>

        {/* Font Size Toggle */}
        <button
          onClick={() => {
            const nextSize =
              settings.fontSize === 'normal'
                ? 'large'
                : settings.fontSize === 'large'
                ? 'huge'
                : 'normal';
            onUpdateSettings({ fontSize: nextSize });
          }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-bold border-2 border-stone-300 text-base sm:text-lg cursor-pointer transition-all"
          aria-label={isEn ? 'Font Size' : 'גודל כתב'}
        >
          <Type className="w-5 h-5 text-red-700" />
          <span>
            {isEn
              ? `Text: ${settings.fontSize === 'huge' ? 'Huge' : settings.fontSize === 'large' ? 'Large' : 'Normal'}`
              : `כתב ${settings.fontSize === 'huge' ? 'ענק' : settings.fontSize === 'large' ? 'גדול' : 'רגיל'}`}
          </span>
        </button>

        {/* Reset / Home Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold border-2 border-stone-400 text-base sm:text-lg cursor-pointer transition-all active:scale-95"
          aria-label={isEn ? 'Start Over' : 'אפס שיחה'}
        >
          <RefreshCw className="w-5 h-5 text-stone-700" />
          <span className="hidden sm:inline">{isEn ? 'Start Over' : 'התחלה'}</span>
        </button>
      </div>
    </header>
  );
};
