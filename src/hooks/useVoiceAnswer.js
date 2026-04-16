import { useCallback, useEffect, useState } from 'react';
import { http } from '../lib/api.js';
import useSpeechToText from './useSpeechToText.js';

export default function useVoiceAnswer({ card } = {}) {
  const [grade, setGrade] = useState(null);
  const [gradeError, setGradeError] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const handleTranscript = useCallback(
    async (spokenTranscript) => {
      const expectedDefinition = card?.definition?.trim();
      if (!expectedDefinition) {
        setGrade(null);
        return;
      }

      setIsGrading(true);
      setGradeError('');

      try {
        const response = await http('/ai/grade-flashcard', {
          method: 'POST',
          body: JSON.stringify({
            term: card?.term || '',
            expectedDefinition,
            transcript: spokenTranscript,
          }),
        });

        setGrade({
          correct: Boolean(response?.correct),
          score: Number(response?.score) || 0,
          reason: String(response?.reason || '').trim(),
        });
      } catch (err) {
        setGradeError(err.message || 'Failed to grade spoken answer.');
        setGrade(null);
      } finally {
        setIsGrading(false);
      }
    },
    [card],
  );

  const {
    isSupported,
    isRecording,
    isTranscribing,
    transcript,
    error: speechError,
    mediaStream,
    startRecording,
    stopRecording,
    clearResult,
  } = useSpeechToText({ onTranscript: handleTranscript, language: 'en' });

  const dismiss = useCallback(() => {
    clearResult();
    setGrade(null);
    setGradeError('');
  }, [clearResult]);

  const cardId = card?.id ?? null;
  useEffect(() => {
    dismiss();
  }, [cardId, dismiss]);

  const error = speechError || gradeError || '';

  let status = 'idle';
  if (error) status = 'error';
  else if (isRecording) status = 'listening';
  else if (isTranscribing) status = 'transcribing';
  else if (isGrading) status = 'grading';
  else if (grade || transcript) status = 'result';

  const busy = isRecording || isTranscribing || isGrading;

  return {
    status,
    isSupported,
    busy,
    mediaStream,
    transcript,
    grade,
    error,
    start: startRecording,
    stop: stopRecording,
    dismiss,
  };
}
