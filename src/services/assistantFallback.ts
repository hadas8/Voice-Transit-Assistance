// The assistant's deterministic reply logic, lifted verbatim out of server.ts
// so it can run in the browser.
//
// It was already there as the no-API-key fallback: pure string matching, no
// network and no Node APIs. Moving it here is what lets the app be served as
// a plain static site, with no server to host and no key to keep secret.
//
// Voice is unaffected — speech recognition and speech synthesis are browser
// APIs and never went through the server.

export function getAssistantResponse(step: string, speech: string = '', tripState: any = {}, language: 'he' | 'en' = 'he') {
  const cleanSpeech = (speech || '').trim();

  if (language === 'en') {
    if (!step || step === 'GREETING') {
      return {
        step: 'ACCESSIBILITY',
        nextStep: 'ACCESSIBILITY',
        assistantMessage: 'Hello, nice to meet you! Are there any physical accessibility needs the driver should know about?',
        extractedAccessibility: tripState.accessibilityNote || '',
        extractedDestination: tripState.destination || '',
        needsClarification: false,
      };
    }

    if (step === 'ACCESSIBILITY') {
      let acc = cleanSpeech;
      const lower = cleanSpeech.toLowerCase();
      if (lower.includes('no') || lower.includes('none') || lower.includes('fine') || lower.includes('good')) {
        acc = 'None';
      } else if (lower.includes('wheelchair')) {
        acc = 'Wheelchair';
      } else if (lower.includes('walker')) {
        acc = 'Walker';
      } else if (lower.includes('stairs') || lower.includes('walking')) {
        acc = 'Difficulty with stairs';
      }

      return {
        step: 'DESTINATION',
        nextStep: 'DESTINATION',
        assistantMessage: `Got it. Recorded: ${acc || 'None'}. Now, where do you need to go?`,
        extractedAccessibility: acc || 'None',
        extractedDestination: tripState.destination || '',
        needsClarification: false,
      };
    }

    if (step === 'DESTINATION') {
      let dest = cleanSpeech;
      if (!dest || dest.length < 2) {
        return {
          step: 'DESTINATION',
          nextStep: 'DESTINATION',
          assistantMessage: "I didn't quite catch where you want to go. Could you say the destination again?",
          extractedAccessibility: tripState.accessibilityNote || 'None',
          extractedDestination: '',
          needsClarification: true,
        };
      }

      return {
        step: 'RESULT',
        nextStep: 'RESULT',
        assistantMessage: `Great, searching for the best public transportation for you to ${dest}.`,
        extractedAccessibility: tripState.accessibilityNote || 'None',
        extractedDestination: dest,
        needsClarification: false,
      };
    }

    return {
      step: 'COMPLETED',
      nextStep: 'COMPLETED',
      assistantMessage: 'If you want to search for another trip, press the waving hand button again.',
      extractedAccessibility: tripState.accessibilityNote,
      extractedDestination: tripState.destination,
      needsClarification: false,
    };
  }

  // Hebrew Fallback
  if (!step || step === 'GREETING') {
    return {
      step: 'ACCESSIBILITY',
      nextStep: 'ACCESSIBILITY',
      assistantMessage: 'שלום, נעים מאוד! יש מגבלה פיזית שהנהג צריך לדעת עליה?',
      extractedAccessibility: tripState.accessibilityNote || '',
      extractedDestination: tripState.destination || '',
      needsClarification: false,
    };
  }

  if (step === 'ACCESSIBILITY') {
    let acc = cleanSpeech;
    if (cleanSpeech.includes('לא') || cleanSpeech.includes('אין') || cleanSpeech.includes('בסדר')) {
      acc = 'ללא מגבלה מיוחדת';
    } else if (cleanSpeech.includes('כיסא') || cleanSpeech.includes('גלגלים')) {
      acc = 'כיסא גלגלים';
    } else if (cleanSpeech.includes('הליכון')) {
      acc = 'הליכון';
    } else if (cleanSpeech.includes('קשה') || cleanSpeech.includes('ללכת') || cleanSpeech.includes('מדרגות')) {
      acc = 'קושי בהליכה במדרגות';
    }

    return {
      step: 'DESTINATION',
      nextStep: 'DESTINATION',
      assistantMessage: `הבנתי. נרשם: ${acc || 'בסדר גמור'}. עכשיו, לאן אתה צריך להגיע?`,
      extractedAccessibility: acc || 'אין מגבלה',
      extractedDestination: tripState.destination || '',
      needsClarification: false,
    };
  }

  if (step === 'DESTINATION') {
    let dest = cleanSpeech;
    if (!dest || dest.length < 2) {
      return {
        step: 'DESTINATION',
        nextStep: 'DESTINATION',
        assistantMessage: 'לא הצלחתי להבין בדיוק לאן תרצה להגיע. אפשר לומר שוב את שם המקום?',
        extractedAccessibility: tripState.accessibilityNote || 'אין',
        extractedDestination: '',
        needsClarification: true,
      };
    }

    return {
      step: 'RESULT',
      nextStep: 'RESULT',
      assistantMessage: `מצוין, מחפש את התחבורה הציבורית הטובה ביותר עבורך אל ${dest}.`,
      extractedAccessibility: tripState.accessibilityNote || 'אין מגבלה',
      extractedDestination: dest,
      needsClarification: false,
    };
  }

  return {
    step: 'COMPLETED',
    nextStep: 'COMPLETED',
    assistantMessage: 'אם תרצה לחפש נסיעה נוספת, לחץ שוב על כפתור השלום.',
    extractedAccessibility: tripState.accessibilityNote,
    extractedDestination: tripState.destination,
    needsClarification: false,
  };
}
