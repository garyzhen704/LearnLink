import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { transcribeAudio } from '../utils/whisperutil.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isAllowedAudio(file)) {
      return cb(null, true);
    }
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'audio'));
  },
});

router.use(requireAuth);

router.post('/transcribe', (req, res) => {
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: extractUploadError(err) });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required.' });
    }

    try {
      const transcript = await transcribeAudio({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        language: req.body?.language,
      });

      if (!transcript) {
        return res.status(422).json({ message: 'No speech detected in the audio.' });
      }

      return res.json({ transcript });
    } catch (error) {
      console.error('Audio transcription error', error);
      const status = Number(error?.status) || 500;
      return res.status(status).json({ message: error.message || 'Failed to transcribe audio.' });
    }
  });
});

function extractUploadError(error) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return 'Audio file is too large. Maximum size is 25MB.';
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return 'Unsupported file type. Please upload an audio file.';
  }
  return error.message || 'Upload failed.';
}

function isAllowedAudio(file) {
  if (!file) return false;
  if (typeof file.mimetype === 'string' && file.mimetype.startsWith('audio/')) return true;

  const lowerName = String(file.originalname || '').toLowerCase();
  return ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.mp4', '.mpeg'].some((ext) => lowerName.endsWith(ext));
}

export default router;
