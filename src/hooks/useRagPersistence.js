import { useCallback, useEffect, useState } from 'react'

const DRAFTS_KEY = 'learnlink_rag_question_drafts_v1'
const ANSWERS_KEY = 'learnlink_rag_answer_cache_v1'

export function useRagPersistence() {
  const [state, setState] = useState(() => ({
    drafts: storageJSON(DRAFTS_KEY),
    answers: storageJSON(ANSWERS_KEY),
  }))

  useEffect(() => {
    storageJSON(DRAFTS_KEY, state.drafts)
  }, [state.drafts])

  useEffect(() => {
    storageJSON(ANSWERS_KEY, state.answers)
  }, [state.answers])

  const getMaterialRagState = useCallback((materialId) => {
    if (!materialId) return { question: '', answer: '', sources: [] }
    const cached = state.answers[materialId]
    return {
      question: state.drafts[materialId] || '',
      answer: cached?.answer || '',
      sources: Array.isArray(cached?.sources) ? cached.sources : [],
    }
  }, [state.answers, state.drafts])

  const setQuestionDraft = useCallback((materialId, question) => {
    if (!materialId) return
    setState((prev) => ({ ...prev, drafts: { ...prev.drafts, [materialId]: question } }))
  }, [])

  const setAnswerForMaterial = useCallback((materialId, answer, sources) => {
    if (!materialId) return
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [materialId]: { answer: answer || '', sources: Array.isArray(sources) ? sources : [] } },
    }))
  }, [])

  const removeRagState = useCallback((materialIdsOrId) => {
    const ids = Array.isArray(materialIdsOrId)
      ? materialIdsOrId.filter(Boolean)
      : materialIdsOrId
        ? [materialIdsOrId]
        : []
    if (ids.length === 0) return

    setState((prev) => {
      const drafts = { ...prev.drafts }
      const answers = { ...prev.answers }
      ids.forEach((id) => {
        delete drafts[id]
        delete answers[id]
      })
      return { ...prev, drafts, answers }
    })
  }, [])

  return { getMaterialRagState, setQuestionDraft, setAnswerForMaterial, removeRagState }
}

function storageJSON(key, value) {
  try {
    if (value === undefined) {
      const stored = localStorage.getItem(key)
      const parsed = stored ? JSON.parse(stored) : {}
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    }
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`RAG persistence failed for ${key}:`, error)
    return value === undefined ? {} : undefined
  }
}
