import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { http, buildQuery } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import useDebounce from '../hooks/useDebounce.js'
import { Button } from '../base-ui-components/Button.jsx'
import { IconButton } from '../base-ui-components/IconButton.jsx'
import { Menu } from '../base-ui-components/Menu.jsx'
import { Icon } from '../base-ui-components/Icon.jsx'
import { Ellipsis } from 'lucide-react'
import { Card } from '../components/Card.jsx'

export default function DashboardPage() {
  const { username } = useAuth()
  const navigate = useNavigate()
  const [sets, setSets] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const debouncedTerm = useDebounce(searchTerm, 250)
  const searchInputRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [setsRes, quizzesRes] = await Promise.all([
          http('/sets?owner=me&limit=6'),
          http('/quizzes?owner=me&limit=6'),
        ])
        if (!alive) return
        setSets(Array.isArray(setsRes) ? setsRes : [])
        setQuizzes(Array.isArray(quizzesRes) ? quizzesRes : [])
      } catch (err) {
        if (!alive) return
        setError(err.message || 'Failed to load dashboard data.')
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
    let alive = true
    async function search() {
      if (!debouncedTerm.trim()) {
        setSuggestions([])
        return
      }
      try {
        const query = buildQuery({
          owner: 'me',
          limit: 5,
          query: debouncedTerm.trim(),
        })
        const res = await http(`/sets${query}`)
        if (!alive) return
        setSuggestions(Array.isArray(res) ? res : [])
        setSuggestionsOpen(true)
      } catch {
        if (!alive) return
        setSuggestions([])
      }
    }
    search()
    return () => {
      alive = false
    }
  }, [debouncedTerm])

  const welcome = useMemo(() => username || 'Learner', [username])

  useEffect(() => {
    const handler = (event) => {
      if (
        (event.key === 'f' || event.key === 'F') &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const deleteSet = async (id) => {
    if (!window.confirm('Delete this set? This action cannot be undone.')) return
    try {
      await http(`/sets/${id}`, { method: 'DELETE' })
      setSets((prev) => prev.filter((set) => set._id !== id))
    } catch (err) {
      window.alert(err.message || 'Failed to delete set.')
    }
  }

  useEffect(() => {
    if (!suggestionsOpen) return
    const handleClick = (event) => {
      if (!suggestionsRef.current) return
      if (!suggestionsRef.current.contains(event.target)) {
        setSuggestionsOpen(false)
      }
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setSuggestionsOpen(false)
      }
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [suggestionsOpen])

  return (
    <Page
      title={`Welcome back, ${welcome}!`}
      subtitle='Pick up where you left off or start something new.'
      actions={
        <div className='hidden gap-2 md:flex'>
          <Link to='/flashcards/new'>
            <Button variant='outline'>New flashcard set</Button>
          </Link>
          <Link to='/quizzes'>
            <Button>New Quiz</Button>
          </Link>
        </div>
      }
    >
      <section ref={suggestionsRef} className='card mb-6 p-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-1 items-center gap-3'>
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder='Search your sets'
              className='input md:w-96'
            />
            {debouncedTerm && loading && <LoadingSpinner label='Searching' />}
          </div>
          <div className='text-xs text-neutral-500'>
            Tip: Press <span className='tag'>F</span> to focus the search bar.
          </div>
        </div>
        {suggestionsOpen && suggestions.length > 0 ? (
          <ul className='mt-3 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200'>
            {suggestions.map((set) => (
              <li key={set._id}>
                <button
                  type='button'
                  onClick={() => {
                    navigate(`/flashcards/${set._id}`)
                    setSuggestionsOpen(false)
                    setSearchTerm('')
                  }}
                  className='flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-neutral-50'
                >
                  <span className='font-medium text-neutral-900'>
                    {set.title || '(untitled set)'}
                  </span>
                  <span className='text-xs text-neutral-500'>
                    {set.cardsCount ?? set.cards?.length ?? 0} cards
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {error ? (
        <StatusMessage tone='error' className='mb-6'>
          {error}
        </StatusMessage>
      ) : null}

      {loading ? (
        <div className='space-y-3'>
          {[0, 1, 2].map((item) => (
            <div key={item} className='card h-24 animate-pulse bg-neutral-100' />
          ))}
        </div>
      ) : (
        <div className='grid gap-6 lg:grid-cols-2'>
          <Section
            title='Recent flashcard sets'
            emptyLabel='No sets yet. Create your first one!'
            items={sets}
            renderItem={(set) => (
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
                      deleteSet(set._id)
                    },
                    danger: true,
                  },
                ]}
              />
            )}
          />

          <Section
            title='Recent quizzes'
            emptyLabel='No quizzes yet. Plan your next assessment.'
            items={quizzes}
            renderItem={(quiz) => <Card key={quiz._id} set={quiz} />}
          />
        </div>
      )}
    </Page>
  )
}

function Section({ title, items, emptyLabel, renderItem }) {
  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-neutral-500'>
          {title}
        </h2>
      </div>
      {items?.length ? (
        <div className='space-y-3'>{items.map(renderItem)}</div>
      ) : (
        <div className='card p-5 text-sm text-neutral-600'>{emptyLabel}</div>
      )}
    </section>
  )
}
