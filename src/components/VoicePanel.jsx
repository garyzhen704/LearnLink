import { X } from 'lucide-react';
import { IconButton } from '../base-ui-components';
import AudioWaveform from './AudioWaveform.jsx';

export default function VoicePanel({
  status,
  mediaStream,
  transcript,
  grade,
  error,
  onDismiss,
}) {
  if (status === 'idle') return null;

  const isListening = status === 'listening' || status === 'transcribing';
  const showResult = status === 'result' || status === 'grading';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ds-foreground">
          {isListening ? 'Listening...' : 'Transcript'}
          {status === 'transcribing' ? ' (transcribing)' : ''}
          {status === 'grading' ? ' (checking answer...)' : ''}
        </p>
        {status !== 'listening' && status !== 'transcribing' ? (
          <IconButton icon={X} variant="ghost" size="sm" onClick={onDismiss} aria-label="Dismiss" />
        ) : null}
      </div>

      {isListening ? (
        <div className="mt-3 rounded-ds-md bg-ds-neutral/40 px-3 py-2">
          <AudioWaveform stream={mediaStream} active />
        </div>
      ) : null}

      {showResult ? (
        <>
          <div className="mt-3 rounded-ds-md border border-ds-border bg-ds-neutral/40 px-3 py-2 text-sm text-ds-foreground-muted">
            {transcript || (status === 'grading' ? 'Transcribing...' : '')}
          </div>
          {grade ? (
            <div className="mt-3 flex items-baseline gap-2 text-sm">
              <span
                className={`font-semibold ${
                  grade.correct ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {Math.round((grade.score || 0) * 100)}%
              </span>
              <span className={grade.correct ? 'text-emerald-600' : 'text-amber-600'}>
                {grade.correct ? 'Nice. Your answer matches the definition.' : 'Not quite.'}
                {grade.reason ? ` ${grade.reason}` : grade.correct ? '' : ' Your answer does not match the definition closely enough.'}
              </span>
            </div>
          ) : null}
        </>
      ) : null}

      {status === 'error' && error ? (
        <p className="mt-3 text-sm text-ds-danger">{error}</p>
      ) : null}
    </div>
  );
}
