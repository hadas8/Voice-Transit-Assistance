import React from 'react';
import { TransitOption, TripState } from '../types';
import { Bus, Clock, MapPin, CheckCircle, Volume2, RotateCcw, Accessibility } from 'lucide-react';

interface TripResultCardProps {
  transit: TransitOption;
  tripState: TripState;
  highContrast?: boolean;
  fontSize?: 'normal' | 'large' | 'huge';
  language?: 'he' | 'en';
  onRepeatAudio: () => void;
  onResetTrip: () => void;
}

export const TripResultCard: React.FC<TripResultCardProps> = ({
  transit,
  tripState,
  highContrast,
  fontSize = 'large',
  language = 'he',
  onRepeatAudio,
  onResetTrip,
}) => {
  const isEn = language === 'en';

  const cardBg = highContrast
    ? 'bg-black text-white border-4 border-yellow-400 shadow-2xl'
    : 'bg-red-50 border-4 border-red-300 text-stone-900 shadow-xl';

  return (
    <div className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 my-4 transition-all ${cardBg}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-red-200 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
            <Bus className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-red-950">
              {isEn ? 'Your Trip Result' : 'הנסיעה שנמצאה עבורך'}
            </h2>
            <p className="text-lg font-bold text-red-800">
              {isEn ? 'To: ' : 'אל: '}
              <span className="underline decoration-red-500">{tripState.destination || (isEn ? 'Requested Destination' : 'היעד המבוקש')}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onRepeatAudio}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg sm:text-xl cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
          aria-label={isEn ? 'Listen again' : 'השמע מחדש את הוראות הנסיעה'}
        >
          <Volume2 className="w-7 h-7" />
          <span>{isEn ? 'Listen 🔊' : 'השמע שוב'}</span>
        </button>
      </div>

      {/* Main Bus Line Number Display */}
      <div className="bg-white rounded-3xl p-6 border-2 border-red-200 shadow-inner my-4 text-center">
        <span className="block text-xl font-bold text-stone-600 mb-1">
          {isEn ? 'Transit Line to Board:' : 'קו התחבורה לעלייה:'}
        </span>
        <div className="text-5xl sm:text-7xl font-black text-red-600 tracking-tight my-2">
          {transit.lineName}
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-stone-800">{transit.direction}</p>
      </div>

      {/* Grid of Key Info in Large Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {/* Arrival Time */}
        <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-5 flex items-center gap-4">
          <Clock className="w-10 h-10 text-amber-700 shrink-0" />
          <div>
            <span className="block text-base font-bold text-amber-900">
              {isEn ? 'Arrival Time:' : 'זמן הגעת האוטובוס:'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-950">
              {isEn ? `In ${transit.arrivalTimeMinutes} minutes` : `בעוד ${transit.arrivalTimeMinutes} דקות`}
            </span>
          </div>
        </div>

        {/* Boarding Stop & Distance */}
        <div className="bg-sky-100 border-2 border-sky-300 rounded-2xl p-5 flex items-center gap-4">
          <MapPin className="w-10 h-10 text-sky-700 shrink-0" />
          <div>
            <span className="block text-base font-bold text-sky-900">
              {isEn ? 'Stop Location:' : 'מיקום התחנה:'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-sky-950">
              {isEn ? `${transit.stopDistanceMeters}m away` : `${transit.stopDistanceMeters} מטר ממך`}
            </span>
            <p className="text-sm font-bold text-sky-800">{transit.stopName}</p>
          </div>
        </div>
      </div>

      {/* Accessibility details badge */}
      <div className="bg-stone-100 border-2 border-stone-300 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <Accessibility className="w-9 h-9 text-stone-800 shrink-0 mt-1" />
        <div>
          <span className="block text-lg font-bold text-stone-950">
            {isEn ? 'Accessibility Info:' : 'מידע נגישות לנהג ולנוסע:'}
          </span>
          <p className="text-lg font-extrabold text-stone-900 leading-snug">
            {transit.accessibilityDetails}
          </p>
          {tripState.accessibilityNote && (
            <p className="text-base font-bold text-stone-700 mt-1">
              {isEn
                ? `✓ Driver notified: "${tripState.accessibilityNote}"`
                : `✓ הנהג קיבל התראה על: "${tripState.accessibilityNote}"`}
            </p>
          )}
        </div>
      </div>

      {/* Reset button to search another route */}
      <div className="pt-2 text-center">
        <button
          onClick={onResetTrip}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-900 font-extrabold text-xl sm:text-2xl cursor-pointer transition-all border-2 border-stone-400 active:scale-95 flex items-center justify-center gap-3 mx-auto"
        >
          <RotateCcw className="w-7 h-7 text-stone-700" />
          <span>{isEn ? 'Start New Trip' : 'התחל שיחה חדשה'}</span>
        </button>
      </div>
    </div>
  );
};
