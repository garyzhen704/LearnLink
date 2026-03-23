import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Page from '../components/Page.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { http } from '../lib/api.js'
import useDebounce from '../hooks/useDebounce.js'
import { Card } from '../components/Card.jsx'

export default function FlashcardsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debounced = useDebounce(searchTerm, 200)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await http('/sets?owner=me&limit=200')
        if (!alive) return
        setSets(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!alive) return
        setError(err.message || 'Failed to load flashcard sets.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const cloneId = searchParams.get('clone')
    if (cloneId) {
      navigate(`/flashcards/new?clone=${cloneId}`, { replace: true })
    }
  }, [searchParams, navigate])

  const filteredSets = useMemo(() => {
    const term = debounced.trim().toLowerCase()
    if (!term) return sets
    return sets.filter((set) =>
      [set.title, set.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    )
  }, [sets, debounced])

  const removeSet = async (id) => {
    if (!window.confirm('Delete this set?')) return
    try {
      await http(`/sets/${id}`, { method: 'DELETE' })
      setSets((prev) => prev.filter((set) => set._id !== id))
    } catch (err) {
      window.alert(err.message || 'Failed to delete set')
    }
  }

  return (
    <Page
      title='Flashcard sets'
      subtitle='Create, browse, and manage your study decks'
      actions={
        <Link to='/flashcards/new' className='btn-primary'>
          New set
        </Link>
      }
    >
      <div className='card mb-6 flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between'>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder='Search by title or description'
          className='input md:w-80'
        />
        <div className='text-xs text-neutral-500'>
          Showing {filteredSets.length} of {sets.length} sets
        </div>
      </div>

      {error ? (
        <StatusMessage tone='error' className='mb-6'>
          {error}
        </StatusMessage>
      ) : null}

      {loading ? (
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='card h-28 animate-pulse bg-neutral-100' />
          ))}
        </div>
      ) : filteredSets.length === 0 ? (
        <StatusMessage tone='info'>
          No sets match your search. Try a different keyword.
        </StatusMessage>
      ) : (
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {filteredSets.map((set) => (
            <Card
              key={set._id}
              set={set}
              menuItems={[
                {
                  label: 'Duplicate',
                  onSelect: (event) => {
                    event.stopPropagation()
                    navigate(`/flashcards/new?clone=${set._id}`)
                  },
                },
                {
                  label: 'Delete',
                  onSelect: (event) => {
                    event.stopPropagation()
                    removeSet(set._id)
                  },
                  danger: true,
                },
              ]}
            />
          ))}
        </div>
      )}
    </Page>
  )
}
