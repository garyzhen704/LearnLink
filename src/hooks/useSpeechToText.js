import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, getSessionAuth } from '../lib/api.js';

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
];

export default function useSpeechToText({ onTranscript, language = 'en' } = {}) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const onTranscriptRef = useRef(onTranscript);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const isSupported = Boolean(
    typeof navigator !== 'undefined'
    && navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined',
  );

  const stopTracks = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearResult = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (isRecording || isTranscribing) return;

    setError('');
    setTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const supportedType = PREFERRED_MIME_TYPES.find((type) => (
        typeof MediaRecorder.isTypeSupported === 'function' ? MediaRecorder.isTypeSupported(type) : false
      ));

      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setError(event?.error?.message || 'Audio recording failed.');
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stopTracks();

        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          : null;
        chunksRef.current = [];

        if (!blob?.size) {
          setError('No audio was captured. Please try again.');
          return;
        }

        setIsTranscribing(true);

        try {
          const formData = new FormData();
          formData.append('audio', blob, `recording.${extensionFromMimeType(blob.type)}`);
          if (String(language || '').trim()) {
            formData.append('language', String(language).trim().toLowerCase());
          }

          const { token } = getSessionAuth();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const response = await fetch(`${API_BASE}/audio/transcribe`, {
            method: 'POST',
            headers,
            body: formData,
          });

          const text = await response.text();
          const data = safeParseJSON(text);

          if (!response.ok) {
            throw new Error(data?.message || response.statusText || 'Failed to transcribe audio.');
          }

          const nextTranscript = String(data?.transcript || '').trim();
          if (!nextTranscript) {
            setError('No speech detected. Please try again.');
            return;
          }

          setTranscript(nextTranscript);

          if (typeof onTranscriptRef.current === 'function') {
            await onTranscriptRef.current(nextTranscript);
          }
        } catch (err) {
          setError(err.message || 'Failed to transcribe audio.');
        } finally {
          setIsTranscribing(false);
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      stopTracks();
      setIsRecording(false);
      setError(err.message || 'Microphone access is required to record audio.');
    }
  }, [isRecording, isSupported, isTranscribing, language, stopTracks]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }, []);

  useEffect(() => () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    stopTracks();
  }, [stopTracks]);

  return {
    isSupported,
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearResult,
  };
}

function extensionFromMimeType(mimeType) {
  const value = String(mimeType || '').toLowerCase();
  if (value.includes('mp4')) return 'm4a';
  if (value.includes('mpeg')) return 'mp3';
  if (value.includes('ogg')) return 'ogg';
  if (value.includes('wav')) return 'wav';
  return 'webm';
}

function safeParseJSON(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
