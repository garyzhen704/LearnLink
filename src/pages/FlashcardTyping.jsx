import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Page from '../components/Page.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { Button } from '../base-ui-components';
import { http } from '../lib/api.js';

export default function FlashcardTypingPage() {
  const { id } = useParams();
  const [setData, setSetData] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState('term-to-definition');
  const [gameIndex, setGameIndex] = useState(0);
  const [gameCards, setGameCards] = useState([]);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [grade, setGrade] = useState(null);
  const [gradeError, setGradeError] = useState('');
  const inputRef = useRef(null);

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

  const validCards = useMemo(
    () => cards.filter((c) => c.term?.trim() && c.definition?.trim()),
    [cards],
  );

  const currentCard = started ? gameCards[gameIndex] ?? null : null;
  const gameDone = started && gameIndex >= gameCards.length;

  const startGame = useCallback(
    (nextMode) => {
      const shuffled = shuffleArray(validCards);
      setGameCards(shuffled);
      setMode(nextMode);
      setGameIndex(0);
      setAnswer('');
      setSubmitted(false);
      setGrade(null);
      setGradeError('');
      setStarted(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [validCards],
  );

  const submitAnswer = useCallback(async () => {
    if (!currentCard || !answer.trim() || isGrading) return;
    const isTermToDefinition = mode === 'term-to-definition';
    const prompt = isTermToDefinition ? currentCard.term : currentCard.definition;
    const expected = isTermToDefinition ? currentCard.definition : currentCard.term;

    setIsGrading(true);
    setGradeError('');
    setSubmitted(true);

    try {
      const response = await http('/ai/grade-flashcard', {
        method: 'POST',
        body: JSON.stringify({
          term: prompt,
          expectedDefinition: expected,
          transcript: answer.trim(),
        }),
      });
      setGrade({
        correct: Boolean(response?.correct),
        score: Number(response?.score) || 0,
        reason: String(response?.reason || '').trim(),
      });
    } catch (err) {
      setGradeError(err.message || 'Failed to grade answer.');
      setGrade(null);
    } finally {
      setIsGrading(false);
    }
  }, [currentCard, answer, mode, isGrading]);

  const nextCard = useCallback(() => {
    setGameIndex((prev) => prev + 1);
    setAnswer('');
    setSubmitted(false);
    setGrade(null);
    setGradeError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !submitted) {
        e.preventDefault();
        submitAnswer();
      }
    },
    [submitted, submitAnswer],
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
      <Page title="Typing practice" subtitle="">
        <StatusMessage tone="error">{error}</StatusMessage>
        <Link to={`/flashcards/${id}`} className="btn-outline mt-4 inline-flex">
          Back to set
        </Link>
      </Page>
    );
  }

  return (
    <Page
      title={setData?.title ? `Typing practice — ${setData.title}` : 'Typing practice'}
      subtitle="Type the answer from memory. Gemini will grade your accuracy."
      actions={
        <Link to={`/flashcards/${id}`} className="inline-flex">
          <Button variant="outline" iconLeading={<ArrowLeft size={16} />}>Back to set</Button>
        </Link>
      }
    >
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-semibold text-neutral-900">Typing game</p>
            <p className="text-sm text-neutral-500">
              {started
                ? `Mode: ${mode === 'term-to-definition' ? 'Term → Definition' : 'Definition → Term'}`
                : 'Choose a mode to start.'}
            </p>
          </div>
          {!started ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-outline"
                onClick={() => startGame('term-to-definition')}
                disabled={!validCards.length}
              >
                Term → Definition
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => startGame('definition-to-term')}
                disabled={!validCards.length}
              >
                Definition → Term
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => startGame(mode)}
              >
                Restart
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setStarted(false);
                  setGrade(null);
                  setGradeError('');
                  document.activeElement?.blur();
                }}
              >
                Exit
              </button>
            </div>
          )}
        </div>

        {!validCards.length ? (
          <p className="mt-4 text-sm text-neutral-500">
            Add terms and definitions to this set to unlock the typing game.
          </p>
        ) : null}

        {started && validCards.length > 0 ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-neutral-900 transition-all duration-300"
                  style={{ width: `${(gameIndex / gameCards.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 whitespace-nowrap">
                {Math.min(gameIndex + 1, gameCards.length)} / {gameCards.length}
              </span>
            </div>

            {gameDone ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
                <p className="text-lg font-semibold text-emerald-800">All cards complete!</p>
                <p className="mt-1 text-sm text-emerald-700">Great work going through the full set.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => startGame(mode)}
                  >
                    Play again
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => startGame(mode === 'term-to-definition' ? 'definition-to-term' : 'term-to-definition')}
                  >
                    Switch mode
                  </button>
                </div>
              </div>
            ) : currentCard ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                    {mode === 'term-to-definition' ? 'Term' : 'Definition'}
                  </p>
                  <p className="text-base font-medium text-neutral-900 leading-snug">
                    {mode === 'term-to-definition' ? currentCard.term : currentCard.definition}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 block mb-1">
                    Your answer ({mode === 'term-to-definition' ? 'definition' : 'term'})
                  </label>
                  <textarea
                    ref={inputRef}
                    className="input resize-none min-h-[80px]"
                    placeholder={`Type the ${mode === 'term-to-definition' ? 'definition' : 'term'} here…`}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitted}
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-neutral-400">Press Enter to submit.</p>
                </div>

                {!submitted ? (
                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto"
                    onClick={submitAnswer}
                    disabled={!answer.trim() || isGrading}
                  >
                    {isGrading ? 'Grading…' : 'Submit answer'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                        Correct answer
                      </p>
                      <p className="text-sm text-neutral-800 leading-snug">
                        {mode === 'term-to-definition' ? currentCard.definition : currentCard.term}
                      </p>
                    </div>

                    {isGrading ? (
                      <p className="text-sm text-neutral-500 animate-pulse">Gemini is grading your answer…</p>
                    ) : null}
                    {gradeError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {gradeError}
                      </div>
                    ) : null}
                    {grade && !isGrading ? (
                      <div
                        className={`rounded-xl border px-4 py-4 space-y-3 ${
                          grade.score >= 0.75
                            ? 'border-emerald-200 bg-emerald-50'
                            : grade.score >= 0.4
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                grade.score >= 0.75
                                  ? 'text-emerald-800'
                                  : grade.score >= 0.4
                                  ? 'text-amber-800'
                                  : 'text-red-800'
                              }`}
                            >
                              {grade.score >= 0.75
                                ? 'Correct'
                                : grade.score >= 0.4
                                ? 'Partial'
                                : 'Incorrect'}
                            </p>
                            {grade.reason ? (
                              <p
                                className={`text-xs mt-0.5 ${
                                  grade.score >= 0.75
                                    ? 'text-emerald-700'
                                    : grade.score >= 0.4
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {grade.reason}
                              </p>
                            ) : null}
                          </div>
                          <div
                            className={`flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 ${
                              grade.score >= 0.75
                                ? 'border-emerald-400 bg-emerald-100'
                                : grade.score >= 0.4
                                ? 'border-amber-400 bg-amber-100'
                                : 'border-red-400 bg-red-100'
                            }`}
                          >
                            <span
                              className={`text-lg font-bold leading-none ${
                                grade.score >= 0.75
                                  ? 'text-emerald-800'
                                  : grade.score >= 0.4
                                  ? 'text-amber-800'
                                  : 'text-red-800'
                              }`}
                            >
                              {Math.round(grade.score * 100)}
                            </span>
                            <span
                              className={`text-[9px] font-semibold uppercase tracking-wide ${
                                grade.score >= 0.75
                                  ? 'text-emerald-600'
                                  : grade.score >= 0.4
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              / 100
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              grade.score >= 0.75
                                ? 'bg-emerald-500'
                                : grade.score >= 0.4
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.round(grade.score * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="btn-primary w-full sm:w-auto"
                      onClick={nextCard}
                      disabled={isGrading}
                    >
                      {gameIndex + 1 >= gameCards.length ? 'Finish' : 'Next card →'}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
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
