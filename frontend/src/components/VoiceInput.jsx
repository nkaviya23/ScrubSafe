import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../i18n.js';

export default function VoiceInput({ lang, onTextChange, placeholder = '', setLang }) {
  const t = translations[lang] || translations.en;
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [speechLang, setSpeechLang] = useState(lang === 'ta' ? 'ta' : 'en'); // Track speech language separately

  const speechRecognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize speech recognition if available
  useEffect(() => {
    // Check if SpeechRecognition is available in the browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language based on speechLang selection
      const updateLanguage = () => {
        if (speechLang === 'ta') {
          recognition.lang = 'ta-IN'; // Tamil India
        } else if (speechLang === 'mixed') {
          // For mixed speech, we'll use Tamil as base but handle code-switching
          recognition.lang = 'ta-IN'; // Start with Tamil
        } else {
          recognition.lang = 'en-IN'; // English India
        }
      };

      updateLanguage();

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            interimTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Post-process for mixed language support
        let processedTranscript = interimTranscript;
        if (speechLang === 'mixed') {
          processedTranscript = processMixedLanguage(interimTranscript);
        }

        console.log('[VOICE] onresult transcript:', interimTranscript);
        setTranscript(processedTranscript);
        console.log('[VOICE] after setTranscript in onresult: transcript="', transcript, '", finalTranscript="', finalTranscript, '"');
      };

      recognition.onend = () => {
        console.log('[VOICE] onend fired: isListening=', isListening, ', isProcessing=', isProcessing);

        // If this is a natural end (still listening when onend fires)
        if (isListening) {
          // Mark that we're no longer listening
          setIsListening(false);

          // Set up auto-finalize only if not already processing
          if (!isProcessing) {
            // Auto-finalize after a short pause if not manually stopped
            setIsProcessing(true);
            console.log('[VOICE] onend: setting isProcessing=true');
            setTimeout(() => {
              console.log('[VOICE] timeout fired (1500ms): isProcessing=', isProcessing, ', transcript="', transcript, '"');
              setIsProcessing(false);
              const oldFinalTranscript = finalTranscript;
              setFinalTranscript(transcript);
              const oldTranscript = transcript;
              setTranscript('');
              console.log('[VOICE] timeout: setFinalTranscript from "', oldFinalTranscript, '" to "', transcript, '"');
              console.log('[VOICE] timeout: setTranscript from "', oldTranscript, '" to ""');
              onTextChange(finalTranscript || transcript);
              console.log('[VOICE] timeout: onTextChange called with "', finalTranscript || transcript, '"');
            }, 1500);
          }
        }
        // If !isListening, manual stop was already initiated by handleStopListening
        // Let handleStopListening handle the finalization to avoid race condition
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setIsProcessing(false);
        console.error('Speech recognition error:', event.error);

        let errorMessage = '';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = lang === 'ta'
              ? 'மைക്രோஃப் அனுமதி வழங்கப்படவில்லை. অনুমதி தயங்க வேண்டும்.'
              : 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = lang === 'ta'
              ? 'கொ konuşma algılanmadı. Lütfen tekrar deneyin.'
              : 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = lang === 'ta'
              ? 'மைக்ரோஃப் கிடைக்கவில்லை.'
              : 'Microphone not available.';
            break;
          case 'network':
            errorMessage = lang === 'ta'
              ? 'Network connection error.'
              : 'Network connection error.';
            break;
          default:
            errorMessage = lang === 'ta'
              ? 'Speech recognition failed.'
              : 'Speech recognition failed.';
        }

        setError(errorMessage);
      };

      speechRecognitionRef.current = recognition;

      // Update language when speechLang prop changes
      if (speechRecognitionRef.current) {
        updateLanguage();
      }
    } else {
      setError(lang === 'ta'
        ? 'இத UCUMுனல temos suporte para reconhecimento de fala neste navegador.'
        : 'Speech recognition not supported in this browser.');
    }

    // Cleanup
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [lang, speechLang]);

  // Process mixed language text (Tamil-English code-switching)
  const processMixedLanguage = (text) => {
    // Simple approach: for now, just return the text as-is
    // In a more sophisticated implementation, we could:
    // 1. Detect English words in Tamil context and vice versa
    // 2. Apply corrections based on common misrecognitions
    // 3. Use a dictionary of medical terms
    // For MVP, we'll return the raw recognition result
    // Users can manually correct if needed
    return text;
  };

  const handleStartListening = () => {
    console.log('[VOICE] handleStartListening called: isListening=', isListening, ', isProcessing=', isProcessing, ', transcript="', transcript, '", finalTranscript="', finalTranscript, '"');
    if (!speechRecognitionRef.current) {
      setError(lang === 'ta'
        ? 'Speech recognition not available.'
        : 'Speech recognition not available.');
      console.log('[VOICE] handleStartListening: speech recognition not available');
      return;
    }

    console.log('[VOICE] handleStartListening: resetting state');
    setIsProcessing(false);
    setFinalTranscript('');
    setTranscript('');
    setError(null);
    console.log('[VOICE] handleStartListening: state reset - isProcessing=false, transcript="", finalTranscript="", error=null');

    try {
      speechRecognitionRef.current.start();
      console.log('[VOICE] handleStartListening: started recognition');
    } catch (err) {
      setError(lang === 'ta'
        ? 'Failed to start listening.'
        : 'Failed to start listening.');
      console.error('Failed to start speech recognition:', err);
    }
  };

  const handleStopListening = () => {
  setIsListening(false);
  setIsProcessing(true);
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setTimeout(() => {
      setIsProcessing(false);
      setFinalTranscript(transcript);
      setTranscript('');
      onTextChange(finalTranscript || transcript);
    }, 500);
  };

  const handleClear = () => {
    console.log('[VOICE] handleClear called: isListening=', isListening, ', isProcessing=', isProcessing, ', transcript="', transcript, '", finalTranscript="', finalTranscript, '"');
    const oldTranscript = transcript;
    const oldFinalTranscript = finalTranscript;
    setTranscript('');
    setFinalTranscript('');
    setError(null);
    onTextChange('');
    console.log('[VOICE] handleClear: setTranscript from "', oldTranscript, '" to ""');
    console.log('[VOICE] handleClear: setFinalTranscript from "', oldFinalTranscript, '" to ""');
    console.log('[VOICE] handleClear: onTextChange called with ""');
  };

  // Handle language change from UI
  const handleLanguageChange = (newLang) => {
    setSpeechLang(newLang);
    // Also update the app language if setLang is provided
    if (setLang) {
      // Map speechLang to app lang: ta->ta, en->en, mixed->en (default to English for UI)
      const appLang = newLang === 'mixed' ? 'en' : newLang;
      setLang(appLang);
    }
  };

  // Handle language change from prop (when app language changes)
  useEffect(() => {
    // Update speechLang to match app lang, unless it's mixed
    if (lang !== 'mixed') {
      setSpeechLang(lang);
    }
  }, [lang]);

  // Determine button state and label
  let buttonLabel = '';
  let buttonClass = 'btn btn-secondary';

  if (isListening) {
    buttonLabel = t.voice.recording || '🔴 Recording...';
    buttonClass = 'btn btn-sage';
  } else if (isProcessing) {
    buttonLabel = t.voice.processing || 'Transcribing...';
    buttonClass = 'btn btn-sage';
  } else if (error) {
    buttonLabel = t.voice.error || 'Error';
    buttonClass = 'btn btn-alert';
  } else if (finalTranscript || transcript) {
    buttonLabel = t.voice.edit || 'Edit';
    buttonClass = 'btn btn-sky';
  } else {
    buttonLabel = t.voice.tapToSpeak || '🎤 Tap to speak';
    buttonClass = 'btn btn-secondary';
  }

  // Voice-specific translations
  const voiceTranslations = {
    en: {
      tapToSpeak: '🎤 Tap to speak',
      recording: '🔴 Recording...',
      processing: 'Transcribing...',
      edit: 'Edit',
      error: 'Error',
      language: 'Language:',
      english: 'English',
      tamil: 'Tamil',
      mixed: 'Tamil-English Mixed',
      placeholder: 'Speak your observations here...'
    },
    ta: {
      tapToSpeak: '🎤 பேசдь Хоть',
      recording: '🔴தேடல்கிறேன்...',
      processing: 'மாற்ற hindu...',
      edit: 'திருத்து',
      error: 'பிழை',
      language: 'மொழி:',
      english: 'English',
      tamil: 'Tamil',
      mixed: 'Tamil-English Mixed',
      placeholder: 'உங்கள் பார்வைகளை இங்கே பேசுங்கள்...'
    }
  };

  const voiceT = voiceTranslations[lang] || voiceTranslations.en;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontWeight: 600, minWidth: '80px' }}>
          {voiceT.language}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={speechLang === 'en' ? 'btn btn-sage' : 'btn btn-secondary'}
            onClick={(e) => {
              e.preventDefault();
              handleLanguageChange('en');
            }}
          >
            {voiceT.english}
          </button>
          <button
            type="button"
            className={speechLang === 'ta' ? 'btn btn-sage' : 'btn btn-secondary'}
            onClick={(e) => {
              e.preventDefault();
              handleLanguageChange('ta');
            }}
          >
            {voiceT.tamil}
          </button>
          <button
            type="button"
            className={speechLang === 'mixed' ? 'btn btn-sage' : 'btn btn-secondary'}
            onClick={(e) => {
              e.preventDefault();
              handleLanguageChange('mixed');
            }}
          >
            {voiceT.mixed}
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          name="notes"
          className="form-textarea"
          rows={2}
          placeholder={placeholder || voiceT.placeholder}
          value={finalTranscript || transcript}
          onChange={(e) => {
            const value = e.target.value;
            setFinalTranscript(value);
            setTranscript('');
            onTextChange(value);
          }}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />

        {!isListening && !isProcessing && (finalTranscript || transcript) && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem'
            }}
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          className={buttonClass}
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={false}
        >
          {buttonLabel}
        </button>

        {error && (
          <span style={{
            color: 'var(--alert-red-text)',
            fontSize: '0.75rem',
            marginTop: '0px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            ⚠️ {error}
          </span>
        )}
      </div>
    </div>
  );
}