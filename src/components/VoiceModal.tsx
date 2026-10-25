import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { ChatGPTIcon } from './Icons';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage: (text: string) => Promise<string>;
}

type VoiceStatus = 'listening' | 'thinking' | 'speaking' | 'idle';

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onNewMessage }) => {
  const [status, setStatus] = useState<VoiceStatus>('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setTranscript('');
      setAiResponse('');
      startListening();
    } else {
      stopAllAudio();
    }
  }, [isOpen]);

  const stopAllAudio = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  };

  const startListening = () => {
    if (isMuted) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      setStatus('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (!isComponentMounted.current) return;
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        if (!isComponentMounted.current) return;
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (!isComponentMounted.current) return;
        console.warn('Voice recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
        }
      };

      recognition.onend = async () => {
        if (!isComponentMounted.current) return;
        if (transcript.trim()) {
          await processUserSpeech(transcript.trim());
        } else {
          // If no speech detected, listen again
          if (isOpen && !isMuted) {
            setTimeout(() => {
              if (isOpen && isComponentMounted.current && status === 'listening') {
                try {
                  recognition.start();
                } catch (e) {}
              }
            }, 600);
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Speech recognition error:', err);
      setErrorMessage(err.message || 'Microphone error');
      setStatus('idle');
    }
  };

  const processUserSpeech = async (userText: string) => {
    setStatus('thinking');
    try {
      const response = await onNewMessage(userText);
      setAiResponse(response);
      speakResponse(response);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process voice response');
      setStatus('idle');
    }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setStatus('listening');
      startListening();
      return;
    }

    window.speechSynthesis.cancel();
    setStatus('speaking');

    // Clean markdown before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (!isComponentMounted.current) return;
      setTranscript('');
      setStatus('listening');
      startListening();
    };

    utterance.onerror = () => {
      if (!isComponentMounted.current) return;
      setStatus('listening');
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0d0d0d]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatGPTIcon className="w-6 h-6 text-white" />
          <span className="font-semibold text-white tracking-wide">ChatGPT Voice</span>
        </div>
        <button
          type="button"
          onClick={() => {
            stopAllAudio();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-[#242424] hover:bg-[#333333] text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          title="Exit Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Interactive Orb */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-md">
        <div className="relative flex items-center justify-center w-64 h-64">
          {/* Animated Glow Rings */}
          <div
            className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
              status === 'speaking'
                ? 'bg-blue-500/40 scale-125'
                : status === 'listening'
                ? 'bg-emerald-500/30 scale-110'
                : status === 'thinking'
                ? 'bg-purple-500/40 scale-100 animate-pulse'
                : 'bg-zinc-700/20 scale-90'
            }`}
          />

          {/* Central Blue Sphere with Audio Waveforms */}
          <div
            className={`relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 scale-105 shadow-blue-500/50'
                : status === 'listening'
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-600 shadow-teal-500/40'
                : status === 'thinking'
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 shadow-purple-500/40'
                : 'bg-zinc-800 shadow-zinc-900/50'
            }`}
          >
            {/* Waveform bars inside orb */}
            <div className="flex items-center justify-center gap-1.5 h-16">
              <span
                className={`w-2 rounded-full bg-white transition-all ${
                  status === 'speaking' || status === 'listening'
                    ? 'animate-wave-1 h-12'
                    : 'h-3 opacity-60'
                }`}
              />
              <span
                className={`w-2 rounded-full bg-white transition-all ${
                  status === 'speaking' || status === 'listening'
                    ? 'animate-wave-2 h-16'
                    : 'h-4 opacity-70'
                }`}
              />
              <span
                className={`w-2 rounded-full bg-white transition-all ${
                  status === 'speaking' || status === 'listening'
                    ? 'animate-wave-3 h-20'
                    : 'h-6 opacity-90'
                }`}
              />
              <span
                className={`w-2 rounded-full bg-white transition-all ${
                  status === 'speaking' || status === 'listening'
                    ? 'animate-wave-4 h-14'
                    : 'h-4 opacity-70'
                }`}
              />
              <span
                className={`w-2 rounded-full bg-white transition-all ${
                  status === 'speaking' || status === 'listening'
                    ? 'animate-wave-5 h-10'
                    : 'h-3 opacity-60'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="mt-8 text-center">
          <p className="text-lg font-medium text-white capitalize tracking-wide">
            {status === 'listening'
              ? 'Listening...'
              : status === 'thinking'
              ? 'Thinking...'
              : status === 'speaking'
              ? 'Speaking...'
              : 'Tap microphone to speak'}
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {status === 'speaking'
              ? 'Tap anywhere or speak to interrupt'
              : 'Speak naturally, ChatGPT is tuned in'}
          </p>
        </div>

        {/* Live speech preview */}
        {(transcript || aiResponse) && (
          <div className="mt-6 w-full max-h-28 overflow-y-auto px-4 py-3 rounded-2xl bg-[#1c1c1c] border border-[#2e2e2e] text-xs text-zinc-300">
            {transcript && (
              <p className="text-zinc-200">
                <span className="text-zinc-500 font-semibold">You: </span>
                {transcript}
              </p>
            )}
            {aiResponse && status === 'speaking' && (
              <p className="text-sky-300 mt-1 line-clamp-3">
                <span className="text-sky-500 font-semibold">ChatGPT: </span>
                {aiResponse}
              </p>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-sm flex items-center justify-center gap-6 pb-4">
        {/* Mute button */}
        <button
          type="button"
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-[#242424] hover:bg-[#323232] text-white border border-[#383838]'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End voice button */}
        <button
          type="button"
          onClick={() => {
            stopAllAudio();
            onClose();
          }}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/30"
          title="End Voice Call"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
