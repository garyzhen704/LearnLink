import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createFlashcardsFromTopic, gradeFlashcardDefinition } from '../utils/learningAnalysis.js';

const router = express.Router();

router.use(requireAuth);

router.post('/flashcards', async (req, res) => {
  try {
    const { topic, count = 5 } = req.body || {};
    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'Topic is required.' });
    }

    const cards = await createFlashcardsFromTopic(topic, count);
    const formatted = cards.map((card, index) => ({
      id: index,
      term: card.term,
      definition: card.definition,
      example: card.example,
    }));
    res.json({ cards: formatted });
  } catch (error) {
    console.error('AI flashcards error', error);
    res.status(500).json({ message: 'Failed to generate flashcards.' });
  }
});

router.post('/grade-flashcard', async (req, res) => {
  try {
    const {
      term = '',
      expectedDefinition = '',
      transcript = '',
      threshold = 0.75,
    } = req.body || {};

    if (!String(expectedDefinition).trim()) {
      return res.status(400).json({ message: 'expectedDefinition is required.' });
    }

    if (!String(transcript).trim()) {
      return res.status(400).json({ message: 'transcript is required.' });
    }

    const grading = await gradeFlashcardDefinition({
      term,
      expectedDefinition,
      transcript,
    });

    const safeThreshold = Math.min(0.95, Math.max(0.5, Number(threshold) || 0.75));
    const score = Number(grading.score) || 0;
    const correct = score >= safeThreshold;

    return res.json({
      correct,
      score,
      threshold: safeThreshold,
      reason: grading.reason || '',
    });
  } catch (error) {
    console.error('AI grade flashcard error', error);
    return res.status(500).json({ message: 'Failed to grade flashcard answer.' });
  }
});

export default router;
