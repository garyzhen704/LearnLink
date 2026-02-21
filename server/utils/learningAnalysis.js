import { GoogleGenAI } from '@google/genai';

const MAX_TEXT_LENGTH = 60000;

let cachedClient;
let cachedKey = '';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedKey = apiKey;
  }
  return cachedClient;
}

async function runGemini(instruction, text, { temperature = 0.3, maxTokens = 800, responseMimeType } = {}) {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const normalized = (text || '').replace(/\r\n?/g, '\n').trim().slice(0, MAX_TEXT_LENGTH);

    // Combine instruction and content
    const prompt = normalized
      ? `${instruction}\n\nContent:\n${normalized}`
      : instruction;

    const config = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }

    // Correct SDK call structure
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config,
    });

    // Response text is a property
    return typeof response.text === 'string' ? response.text.trim() : null;
  } catch (error) {
    console.warn('Gemini request failed', error);
    return null;
  }
}

export async function summarizeMaterialText(title, text) {
  const sourceText = (text || '').trim();
  if (!sourceText) return 'Summary unavailable.';

  const summary = await runGemini(
    `You are a helpful study assistant. Summarize the following learning material titled "${title}" using 3-5 bullet points, followed by a short paragraph (max 120 words). Keep the language concise and student-friendly.`,
    sourceText,
    { temperature: 0.2, maxTokens: 512 },
  );

  if (summary) return summary;
  return fallbackSummary(sourceText);
}

export async function createFlashcardsFromText(text, count = 6) {
  const requested = Math.min(Math.max(Number(count) || 6, 3), 12);
  const sourceText = (text || '').trim();
  if (!sourceText) return fallbackFlashcards(sourceText, requested);

  const response = await runGemini(
    `Create ${requested} unique flashcards from the provided learning material. Reply strictly as JSON array. Each item should have "term" and "definition" fields with concise strings.`,
    sourceText,
    { temperature: 0.3, maxTokens: 900, responseMimeType: 'application/json' },
  );

  const parsed = safeParseJsonArray(response)
    ?.map((card) => ({
      term: String(card.term || card.front || '').trim().slice(0, 140),
      definition: String(card.definition || card.back || '').trim().slice(0, 300),
    }))
    .filter((card) => card.term && card.definition)
    .slice(0, requested);

  if (parsed && parsed.length) return parsed;
  return fallbackFlashcards(sourceText, requested);
}

export async function createFlashcardsFromTopic(topic, count = 5) {
  const requested = Math.min(Math.max(Number(count) || 5, 3), 20);
  const topicText = (topic || '').trim();
  if (!topicText) return fallbackFlashcards('', requested);

  const response = await runGemini(
    `Create ${requested} study flashcards for the topic "${topicText}". Reply strictly as JSON array. Each item should have "term", "definition", and "example" fields with concise strings.`,
    '',
    { temperature: 0.3, maxTokens: 900, responseMimeType: 'application/json' },
  );

  const parsed = safeParseJsonArray(response)
    ?.map((card) => ({
      term: String(card.term || card.front || '').trim().slice(0, 140),
      definition: String(card.definition || card.back || '').trim().slice(0, 300),
      example: String(card.example || '').trim().slice(0, 200),
    }))
    .filter((card) => card.term && card.definition)
    .slice(0, requested);

  if (parsed && parsed.length) return parsed;
  return fallbackFlashcards(topicText, requested);
}

export async function createQuizFromText(text, count = 5) {
  const requested = Math.min(Math.max(Number(count) || 5, 3), 10);
  const sourceText = (text || '').trim();
  if (!sourceText) return fallbackQuiz(sourceText, requested);

  const response = await runGemini(
    `Generate ${requested} multiple-choice questions from the provided material. Return JSON array with each item containing "question" (string), "options" (array of exactly 4 concise strings), and "correct" (one of the options).`,
    sourceText,
    { temperature: 0.3, maxTokens: 900, responseMimeType: 'application/json' },
  );

  const parsed = safeParseJsonArray(response)
    ?.map((question) => {
      const rawOptions = Array.isArray(question.options) ? question.options : [];
      const options = rawOptions.map((option) => String(option || '').trim()).filter(Boolean).slice(0, 6);
      const correct = String(question.correct || '').trim();
      if (options.length < 2 || !options.includes(correct)) return null;
      return {
        question: String(question.question || '').trim().slice(0, 220),
        options,
        correct,
      };
    })
    .filter(Boolean)
    .slice(0, requested);

  if (parsed && parsed.length) return parsed;
  return fallbackQuiz(sourceText, requested);
}

export async function gradeFlashcardDefinition({
  term,
  expectedDefinition,
  transcript,
}) {
  const expected = String(expectedDefinition || '').trim();
  const spoken = String(transcript || '').trim();

  if (!expected || !spoken) {
    return {
      score: 0,
      reason: 'Missing expected definition or spoken answer.',
    };
  }

  const response = await runGemini(
    [
      'You grade spoken flashcard answers.',
      'Compare the spoken answer against the expected definition with semantic meaning as the main criterion.',
      'Allow paraphrasing and minor wording differences.',
      'Return strict JSON object with keys: score (number 0..1), reason (string, max 140 chars).',
      'Do not include markdown or extra keys.',
    ].join(' '),
    JSON.stringify({
      term: String(term || '').trim(),
      expectedDefinition: expected,
      spokenAnswer: spoken,
    }),
    { temperature: 0.1, maxTokens: 220, responseMimeType: 'application/json' },
  );

  const parsed = safeParseJsonObject(response);
  const parsedScore = clampUnit(parsed?.score);
  const parsedReason = String(parsed?.reason || '').trim().slice(0, 140);

  if (Number.isFinite(parsedScore)) {
    return {
      score: parsedScore,
      reason: parsedReason || fallbackReason(parsedScore),
    };
  }

  const fallbackScore = fallbackDefinitionScore(expected, spoken);
  return {
    score: fallbackScore,
    reason: fallbackReason(fallbackScore),
  };
}

export function buildDerivedTitle(originalName, suffix) {
  const base = String(originalName || '').replace(/\.[^.]+$/, '').trim();
  if (!base) return suffix;
  return `${base} ${suffix}`.trim();
}

function fallbackSummary(text) {
  const paragraphs = text.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const taken = paragraphs.slice(0, 3);
  if (!taken.length) return 'Summary unavailable.';
  return taken.join('\n\n').slice(0, 1200);
}

function fallbackFlashcards(text, count) {
  const sentences = extractSentences(text);
  if (!sentences.length) {
    return Array.from({ length: count }, (_, index) => ({
      term: `Key concept ${index + 1}`,
      definition: 'No extracted detail available.',
    }));
  }

  return sentences.slice(0, count).map((sentence, index) => ({
    term: buildTermFromSentence(sentence, index),
    definition: sentence.trim(),
  }));
}

function fallbackQuiz(text, count) {
  const sentences = extractSentences(text);
  if (!sentences.length) {
    return [
      {
        question: 'True or False: Review the uploaded material to learn more.',
        options: ['True', 'False'],
        correct: 'True',
      },
    ];
  }

  return sentences.slice(0, count).map((sentence) => ({
    question: `True or False: ${sentence.trim()}`,
    options: ['True', 'False'],
    correct: 'True',
  }));
}

function extractSentences(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40);
}

function buildTermFromSentence(sentence, index) {
  const cleaned = sentence.replace(/[.!?]/g, '');
  const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
  return words || `Concept ${index + 1}`;
}

function safeParseJsonArray(payload) {
  if (!payload) return null;
  try {
    const trimmed = payload.trim();
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Failed to parse JSON array from model output', error);
    return null;
  }
}

function safeParseJsonObject(payload) {
  if (!payload) return null;
  try {
    const trimmed = payload.trim();
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Failed to parse JSON object from model output', error);
    return null;
  }
}

function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return Number.NaN;
  return Math.min(1, Math.max(0, Number(number.toFixed(2))));
}

function fallbackDefinitionScore(expected, spoken) {
  const expectedTokens = tokenizeMeaningful(expected);
  const spokenTokens = tokenizeMeaningful(spoken);
  if (!expectedTokens.length || !spokenTokens.length) return 0;

  const spokenSet = new Set(spokenTokens);
  const common = expectedTokens.filter((token) => spokenSet.has(token)).length;
  const recall = common / expectedTokens.length;
  const precision = common / spokenTokens.length;
  const f1 = recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0;

  return Math.min(1, Math.max(0, Number(f1.toFixed(2))));
}

function tokenizeMeaningful(input) {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in',
    'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'with',
  ]);

  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function fallbackReason(score) {
  if (score >= 0.85) return 'Strong semantic match.';
  if (score >= 0.7) return 'Mostly correct, but missing some key detail.';
  if (score >= 0.45) return 'Partially correct, but core meaning is incomplete.';
  return 'Answer does not match the expected definition closely enough.';
}
