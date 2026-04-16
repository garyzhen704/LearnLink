import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Keyboard,
  Layers,
  Mic,
  MicOff,
  Pencil,
  Shuffle,
  Star,
  Upload,
} from 'lucide-react';
import Page from '../components/Page.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import VoicePanel from '../components/VoicePanel.jsx';
import GeneratedFromBadges from '../components/GeneratedFromBadges.jsx';
import { Button, IconButton } from '../base-ui-components';
import { http } from '../lib/api.js';
import useVoiceAnswer from '../hooks/useVoiceAnswer.js';

export default function FlashcardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [setData, setSetData] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await http(`/sets/${id}?includeCards=true`);
        if (!alive) return;
        setSetData(data);
        const normalized = (data.cards || []).map((card) => ({
          id: card._id || crypto.randomUUID(),
          term: card.term ?? card.front ?? '',
          definition: card.definition ?? card.back ?? '',
        }));
        setCards(normalized);
        setIndex(0);
        setFlipped(false);
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Failed to load set.');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const total = cards.length;
  const current = total ? cards[index] : null;

  const voice = useVoiceAnswer({ card: current });

  const goPrev = useCallback(() => {
    if (!total) return;
    setIndex((prev) => (prev - 1 + total) % total);
    setFlipped(false);
  }, [total]);

  const goNext = useCallback(() => {
    if (!total) return;
    setIndex((prev) => (prev + 1) % total);
    setFlipped(false);
  }, [total]);

  const handleFlipToggle = useCallback(() => {
    if (!total) return;
    setFlipped((state) => !state);
  }, [total]);

  const shuffle = useCallback(() => {
    if (!total) return;
    setCards((prev) => shuffleArray(prev));
    setIndex(0);
    setFlipped(false);
  }, [total]);

  useEffect(() => {
    const listener = (event) => {
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === ' ') {
        event.preventDefault();
        handleFlipToggle();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [goPrev, goNext, handleFlipToggle]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleFlipToggle();
      }
    },
    [handleFlipToggle],
  );

  const handleMicClick = useCallback(() => {
    if (voice.status === 'listening') {
      voice.stop();
      return;
    }
    voice.start();
  }, [voice]);

  const cardCountLabel = useMemo(() => {
    if (!setData) return '';
    return `${total} card${total === 1 ? '' : 's'}`;
  }, [setData, total]);

  if (loading) {
    return (
      <Page title="Loading set" subtitle="Please wait">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Flashcard set" subtitle="">
        <StatusMessage tone="error">{error}</StatusMessage>
        <Link to="/flashcards" className="btn-outline mt-4 inline-flex">Back to sets</Link>
      </Page>
    );
  }

  return (
    <Page title="" subtitle="">
      <div className="flex items-center gap-2 text-sm text-ds-foreground-muted">
        <Link to="/flashcards" className="font-medium text-ds-foreground hover:underline">Flashcards</Link>
        <span>/</span>
        <span className="text-ds-foreground-muted">{setData?.title || 'Set'}</span>
      </div>

      <section className="card mt-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-ds-foreground">{setData?.title || 'Flashcard set'}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ds-foreground-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/60 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Class
              </span>
              <span>{cardCountLabel}</span>
              <span>Last studied 2h ago</span>
            </div>
            <GeneratedFromBadges item={setData} className="pt-1" />
          </div>
          <div className="flex gap-2">
            <Link to={`/flashcards/new?edit=${setData?._id}`} className="inline-flex">
              <Button variant="outline" iconLeading={<Pencil size={16} />}>Edit</Button>
            </Link>
            <Button variant="outline" iconLeading={<Upload size={16} />} disabled title="Coming soon">
              Export
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <div className="relative">
            <IconButton
              icon={Star}
              variant="ghost"
              size="md"
              className="absolute top-3 right-3 z-10"
              onClick={(event) => event.stopPropagation()}
              aria-label="Favorite card"
              title="Favorite (coming soon)"
            />
            <div
              className="flashcard-container cursor-pointer select-none text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-border-focus"
              onClick={handleFlipToggle}
              onKeyDown={handleCardKeyDown}
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
            >
              {current ? (
                <div className={`flashcard-card${flipped ? ' is-flipped' : ''}`}>
                  <div className="flashcard-face flashcard-face-front">
                    <div className="flashcard-face-content">
                      <div className="flashcard-text">
                        {current.term || <span className="flashcard-text-empty">(no term)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flashcard-face flashcard-face-back">
                    <div className="flashcard-face-content">
                      <div className="flashcard-text">
                        {current.definition || <span className="flashcard-text-empty">(no definition)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flashcard-empty">No cards in this set yet.</div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center justify-center gap-3">
              <IconButton
                icon={ArrowLeft}
                variant="outline"
                size="md"
                onClick={goPrev}
                disabled={!total || voice.busy}
                aria-label="Previous card"
              />
              <span className="text-sm font-medium text-ds-foreground-muted tabular-nums">
                {total ? `${index + 1}/${total}` : '0/0'}
              </span>
              <IconButton
                icon={ArrowRight}
                variant="outline"
                size="md"
                onClick={goNext}
                disabled={!total || voice.busy}
                aria-label="Next card"
              />
            </div>
            <IconButton
              icon={voice.status === 'listening' ? MicOff : Mic}
              variant={voice.status === 'listening' ? 'filled' : 'outline'}
              size="md"
              onClick={handleMicClick}
              disabled={!total || !voice.isSupported || voice.status === 'transcribing' || voice.status === 'grading'}
              aria-label={voice.status === 'listening' ? 'Stop recording' : 'Start recording'}
            />
          </div>

          <hr className="border-ds-border" />

          {!voice.isSupported ? (
            <StatusMessage tone="warning">
              This browser does not support microphone recording.
            </StatusMessage>
          ) : null}

          <VoicePanel
            status={voice.status}
            mediaStream={voice.mediaStream}
            transcript={voice.transcript}
            grade={voice.grade}
            error={voice.error}
            onDismiss={voice.dismiss}
          />
        </div>

        <aside>
          <div className="card p-4">
            <p className="px-1 pb-3 text-sm text-ds-foreground-muted">Actions</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={shuffle}
                disabled={!total || voice.busy}
                iconLeading={<Shuffle size={16} />}
                className="w-full justify-center"
              >
                Shuffle set
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/flashcards/${id}/match`)}
                disabled={!total}
                iconLeading={<Layers size={16} />}
                className="w-full justify-center"
              >
                Match cards
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/flashcards/${id}/typing`)}
                disabled={!total}
                iconLeading={<Keyboard size={16} />}
                className="w-full justify-center"
              >
                Typing practice
              </Button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="mt-1 w-full rounded-ds-md py-2 text-sm font-medium text-ds-foreground-muted hover:text-ds-foreground disabled:cursor-not-allowed disabled:text-ds-disabled-fg"
              >
                View set
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function shuffleArray(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
