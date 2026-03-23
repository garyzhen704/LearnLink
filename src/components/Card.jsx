import { Ellipsis } from 'lucide-react'
import { Menu } from '../base-ui-components/Menu'
import { Button, IconButton } from '../base-ui-components'
import { Link, useNavigate } from 'react-router-dom'
import { formatRelativeDate } from '../lib/utils'

// temporary prop type definitions:
// menuItems = [menuItem];
// menuItem = { label: String, onSelect: () => void, danger?: bool } || {type: 'separator'}

// TODO: link flashcard sets to class and/or source material so we can list what class each
// flashcard & quiz belongs to on the card.

export function Card({ set, menuItems }) {
  const navigate = useNavigate()

  const handleClick = (event) => {
    event.preventDefault()
    console.log('CLICK RUN', event)
    navigate(`/flashcards/${set._id}`)
  }

  return (
    <article
      key={set._id}
      className='card p-4 min-w-[376px] flex flex-col gap-4 cursor-pointer'
      onClick={handleClick}
    >
      <div className='flex justify-between gap-3'>
        <div className='flex flex-col items-start gap-1'>
          <h3 className='text-ds-body font-bold'>
            {set.title || '(untitled set)'}
          </h3>
          {set.description ? (
            <p className='text-ds-body-sm text-ds-text-light line-clamp-2'>
              {set.description}
            </p>
          ) : null}
        </div>
        <div className='flex'>
          <Menu
            align='end'
            trigger={
              <IconButton
                icon={Ellipsis}
                variant='ghost'
                size='md'
                onClick={(event) => event.stopPropagation()}
              />
            }
            items={menuItems}
            onOpenChange={(pressed, eventDetails) => {
              console.log(eventDetails, pressed)
            }}
          />
        </div>
      </div>

      <div className='flex gap-2 items-center text-xs text-neutral-500'>
        {/* Need to make class tag dynamic (DB relationship between class and flashcards) */}
        <span className='inline-flex items-center gap-1 bg-ds-neutral text-ds-text-dark rounded-xl px-2 py-ds-0.5 border border-ds-border'>
          Class
        </span>
        {'·'}
        <span className=''>
          {set.cardsCount ?? set.cards?.length ?? 0} cards
        </span>
        {'·'}
        <span>{formatRelativeDate(set.updatedAt || set.createdAt)}</span>
      </div>
    </article>
  )
}
