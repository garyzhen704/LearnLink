import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import GeneratedFromBadges from '../components/GeneratedFromBadges.jsx';
import Page from '../components/Page.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { http } from '../lib/api.js';
import useSpeechToText from '../hooks/useSpeechToText.js';

export default function FlashcardDetailPage() {
  const { id } = useParams();
  const [setData, setSetData] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchingTerms, setMatchingTerms] = useState([]);
  const [matchingDefinitions, setMatchingDefinitions] = useState([]);
  const [matchingSelections, setMatchingSelections] = useState({ term: null, definition: null });
  const [matchingIncorrect, setMatchingIncorrect] = useState(null);
  const [matchingStarted, setMatchingStarted] = useState(false);
  const [isGradingSpeech, setIsGradingSpeech] = useState(false);
  const [speechGrade, setSpeechGrade] = useState(null);
  const [speechGradeError, setSpeechGradeError] = useState('');
  const mismatchTimeoutRef = useRef(null);

  // Typing game state
  const [typingGameStarted, setTypingGameStarted] = useState(false);
  const [typingGameMode, setTypingGameMode] = useState('term-to-definition'); // 'term-to-definition' | 'definition-to-term'
  const [typingGameIndex, setTypingGameIndex] = useState(0);
  const [typingGameCards, setTypingGameCards] = useState([]);
  const [typingAnswer, setTypingAnswer] = useState('');
  const [typingSubmitted, setTypingSubmitted] = useState(false);
  const [isGradingTyping, setIsGradingTyping] = useState(false);
  const [typingGrade, setTypingGrade] = useState(null);
  const [typingGradeError, setTypingGradeError] = useState('');
  const typingInputRef = useRef(null);

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
  const handleSpokenTranscript = useCallback(
    async (spokenTranscript) => {
      if (!current?.definition?.trim()) {
        setSpeechGrade(null);
        return;
      }

      setIsGradingSpeech(true);
      setSpeechGradeError('');

      try {
        const response = await http('/ai/grade-flashcard', {
          method: 'POST',
          body: JSON.stringify({
            term: current.term || '',
            expectedDefinition: current.definition,
            transcript: spokenTranscript,
          }),
        });

        setSpeechGrade({
          correct: Boolean(response?.correct),
          score: Number(response?.score) || 0,
          reason: String(response?.reason || '').trim(),
        });
      } catch (err) {
        setSpeechGradeError(err.message || 'Failed to grade spoken answer.');
        setSpeechGrade(null);
      } finally {
        setIsGradingSpeech(false);
      }
    },
    [current],
  );

  const {
    isSupported: speechSupported,
    isRecording,
    isTranscribing,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
    clearResult: clearSpeechResult,
  } = useSpeechToText({ onTranscript: handleSpokenTranscript, language: 'en' });
  const speechBusy = isRecording || isTranscribing || isGradingSpeech;

  const validMatchingCards = useMemo(
    () => cards.filter((card) => (card.term?.trim() ?? '') !== '' && (card.definition?.trim() ?? '') !== ''),
    [cards],
  );

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

  const shuffle = () => {
    if (!total) return;
    setCards((prev) => shuffleArray(prev));
    setIndex(0);
    setFlipped(false);
  };

  useEffect(() => {
    const listener = (event) => {
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === ' ') {
        // Don't flip if the user is typing in type game
        if (document.activeElement === typingInputRef.current) return;
        event.preventDefault();
        handleFlipToggle();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [goPrev, goNext, handleFlipToggle]);

  useEffect(() => {
    setMatchingStarted(false);
    setMatchingTerms([]);
    setMatchingDefinitions([]);
    setMatchingSelections({ term: null, definition: null });
    clearMismatchFeedback();
  }, [id, clearMismatchFeedback]);

  useEffect(() => {
    clearSpeechResult();
    setSpeechGrade(null);
    setSpeechGradeError('');
  }, [id, index, clearSpeechResult]);

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

  const subtitle = useMemo(() => {
    if (!setData) return '';
    const count = total;
    return `${count} card${count === 1 ? '' : 's'}`;
  }, [setData, total]);

  const handleCardKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleFlipToggle();
      }
    },
    [handleFlipToggle],
  );

  const handleSpeechButtonClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Typing game helpers
  const validTypingCards = useMemo(
    () => cards.filter((c) => c.term?.trim() && c.definition?.trim()),
    [cards],
  );

  const startTypingGame = useCallback((mode) => {
    const shuffled = shuffleArray(validTypingCards);
    setTypingGameCards(shuffled);
    setTypingGameMode(mode);
    setTypingGameIndex(0);
    setTypingAnswer('');
    setTypingSubmitted(false);
    setTypingGrade(null);
    setTypingGradeError('');
    setTypingGameStarted(true);
    setTimeout(() => typingInputRef.current?.focus(), 50);
  }, [validTypingCards]);

  const currentTypingCard = typingGameStarted ? typingGameCards[typingGameIndex] ?? null : null;
  const typingGameDone = typingGameStarted && typingGameIndex >= typingGameCards.length;

  const submitTypingAnswer = useCallback(async () => {
    if (!currentTypingCard || !typingAnswer.trim() || isGradingTyping) return;
    const isTermToDefinition = typingGameMode === 'term-to-definition';
    const prompt = isTermToDefinition ? currentTypingCard.term : currentTypingCard.definition;
    const expected = isTermToDefinition ? currentTypingCard.definition : currentTypingCard.term;

    setIsGradingTyping(true);
    setTypingGradeError('');
    setTypingSubmitted(true);

    try {
      const response = await http('/ai/grade-flashcard', {
        method: 'POST',
        body: JSON.stringify({
          term: prompt,
          expectedDefinition: expected,
          transcript: typingAnswer.trim(),
        }),
      });
      setTypingGrade({
        correct: Boolean(response?.correct),
        score: Number(response?.score) || 0,
        reason: String(response?.reason || '').trim(),
      });
    } catch (err) {
      setTypingGradeError(err.message || 'Failed to grade answer.');
      setTypingGrade(null);
    } finally {
      setIsGradingTyping(false);
    }
  }, [currentTypingCard, typingAnswer, typingGameMode, isGradingTyping]);

  const nextTypingCard = useCallback(() => {
    setTypingGameIndex((prev) => prev + 1);
    setTypingAnswer('');
    setTypingSubmitted(false);
    setTypingGrade(null);
    setTypingGradeError('');
    setTimeout(() => typingInputRef.current?.focus(), 50);
  }, []);

  const handleTypingKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !typingSubmitted) {
      e.preventDefault();
      submitTypingAnswer();
    }
  }, [typingSubmitted, submitTypingAnswer]);

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
        <Link to="/flashcards" className="btn-outline mt-4 inline-flex" >Back to sets</Link>
      </Page>
    );
  }

  return (
    <Page
      title={setData?.title || 'Flashcard set'}
      subtitle={subtitle}
      actions={
        <div className="flex gap-2">
          <Link to={`/flashcards/new?edit=${setData?._id}`} className="btn-outline">Edit</Link>
          <button type="button" className="btn-ghost" onClick={shuffle} disabled={speechBusy}>Shuffle</button>
        </div>
      }
    >
      <GeneratedFromBadges item={setData} className="mb-4" />
      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <div
            className="flashcard-container cursor-pointer select-none text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
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
                  <div className="text-xs uppercase tracking-wide text-neutral-400">
                    Term | Card {index + 1} of {total}
                  </div>
                </div>
                <div className="flashcard-face flashcard-face-back">
                  <div className="flashcard-face-content">
                    <div className="flashcard-text">
                      {current.definition || <span className="flashcard-text-empty">(no definition)</span>}
                    </div>
                  </div>
                  <div className="text-xs uppercase tracking-wide text-neutral-400">
                    Definition | Card {index + 1} of {total}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flashcard-empty">
                No cards in this set yet.
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <button type="button" onClick={goPrev} className="btn-outline w-full sm:w-auto" disabled={!total || speechBusy}>
                  Previous
                </button>
                <button type="button" onClick={goNext} className="btn-primary w-full sm:w-auto" disabled={!total || speechBusy}>
                  Next
                </button>
                <button type="button" onClick={shuffle} className="btn-ghost w-full sm:w-auto" disabled={!total || speechBusy}>
                  Shuffle cards
                </button>
              </div>
              <p className="text-xs text-neutral-500 md:text-right">
                Use arrow keys to navigate, spacebar to flip.
              </p>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-neutral-900">Speak the definition</p>
                <p className="text-sm text-neutral-500">
                  Prompt: <span className="font-medium text-neutral-700">{current?.term || '(no term)'}</span>
                </p>
              </div>
              <button
                type="button"
                className={`w-full sm:w-auto ${isRecording ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleSpeechButtonClick}
                disabled={!total || !speechSupported || isTranscribing || isGradingSpeech}
              >
                {isRecording ? 'Stop and submit' : 'Start mic'}
              </button>
            </div>

            {!speechSupported ? (
              <StatusMessage tone="warning" className="mt-3">
                This browser does not support microphone recording.
              </StatusMessage>
            ) : null}

            {isRecording ? (
              <p className="mt-3 text-sm text-neutral-600">Recording... tap stop when you finish answering.</p>
            ) : null}
            {isTranscribing ? (
              <p className="mt-3 text-sm text-neutral-600">Transcribing audio...</p>
            ) : null}
            {isGradingSpeech ? (
              <p className="mt-3 text-sm text-neutral-600">Checking answer...</p>
            ) : null}

            {speechError ? <StatusMessage tone="error" className="mt-3">{speechError}</StatusMessage> : null}
            {speechGradeError ? <StatusMessage tone="error" className="mt-3">{speechGradeError}</StatusMessage> : null}

            {transcript ? (
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Transcript</p>
                <p className="mt-1 text-sm text-neutral-700">{transcript}</p>
              </div>
            ) : null}

            {speechGrade ? (
              <StatusMessage tone={speechGrade.correct ? 'success' : 'warning'} className="mt-3">
                {speechGrade.correct ? 'Correct.' : 'Not quite.'} Score: {Math.round(speechGrade.score * 100)}%
                {speechGrade.reason ? ` ${speechGrade.reason}` : ''}
              </StatusMessage>
            ) : null}
          </div>

          {setData?.description ? (
            <div className="card p-4 text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Description</p>
              <p className="mt-1">{setData.description}</p>
            </div>
          ) : null}

          <div className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-neutral-900">Matching game</p>
                <p className="text-sm text-neutral-500">Pair each term with its definition to clear the board.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={startMatchingGame}
                  disabled={!validMatchingCards.length}
                >
                  {matchingStarted ? 'Reset game' : 'Start game'}
                </button>
              </div>
            </div>

            {!validMatchingCards.length ? (
              <p className="mt-4 text-sm text-neutral-500">
                Add terms and definitions to this set to unlock the matching game.
              </p>
            ) : null}

            {matchingStarted && validMatchingCards.length ? (
              <div className="mt-4 space-y-4">
                {matchingTerms.length === 0 && matchingDefinitions.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    All matches found! Great job.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Terms</p>
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
                                    isSelected ? 'border-neutral-900 bg-neutral-900/5 ring-2 ring-neutral-900/60' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                  } ${isError ? 'border-red-400 bg-red-50 match-shake' : ''}`}
                                  disabled={!!matchingIncorrect && !isError}
                                >
                                  <span className="block font-medium text-neutral-900">{item.text}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Definitions</p>
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
                                    isSelected ? 'border-neutral-900 bg-neutral-900/5 ring-2 ring-neutral-900/60' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                  } ${isError ? 'border-red-400 bg-red-50 match-shake' : ''}`}
                                  disabled={!!matchingIncorrect && !isError}
                                >
                                  <span className="block text-neutral-700">{item.text}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500">Pairs remaining: {matchingTerms.length}</p>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Typing Game */}
          <div className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-neutral-900">Typing game</p>
                <p className="text-sm text-neutral-500">
                  Type the answer from memory. Gemini will grade your accuracy.
                </p>
              </div>
              {!typingGameStarted ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => startTypingGame('term-to-definition')}
                    disabled={!validTypingCards.length}
                  >
                    Term → Definition
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => startTypingGame('definition-to-term')}
                    disabled={!validTypingCards.length}
                  >
                    Definition → Term
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => startTypingGame(typingGameMode)}
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => { setTypingGameStarted(false); setTypingGrade(null); setTypingGradeError(''); document.activeElement?.blur(); }}
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>

            {!validTypingCards.length && (
              <p className="mt-4 text-sm text-neutral-500">
                Add terms and definitions to this set to unlock the typing game.
              </p>
            )}

            {typingGameStarted && validTypingCards.length > 0 && (
              <div className="mt-4 space-y-4">
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-neutral-900 transition-all duration-300"
                      style={{ width: `${(typingGameIndex / typingGameCards.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 whitespace-nowrap">
                    {Math.min(typingGameIndex + 1, typingGameCards.length)} / {typingGameCards.length}
                  </span>
                </div>

                {typingGameDone ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
                    <p className="text-lg font-semibold text-emerald-800">All cards complete! 🎉</p>
                    <p className="mt-1 text-sm text-emerald-700">Great work going through the full set.</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => startTypingGame(typingGameMode)}
                      >
                        Play again
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => startTypingGame(typingGameMode === 'term-to-definition' ? 'definition-to-term' : 'term-to-definition')}
                      >
                        Switch mode
                      </button>
                    </div>
                  </div>
                ) : currentTypingCard ? (
                  <div className="space-y-3">
                    {/* Prompt */}
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                        {typingGameMode === 'term-to-definition' ? 'Term' : 'Definition'}
                      </p>
                      <p className="text-base font-medium text-neutral-900 leading-snug">
                        {typingGameMode === 'term-to-definition'
                          ? currentTypingCard.term
                          : currentTypingCard.definition}
                      </p>
                    </div>

                    {/* Answer input */}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 block mb-1">
                        Your answer ({typingGameMode === 'term-to-definition' ? 'definition' : 'term'})
                      </label>
                      <textarea
                        ref={typingInputRef}
                        className="input resize-none min-h-[80px]"
                        placeholder={`Type the ${typingGameMode === 'term-to-definition' ? 'definition' : 'term'} here…`}
                        value={typingAnswer}
                        onChange={(e) => setTypingAnswer(e.target.value)}
                        onKeyDown={handleTypingKeyDown}
                        disabled={typingSubmitted}
                        rows={3}
                      />
                      <p className="mt-1 text-xs text-neutral-400">Press Enter to submit.</p>
                    </div>

                    {/* Submit / Next */}
                    {!typingSubmitted ? (
                      <button
                        type="button"
                        className="btn-primary w-full sm:w-auto"
                        onClick={submitTypingAnswer}
                        disabled={!typingAnswer.trim() || isGradingTyping}
                      >
                        {isGradingTyping ? 'Grading…' : 'Submit answer'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {/* Correct answer reveal */}
                        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                            Correct answer
                          </p>
                          <p className="text-sm text-neutral-800 leading-snug">
                            {typingGameMode === 'term-to-definition'
                              ? currentTypingCard.definition
                              : currentTypingCard.term}
                          </p>
                        </div>

                        {/* Grade feedback */}
                        {isGradingTyping && (
                          <p className="text-sm text-neutral-500 animate-pulse">Gemini is grading your answer…</p>
                        )}
                        {typingGradeError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {typingGradeError}
                          </div>
                        )}
                        {typingGrade && !isGradingTyping && (
                          <div className={`rounded-xl border px-4 py-4 space-y-3 ${
                            typingGrade.score >= 0.75
                              ? 'border-emerald-200 bg-emerald-50'
                              : typingGrade.score >= 0.4
                              ? 'border-amber-200 bg-amber-50'
                              : 'border-red-200 bg-red-50'
                          }`}>
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className={`text-sm font-semibold ${
                                  typingGrade.score >= 0.75 ? 'text-emerald-800' : typingGrade.score >= 0.4 ? 'text-amber-800' : 'text-red-800'
                                }`}>
                                  {typingGrade.score >= 0.75 ? '✓ Correct' : typingGrade.score >= 0.4 ? '~ Partial' : '✗ Incorrect'}
                                </p>
                                {typingGrade.reason && (
                                  <p className={`text-xs mt-0.5 ${
                                    typingGrade.score >= 0.75 ? 'text-emerald-700' : typingGrade.score >= 0.4 ? 'text-amber-700' : 'text-red-700'
                                  }`}>
                                    {typingGrade.reason}
                                  </p>
                                )}
                              </div>
                              {/* Score circle */}
                              <div className={`flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 ${
                                typingGrade.score >= 0.75 ? 'border-emerald-400 bg-emerald-100' : typingGrade.score >= 0.4 ? 'border-amber-400 bg-amber-100' : 'border-red-400 bg-red-100'
                              }`}>
                                <span className={`text-lg font-bold leading-none ${
                                  typingGrade.score >= 0.75 ? 'text-emerald-800' : typingGrade.score >= 0.4 ? 'text-amber-800' : 'text-red-800'
                                }`}>
                                  {Math.round(typingGrade.score * 100)}
                                </span>
                                <span className={`text-[9px] font-semibold uppercase tracking-wide ${
                                  typingGrade.score >= 0.75 ? 'text-emerald-600' : typingGrade.score >= 0.4 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  / 100
                                </span>
                              </div>
                            </div>
                            {/* Score bar */}
                            <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  typingGrade.score >= 0.75 ? 'bg-emerald-500' : typingGrade.score >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.round(typingGrade.score * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          className="btn-primary w-full sm:w-auto"
                          onClick={nextTypingCard}
                          disabled={isGradingTyping}
                        >
                          {typingGameIndex + 1 >= typingGameCards.length ? 'Finish' : 'Next card →'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-3">
          {cards.length ? (
            <div className="card max-h-[320px] overflow-y-auto p-3 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Quick navigator</p>
              <ul className="space-y-1">
                {cards.map((card, i) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (speechBusy) return;
                        setIndex(i);
                        setFlipped(false);
                      }}
                      className={`w-full truncate rounded-lg px-3 py-2 text-left transition ${
                        i === index ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
                      }`}
                      disabled={speechBusy}
                    >
                      {card.term || '(no term)'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card p-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-900">Need to review later?</p>
            <p className="mt-1">Consider exporting this set or sharing the study link with your group.</p>
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
