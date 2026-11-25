let sharedAudioCtx: AudioContext | null = null;
let voicesWarmed = false;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Call during a user tap/click so later WebSocket-triggered audio & Hindi speech
 * are allowed without browser autoplay restrictions on desktop and mobile.
 */
export function unlockVoiceAudio(): void {
  getAudioContext();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (!voicesWarmed) {
      window.speechSynthesis.getVoices();
      voicesWarmed = true;
    }
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
  } catch {
    // ignore speech unlock failures cleanly
  }
}

function playSoftBell(variant: 'incoming' | 'approved'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = variant === 'incoming' ? [880, 1174.66] : [783.99, 987.77, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.11;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  } catch {
    // ignore WebAudio failures
  }
}

function pickHindiModelVoice(preferredLang: 'hi' | 'en' = 'hi'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isFemaleHindi = (v: SpeechSynthesisVoice) =>
    v.lang.toLowerCase().startsWith('hi') &&
    /(female|swara|kalpana|lekha|heera|google हिन्दी|hindi)/i.test(v.name) &&
    !/hemant|madhur|male/i.test(v.name);

  const isFemaleIndianEn = (v: SpeechSynthesisVoice) =>
    v.lang.toLowerCase() === 'en-in' &&
    /(female|neerja|heera|veena|raveena|google)/i.test(v.name) &&
    !/prabhat|rishi|male/i.test(v.name);

  if (preferredLang === 'en') {
    return (
      voices.find(isFemaleIndianEn) ||
      voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null
    );
  }

  return (
    voices.find(isFemaleHindi) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
    voices.find(isFemaleIndianEn) ||
    voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
    null
  );
}

function speakText(
  text: string,
  preferredLang: 'hi' | 'en' = 'hi',
  options?: { cancelPrevious?: boolean; delayMs?: number }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const { cancelPrevious = true, delayMs = 240 } = options || {};

  const runSpeak = () => {
    try {
      const synth = window.speechSynthesis;
      if (cancelPrevious) {
        synth.cancel();
      } else if (synth.speaking) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickHindiModelVoice(preferredLang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = preferredLang === 'hi' ? 'hi-IN' : 'en-IN';
      }
      utterance.rate = 0.96;
      utterance.pitch = 1.08;
      utterance.volume = 1.0;

      // Retry briefly if voices load asynchronously right after first call
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = () => {
          const loadedVoice = pickHindiModelVoice(preferredLang);
          if (loadedVoice) {
            utterance.voice = loadedVoice;
            utterance.lang = loadedVoice.lang;
          }
        };
      }

      synth.speak(utterance);
    } catch {
      // ignore speech failures cleanly
    }
  };

  if (delayMs > 0) {
    setTimeout(runSpeak, delayMs);
  } else {
    runSpeak();
  }
}

/**
 * Shopkeeper Dashboard Notification:
 * Pleasant chime + Hindi female model voice announcing "Print request received".
 */
export function notifyShopkeeperPrintRequest(
  tokenNumber: number,
  paymentMethod?: string
): void {
  playSoftBell('incoming');
  const paidSuffix = paymentMethod === 'UPI_PAID' ? ' UPI पेमेंट हो चुकी है।' : '';
  const msg = `Print request received! टोकन नंबर ${tokenNumber}, नया डॉक्यूमेंट आया है।${paidSuffix}`;
  speakText(msg, 'hi', { cancelPrevious: true, delayMs: 260 });
}

/**
 * Customer Mobile Notification:
 * Plays celebratory bell + warm Hindi/English voice when shopkeeper approves print.
 */
export function notifyCustomerPrintApproved(
  lang: 'en' | 'hi',
  tokenNumber: number,
  status: 'PRINTING' | 'COMPLETED'
): void {
  playSoftBell('approved');
  if (status === 'PRINTING') {
    const msg =
      lang === 'en'
        ? `Great news! Your print request is approved. Token number ${tokenNumber}, your document is printing now.`
        : `अच्छी खबर! आपकी प्रिंट रिक्वेस्ट अप्रूव हो गई है। टोकन नंबर ${tokenNumber}, आपका प्रिंट निकल रहा है। कृपया काउंटर से लें।`;
    speakText(msg, lang, { cancelPrevious: true, delayMs: 280 });
  } else {
    const msg =
      lang === 'en'
        ? `Your print for token ${tokenNumber} is ready at the counter.`
        : `टोकन नंबर ${tokenNumber}, आपका प्रिंट तैयार है।`;
    speakText(msg, lang, { cancelPrevious: false, delayMs: 280 });
  }
}
