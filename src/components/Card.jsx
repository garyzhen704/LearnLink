import { Ellipsis } from 'lucide-react'
import { Menu } from '../base-ui-components/Menu'
import { Button, IconButton } from '../base-ui-components'
import { Link, useNavigate } from 'react-router-dom'
import { formatRelativeDate } from '../lib/utils'
import GeneratedFromBadges from './GeneratedFromBadges.jsx'

// temporary prop type definitions:
// menuItems = [menuItem];
// menuItem = { label: String, onSelect: () => void, danger?: bool } || {type: 'separator'}

export function Card({ set, menuItems }) {
  const navigate = useNavigate()

  const handleClick = (event) => {
    event.preventDefault()
    const dest = set.questions
      ? `/quizzes/${set._id}/play`
      : `/flashcards/${set._id}`
    navigate(dest)
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
              {set.sourceMaterial ? `AI generated from ` : set.description}
              {/* Make source material clickable. (Need to stop propagation to prevent navigating to clicked Card.) */}
              <span className='underline'>{set.sourceMaterialName}</span>
            </p>
          ) : null}
          {/* <GeneratedFromBadges item={set} className='pt-1' /> */}
        </div>
        <div className='flex'>
          {menuItems && (
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
          )}
        </div>
      </div>

      <div className='flex gap-2 items-center text-xs text-neutral-500 h-[22px]'>
        {set.sourceClassName && (
          <>
            {/* Inline styles for class color (with 15% opacity) to be applied to the background */}
            <span
              style={
                {
                  // backgroundColor: `${set.sourceClassColor}15`,
                  // borderColor: set.sourceClassColor
                }
              }
              className='inline-flex items-center gap-1.5 bg-ds-neutral text-ds-text-dark rounded-xl px-2 py-ds-0.5 border border-ds-border'
            >
              <span
                className='h-2 w-2 rounded-full'
                style={{ backgroundColor: set.sourceClassColor }}
                aria-hidden='true'
              />
              {set.sourceClassName}
            </span>
            {'·'}
          </>
        )}

        <span className=''>
          {set.cardsCount ?? set.cards?.length ?? set.questions?.length ?? 0}{' '}
          {set.questions ? 'questions' : 'cards'}
        </span>
        {'·'}
        <span>{formatRelativeDate(set.updatedAt || set.createdAt)}</span>
      </div>
    </article>
  )
}
