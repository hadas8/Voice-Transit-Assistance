export type ConversationStep = 
  | 'IDLE'           // Initial screen with big hand
  | 'GREETING'       // "שלום, מה שלומך היום?"
  | 'ACCESSIBILITY'   // "יש מגבלה פיזית שהנהג צריך לדעת עליה?"
  | 'DESTINATION'    // "לאן אתה צריך להגיע?"
  | 'CALCULATING'    // "מחפש את הרכב הציבורי..."
  | 'RESULT'         // Explaining the bus line, time, stop
  | 'COMPLETED';     // Conversation ended or ready for new question

export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

export interface TripState {
  accessibilityNote: string;
  destination: string;
  userLocationName: string;
}

export interface TransitOption {
  lineName: string;
  lineType: 'bus' | 'light_rail' | 'train';
  direction: string;
  stopName: string;
  stopDistanceMeters: number;
  arrivalTimeMinutes: number;
  durationMinutes: number;
  isAccessible: boolean;
  accessibilityDetails: string;
  spokenSummaryHebrew: string;
  spokenSummaryEnglish?: string;
}

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'huge';
  highContrast: boolean;
  speechRate: number;
  language: 'he' | 'en';
}
