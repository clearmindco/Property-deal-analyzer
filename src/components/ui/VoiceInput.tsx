"use client";

import { useRef, useState } from "react";

// Uses the browser's built-in Web Speech API (Chrome/Edge) -- no external AI key needed.
// Falls back to a plain textarea with a disabled mic button when unsupported (spec section 5).
export function VoiceInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  function toggleListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChange(value ? `${value} ${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div>
      <div className="flex items-start gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="flex-1 rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="button"
          onClick={toggleListening}
          title={supported ? "Tap to speak" : "Voice input not supported in this browser"}
          className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-sm ${
            listening ? "border-danger bg-danger/10 text-danger" : "border-primary-blue text-primary-blue"
          }`}
        >
          🎤
        </button>
      </div>
      {!supported && (
        <p className="mt-1 text-xs text-text-secondary">
          Voice input isn&apos;t supported in this browser -- try Chrome or Edge, or type directly.
        </p>
      )}
    </div>
  );
}
