import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Page from '../components/Page.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { Button } from '../base-ui-components';
import { http } from '../lib/api.js';

export default function FlashcardMatchPage() {
  const { id } = useParams();
  const [setData, setSetData] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchingTerms, setMatchingTerms] = useState([]);
  const [matchingDefinitions, setMatchingDefinitions] = useState([]);
  const [matchingSelections, setMatchingSelections] = useState({ term: null, definition: null });
  const [matchingIncorrect, setMatchingIncorrect] = useState(null);
  const [matchingStarted, setMatchingStarted] = useState(false);
  const mismatchTimeoutRef = useRef(null);

  const clearMismatchFeedback = useCallback(() => {
    if (mismatchTimeoutRef.current) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    setMatchingIncorrect(null);
  }, []);

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

  const validMatchingCards = useMemo(
    () => cards.filter((card) => (card.term?.trim() ?? '') !== '' && (card.definition?.trim() ?? '') !== ''),
    [cards],
  );

  useEffect(
    () => () => {
      if (mismatchTimeoutRef.current) {
        window.clearTimeout(mismatchTimeoutRef.current);
        mismatchTimeoutRef.current = null;
      }
    },
    [],
  );

  const startMatchingGame = useCallback(() => {
    const playableCards = validMatchingCards.map((card) => ({
      cardId: card.id,
      term: card.term.trim(),
      definition: card.definition.trim(),
    }));
    const terms = shuffleArray(playableCards).map((card) => ({
      cardId: card.cardId,
      text: card.term,
    }));
    const definitions = shuffleArray(playableCards).map((card) => ({
      cardId: card.cardId,
      text: card.definition,
    }));

    clearMismatchFeedback();
    setMatchingTerms(terms);
    setMatchingDefinitions(definitions);
    setMatchingSelections({ term: null, definition: null });
    setMatchingStarted(true);
  }, [clearMismatchFeedback, validMatchingCards]);

  const resolveMatchAttempt = useCallback(
    (termItem, definitionItem) => {
      if (!termItem || !definitionItem) return;

      if (termItem.cardId === definitionItem.cardId) {
        clearMismatchFeedback();
        setMatchingTerms((prev) => prev.filter((entry) => entry.cardId !== termItem.cardId));
        setMatchingDefinitions((prev) => prev.filter((entry) => entry.cardId !== definitionItem.cardId));
        setMatchingSelections({ term: null, definition: null });
      } else {
        if (mismatchTimeoutRef.current) {
          window.clearTimeout(mismatchTimeoutRef.current);
          mismatchTimeoutRef.current = null;
        }
        const timestamp = Date.now();
        setMatchingIncorrect({ term: termItem.cardId, definition: definitionItem.cardId, key: timestamp });
        setMatchingSelections({ term: null, definition: null });
        mismatchTimeoutRef.current = window.setTimeout(() => {
          clearMismatchFeedback();
        }, 450);
      }
    },
    [clearMismatchFeedback],
  );

  const handleTermSelect = useCallback(
    (item) => {
      if (matchingIncorrect) clearMismatchFeedback();
      const alreadySelected = matchingSelections.term?.cardId === item.cardId;

      if (alreadySelected) {
        setMatchingSelections((prev) => ({ ...prev, term: null }));
        return;
      }

      if (matchingSelections.definition) {
        resolveMatchAttempt(item, matchingSelections.definition);
      } else {
        setMatchingSelections((prev) => ({ ...prev, term: item }));
      }
    },
    [clearMismatchFeedback, matchingIncorrect, matchingSelections, resolveMatchAttempt],
  );

  const handleDefinitionSelect = useCallback(
    (item) => {
      if (matchingIncorrect) clearMismatchFeedback();
      const alreadySelected = matchingSelections.definition?.cardId === item.cardId;

      if (alreadySelected) {
        setMatchingSelections((prev) => ({ ...prev, definition: null }));
        return;
      }

      if (matchingSelections.term) {
        resolveMatchAttempt(matchingSelections.term, item);
      } else {
        setMatchingSelections((prev) => ({ ...prev, definition: item }));
      }
    },
    [clearMismatchFeedback, matchingIncorrect, matchingSelections, resolveMatchAttempt],
  );

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
      <Page title="Matching game" subtitle="">
        <StatusMessage tone="error">{error}</StatusMessage>
        <Link to={`/flashcards/${id}`} className="btn-outline mt-4 inline-flex">Back to set</Link>
      </Page>
    );
  }

  return (
    <Page title="" subtitle="">
      <div className="flex items-center gap-2 text-sm text-ds-foreground-muted">
        <Link to="/flashcards" className="hover:text-ds-foreground">Flashcards</Link>
        <span>/</span>
        <Link to={`/flashcards/${id}`} className="hover:text-ds-foreground">
          {setData?.title || 'Set'}
        </Link>
        <span>/</span>
        <span className="text-ds-foreground-muted">Match cards</span>
      </div>

      <div className="card mt-4 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-foreground">{setData?.title || 'Matching game'}</h1>
          <p className="mt-1 text-sm text-ds-foreground-muted">
            Pair each term with its definition to clear the board.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/flashcards/${id}`} className="inline-flex">
            <Button variant="outline" iconLeading={<ArrowLeft size={16} />}>
              Back to set
            </Button>
          </Link>
          <Button
            variant="filled"
            onClick={startMatchingGame}
            disabled={!validMatchingCards.length}
          >
            {matchingStarted ? 'Reset game' : 'Start game'}
          </Button>
        </div>
      </div>

      <div className="card mt-4 p-4">
        {!validMatchingCards.length ? (
          <p className="text-sm text-ds-foreground-muted">
            Add terms and definitions to this set to unlock the matching game.
          </p>
        ) : null}

        {matchingStarted && validMatchingCards.length ? (
          <div className="space-y-4">
            {matchingTerms.length === 0 && matchingDefinitions.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                All matches found! Great job.
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ds-foreground-muted">Terms</p>
                    <ul className="space-y-2">
                      {matchingTerms.map((item) => {
                        const isSelected = matchingSelections.term?.cardId === item.cardId;
                        const isError = matchingIncorrect?.term === item.cardId;
                        return (
                          <li key={`term-${item.cardId}`}>
                            <button
                              type="button"
                              onClick={() => handleTermSelect(item)}
                              className={`group w-full rounded-xl border bg-white p-4 text-left text-sm transition focus:outline-none ${
                                isSelected ? 'border-ds-primary bg-ds-primary/5 ring-2 ring-ds-primary/40' : 'border-ds-border hover:border-ds-border-hover hover:bg-ds-neutral/30'
                              } ${isError ? 'border-red-400 bg-red-50 match-shake' : ''}`}
                              disabled={!!matchingIncorrect && !isError}
                            >
                              <span className="block font-medium text-ds-foreground">{item.text}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ds-foreground-muted">Definitions</p>
                    <ul className="space-y-2">
                      {matchingDefinitions.map((item) => {
                        const isSelected = matchingSelections.definition?.cardId === item.cardId;
                        const isError = matchingIncorrect?.definition === item.cardId;
                        return (
                          <li key={`definition-${item.cardId}`}>
                            <button
                              type="button"
                              onClick={() => handleDefinitionSelect(item)}
                              className={`group w-full rounded-xl border bg-white p-4 text-left text-sm transition focus:outline-none ${
                                isSelected ? 'border-ds-primary bg-ds-primary/5 ring-2 ring-ds-primary/40' : 'border-ds-border hover:border-ds-border-hover hover:bg-ds-neutral/30'
                              } ${isError ? 'border-red-400 bg-red-50 match-shake' : ''}`}
                              disabled={!!matchingIncorrect && !isError}
                            >
                              <span className="block text-ds-foreground">{item.text}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-ds-foreground-muted">Pairs remaining: {matchingTerms.length}</p>
              </>
            )}
          </div>
        ) : null}
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
