import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on server
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Gemini API calls will fallback or return mock responses.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System prompt for patient elderly-focused transit assistant in Hebrew
const ASSISTANT_SYSTEM_PROMPT = `
אתה סייען קולי לתחבורה ציבורית המיועד לקשישים בישראל.
העיקרון החשוב ביותר שלך הוא פשטות, רוגע, סבלנות ושפה העברית הפשוטה, החמה והברורה ביותר.
עליך לשאול או לענות בשאלה אחת בלבד בכל פעם, במשפטים קצרים וברורים, ללא מונחים טכניים.

זרימת השיחה מורכבת מ-4 שלבים עיקריים:
1. ברכה (GREETING): "שלום, מה שלומך היום?"
2. מגבלה פיזית (ACCESSIBILITY): "יש מגבלה פיזית שהנהג צריך לדעת עליה?" (למשל: כיסא גלגלים, הליכון, מקל, קושי במדרגות, או ללא מגבלה)
3. יעד (DESTINATION): "לאן אתה צריך להגיע?" (למשל: בית חולים איכילוב, עזריאלי, תחנה מרכזית, כותל)
4. קבלת התשובה והסבר קולי (RESULT): מתן פרטי התחבורה בשפה פשוטה.

כאשר המשתמש עונה, עליך לנתח את דבריו ולהחזיר תשובה בפורמט JSON:
- step: השלב הנוכחי ("GREETING", "ACCESSIBILITY", "DESTINATION", "RESULT", "COMPLETED")
- assistantMessage: מה שהסייען יגיד בקול רם בעברית פשוטה ואיטית
- extractedAccessibility: המגבלה הפיזית שזוהתה (אם קיימת, או "ללא" / "הליכון" / "כיסא גלגלים" וכדומה)
- extractedDestination: היעד שזוהה (אם הובן)
- needsClarification: boolean (true אם היעד/תשובה לא מובנת)
- promptQuestion: השאלה הבאה לשאול
`;

// API Route: Assistant conversation step analysis
app.post('/api/assistant', async (req, res) => {
  try {
    const { currentStep, userSpeech, tripState, language = 'he' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback deterministic response logic if GEMINI_API_KEY is missing
      return res.json(getFallbackAssistantResponse(currentStep, userSpeech, tripState, language));
    }

    const langInstruction = language === 'en'
      ? 'Respond strictly in simple, friendly, calm English suitable for elderly users.'
      : 'ענה אך ורק בעברית פשוטה, חמה וברורה המיועדת לקשישים.';

    const prompt = `
Language mode: ${language}
${langInstruction}
Current step: "${currentStep || 'GREETING'}"
Collected trip info:
- Accessibility: "${tripState?.accessibilityNote || 'None'}"
- Destination: "${tripState?.destination || 'Unknown'}"

User spoken input: "${userSpeech || ''}"

Return valid JSON ONLY matching:
{
  "step": "next step name",
  "assistantMessage": "The spoken sentence for the assistant in ${language === 'en' ? 'English' : 'Hebrew'}",
  "extractedAccessibility": "updated accessibility note or none",
  "extractedDestination": "updated destination name",
  "needsClarification": false,
  "nextStep": "GREETING | ACCESSIBILITY | DESTINATION | RESULT | COMPLETED"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: ASSISTANT_SYSTEM_PROMPT + `\nRequested Language: ${language}.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.STRING },
            assistantMessage: { type: Type.STRING },
            extractedAccessibility: { type: Type.STRING },
            extractedDestination: { type: Type.STRING },
            needsClarification: { type: Type.BOOLEAN },
            nextStep: { type: Type.STRING },
          },
          required: ['assistantMessage', 'nextStep'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error in /api/assistant:', error);
    // Provide robust friendly fallback
    return res.json(getFallbackAssistantResponse(req.body.currentStep, req.body.userSpeech, req.body.tripState, req.body.language || 'he'));
  }
});

// Deterministic fallback function ensuring 100% app reliability
function getFallbackAssistantResponse(step: string, speech: string = '', tripState: any = {}, language: 'he' | 'en' = 'he') {
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

// Fallback Gemini TTS route
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not available for TTS fallback' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `קרא לאט ובבהירות בעברית: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audio: base64Audio });
    }
    return res.status(500).json({ error: 'Failed to generate audio' });
  } catch (err) {
    console.error('Error in /api/tts:', err);
    return res.status(500).json({ error: 'TTS generation failed' });
  }
});

// Vite Middleware & Production Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Elderly Transit Voice App listening on http://localhost:${PORT}`);
  });
}

startServer();
