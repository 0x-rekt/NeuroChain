'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/lib/WalletContext';

interface DebateTranscriptionInputProps {
  onSubmit: (speaker: string, text: string) => void;
  isLoading?: boolean;
  currentSpeaker?: string;
}

export default function DebateTranscriptionInput({
  onSubmit,
  isLoading = false,
  currentSpeaker = '',
}: DebateTranscriptionInputProps) {
  const { accountAddress, isConnected } = useWallet();
  const [speaker, setSpeaker] = useState(currentSpeaker);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-fill speaker field with connected wallet address
  useEffect(() => {
    if (isConnected && accountAddress && !speaker) {
      setSpeaker(accountAddress);
    }
  }, [isConnected, accountAddress, speaker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (speaker.trim() && text.trim() && !isLoading) {
      onSubmit(speaker.trim(), text.trim());
      setText('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      const response = await fetch('http://143.244.129.88:6500/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.text || data.transcription || '';

      if (transcribedText.trim()) {
        setText(transcribedText.trim());
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Speaker Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Wallet Address / Speaker ID
          </label>
          {isConnected ? (
            /* Connected wallet - Read only display */
            <div className="w-full bg-gray-900 text-gray-300 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm flex items-center justify-between">
              <span>{accountAddress}</span>
              <span className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Connected
              </span>
            </div>
          ) : (
            /* Not connected - Manual input */
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="Enter your wallet address or speaker ID..."
              disabled={isLoading}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
          <p className="text-xs text-gray-500 mt-1">
            {isConnected
              ? 'Your connected wallet address (locked for security)'
              : 'Connect your wallet for auto-fill and secure identification'
            }
          </p>
        </div>

        {/* Text Input with Buttons */}
        <div className="relative flex items-center gap-2">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isLoading || isTranscribing}
            className={`flex-shrink-0 p-3 rounded-lg transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-gray-800 hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>

          {/* Text Input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? 'Recording your voice...' : isTranscribing ? 'Transcribing...' : 'Enter your contribution to the debate...'}
            disabled={isLoading || isRecording || isTranscribing}
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none h-24"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!speaker.trim() || !text.trim() || isLoading || isRecording || isTranscribing}
            className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium h-24 flex items-center justify-center"
          >
            {isLoading || isTranscribing ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {isRecording ? 'Recording your contribution...' :
             isTranscribing ? 'Transcribing...' :
             isConnected ? `Authenticated as ${accountAddress?.slice(0, 6)}...${accountAddress?.slice(-4)} • Type or speak your contribution` :
             'Connect wallet for secure authentication • Type or speak your contribution'}
          </span>

          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="text-red-400 font-medium animate-pulse">
                ● REC
              </span>
            )}
            {isConnected && !isRecording && !isTranscribing && (
              <span className="text-green-400 font-medium">
                ● Authenticated
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
