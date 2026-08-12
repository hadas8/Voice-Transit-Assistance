import { TransitOption } from '../types';

export interface ITransportationProvider {
  findNextOption(destination: string, accessibilityNote?: string, language?: 'he' | 'en'): Promise<TransitOption>;
}

// Known destinations database for realistic MVP simulation
const KNOWN_DESTINATIONS: Record<string, Partial<TransitOption>> = {
  'איכילוב': {
    lineName: 'קו 18',
    lineType: 'bus',
    direction: 'בית חולים איכילוב / ויצמן',
    stopName: 'תחנת אבן גבירול / מרמורק (100 מטר ממך)',
    stopDistanceMeters: 100,
    arrivalTimeMinutes: 6,
    durationMinutes: 18,
    isAccessible: true,
    accessibilityDetails: 'אוטובוס נמוך עם רמפה נגישה לכיסא גלגלים ומקום שמור',
  },
  'בית חולים איכילוב': {
    lineName: 'קו 18',
    lineType: 'bus',
    direction: 'בית חולים איכילוב / ויצמן',
    stopName: 'תחנת אבן גבירול (100 מטר ממך)',
    stopDistanceMeters: 100,
    arrivalTimeMinutes: 6,
    durationMinutes: 18,
    isAccessible: true,
    accessibilityDetails: 'אוטובוס נמוך עם רמפה נגישה לכיסא גלגלים ומקום שמור',
  },
  'עזריאלי': {
    lineName: 'קו 25',
    lineType: 'bus',
    direction: 'מרכז עזריאלי / רכבת השלום',
    stopName: 'תחנת דרך בגין (120 מטר ממך)',
    stopDistanceMeters: 120,
    arrivalTimeMinutes: 4,
    durationMinutes: 12,
    isAccessible: true,
    accessibilityDetails: 'נגיש לבעלי מוגבלויות תנועה, מעלית בתחנה',
  },
  'קניון עזריאלי': {
    lineName: 'קו 25',
    lineType: 'bus',
    direction: 'מרכז עזריאלי / רכבת השלום',
    stopName: 'תחנת דרך בגין (120 מטר ממך)',
    stopDistanceMeters: 120,
    arrivalTimeMinutes: 4,
    durationMinutes: 12,
    isAccessible: true,
    accessibilityDetails: 'נגיש לבעלי מוגבלויות תנועה, מעלית בתחנה',
  },
  'תחנה מרכזית': {
    lineName: 'קו 5',
    lineType: 'bus',
    direction: 'תחנה מרכזית חדשה',
    stopName: 'תחנת אלנבי / רוטשילד (80 מטר ממך)',
    stopDistanceMeters: 80,
    arrivalTimeMinutes: 5,
    durationMinutes: 15,
    isAccessible: true,
    accessibilityDetails: 'אוטובוס נגיש לחלוטין',
  },
  'תל השומר': {
    lineName: 'קו 65',
    lineType: 'bus',
    direction: 'מרכז רפואי שיבא - תל השומר',
    stopName: 'תחנת אלוף שדה (150 מטר ממך)',
    stopDistanceMeters: 150,
    arrivalTimeMinutes: 9,
    durationMinutes: 25,
    isAccessible: true,
    accessibilityDetails: 'אוטובוס עם כריזה קולית ורמפה חשמלית',
  },
  'שיבא': {
    lineName: 'קו 65',
    lineType: 'bus',
    direction: 'מרכז רפואי שיבא - תל השומר',
    stopName: 'תחנת אלוף שדה (150 מטר ממך)',
    stopDistanceMeters: 150,
    arrivalTimeMinutes: 9,
    durationMinutes: 25,
    isAccessible: true,
    accessibilityDetails: 'אוטובוס עם כריזה קולית ורמפה חשמלית',
  },
  'כותל': {
    lineName: 'קו 1 (רכבת קלה)',
    lineType: 'light_rail',
    direction: 'הכותל המערבי / שער אשפות',
    stopName: 'תחנת שער יפו (90 מטר ממך)',
    stopDistanceMeters: 90,
    arrivalTimeMinutes: 3,
    durationMinutes: 14,
    isAccessible: true,
    accessibilityDetails: 'רכבת קלה בגובה הרציף - עלייה וירידה ללא מדרגות',
  },
  'סורוקה': {
    lineName: 'קו 12',
    lineType: 'bus',
    direction: 'מרכז רפואי סורוקה / באר שבע',
    stopName: 'תחנת שדרות רגר (110 מטר ממך)',
    stopDistanceMeters: 110,
    arrivalTimeMinutes: 8,
    durationMinutes: 16,
    isAccessible: true,
    accessibilityDetails: 'אוטובוס נמוך עם גישה מלאה להליכון וכיסא גלגלים',
  },
  'רמב"ם': {
    lineName: 'מטרונית קו 1',
    lineType: 'light_rail',
    direction: 'בית חולים רמב"ם / חיפה',
    stopName: 'תחנת רציף המטרונית (70 מטר ממך)',
    stopDistanceMeters: 70,
    arrivalTimeMinutes: 5,
    durationMinutes: 11,
    isAccessible: true,
    accessibilityDetails: 'מטרונית נגישה בגובה הרציף',
  },
};

export class MockTransportationService implements ITransportationProvider {
  async findNextOption(
    destination: string,
    accessibilityNote: string = '',
    language: 'he' | 'en' = 'he'
  ): Promise<TransitOption> {
    // Simulate network latency (0.8 seconds) for realistic feeling
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanDest = destination.trim().toLowerCase();
    
    // Check if we match any known landmark key
    let matchedKey = Object.keys(KNOWN_DESTINATIONS).find((key) =>
      cleanDest.includes(key.toLowerCase())
    );

    const baseData = matchedKey ? KNOWN_DESTINATIONS[matchedKey] : null;

    const rawLine = baseData?.lineName || `קו ${Math.floor(Math.random() * 40) + 4}`;
    const displayLine = language === 'en' ? rawLine.replace('קו', 'Line') : rawLine;
    const stopDist = baseData?.stopDistanceMeters || 100;
    const arrivalMins = baseData?.arrivalTimeMinutes || Math.floor(Math.random() * 6) + 4;
    const travelDuration = baseData?.durationMinutes || Math.floor(Math.random() * 15) + 12;
    
    const stopLocation = language === 'en'
      ? `Main street stop (${stopDist} meters away)`
      : baseData?.stopName || `תחנה קרובה ברחוב הראשי (כ-${stopDist} מטר ממך)`;

    // Accessibility notes customization
    let accInfoHebrew = 'האוטובוס נמוך ונגיש לחלוטין.';
    let accInfoEnglish = 'The bus is low-floor and fully accessible.';

    if (accessibilityNote && accessibilityNote !== 'אין מגבלה' && accessibilityNote !== 'ללא' && accessibilityNote !== 'None') {
      accInfoHebrew = `האוטובוס נגיש עבור ${accessibilityNote}, והנהג יידע לעזור לך בכניסה.`;
      accInfoEnglish = `The bus is accessible for ${accessibilityNote}, and the driver will assist your boarding.`;
    }

    const spokenSummaryHebrew = `האוטובוס הבא שלך הוא ${displayLine}. הוא מגיע בעוד ${arrivalMins} דקות. התחנה נמצאת ${stopDist} מטר ממך. הנסיעה תיקח בערך ${travelDuration} דקות. ${accInfoHebrew}`;
    const spokenSummaryEnglish = `Your next bus is ${displayLine}. It arrives in ${arrivalMins} minutes. The stop is ${stopDist} meters from you. The trip will take about ${travelDuration} minutes. ${accInfoEnglish}`;

    return {
      lineName: displayLine,
      lineType: baseData?.lineType || 'bus',
      direction: language === 'en' ? `Towards ${destination}` : baseData?.direction || `כיוון ${destination}`,
      stopName: stopLocation,
      stopDistanceMeters: stopDist,
      arrivalTimeMinutes: arrivalMins,
      durationMinutes: travelDuration,
      isAccessible: true,
      accessibilityDetails: language === 'en' ? accInfoEnglish : accInfoHebrew,
      spokenSummaryHebrew,
      spokenSummaryEnglish,
    };
  }
}

// Export singleton instance of modular transport service
export const transportationService = new MockTransportationService();
