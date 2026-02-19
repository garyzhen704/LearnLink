const TRANSCRIPTION_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const DEFAULT_MODEL = 'gpt-4o-mini-transcribe';
const DEFAULT_TIMEOUT_MS = 45_000;

export async function transcribeAudio({
  buffer,
  filename = 'recording.webm',
  mimetype = 'application/octet-stream',
  language,
}) {
  if (!buffer?.length) {
    throw new Error('Audio buffer is required.');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured.');
    error.status = 503;
    throw error;
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || process.env.OPENAI_WHISPER_MODEL || DEFAULT_MODEL;
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const formData = new FormData();
  formData.append('model', model);
  formData.append('file', new Blob([buffer], { type: mimetype }), filename);
  if (typeof language === 'string' && language.trim()) {
    formData.append('language', language.trim().toLowerCase());
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(TRANSCRIPTION_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    const payload = await readJson(response);
    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'Whisper transcription failed.');
      error.status = response.status;
      throw error;
    }

    return typeof payload?.text === 'string' ? payload.text.trim() : '';
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Whisper transcription timed out.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
