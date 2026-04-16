import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  HomeIcon,
  CardsIcon,
  BookIcon,
  SparklesIcon,
  ClipboardIcon,
  ShieldIcon,
  LogoutIcon,
  ChevronIcon,
  LinkIcon,
} from './Icons.jsx'
import {
  House,
  Layers,
  LibraryBig,
  WandSparkles,
  ClipboardList,
  LogOut,
  ArrowRightFromLine,
  ArrowLeftFromLine,
} from 'lucide-react'
import { Button } from '../base-ui-components/Button.jsx'
import { Icon } from '../base-ui-components/Icon.jsx'
import { IconButton } from '../base-ui-components/IconButton.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: House },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/materials', label: 'Learning Materials', icon: LibraryBig },
  { to: '/ai-flashcards', label: 'AI Flashcards', icon: WandSparkles },
  { to: '/quizzes', label: 'Quizzes', icon: ClipboardList },
]

export default function Sidebar({ className = '', isOpen, onToggle }) {
  const { role, logout, username } = useAuth()
  const navigate = useNavigate()

  const items =
    role === 'admin'
      ? [...NAV_ITEMS, { to: '/admin', label: 'Admin', icon: ShieldIcon }]
      : NAV_ITEMS

  const handleLogout = () => {
    logout()
    navigate('/auth', { replace: true })
  }

  return (
    <aside className={`sidebar ${isOpen ? 'w-60' : 'w-16'} ${className}`}>
      <div className='flex h-full flex-col'>
        <SidebarHeader>
          {isOpen && <LogoButton text={'Learn Link'} />}
          <ToggleButton isOpen={isOpen} onToggle={onToggle} />
        </SidebarHeader>

        <SidebarContent>
          {items.map((item) => (
            <NavListItem item={item} key={item.to} showLabel={isOpen} />
          ))}
        </SidebarContent>

        <SidebarFooter>
          <LogoutButton
            isOpen={isOpen}
            handleLogout={handleLogout}
            username={username}
          />
        </SidebarFooter>
      </div>
    </aside>
  )
}

// Sidebar Components
function SidebarHeader({ children }) {
  return (
    <div className='h-16 flex justify-between items-center gap-3 p-3 border-b border-neutral-200'>
      {children}
    </div>
  )
}

function SidebarContent({ children }) {
  return (
    <nav className='pt-4 flex-1 px-3'>
      <ul className='space-y-3'>{children}</ul>
    </nav>
  )
}

function SidebarFooter({ children }) {
  return <div className='border-t border-neutral-200 px-3 py-4'>{children}</div>
}

// Navigation List Button Component
function NavListItem({ item, showLabel }) {
  return (
    <li
      className={`flex cursor-pointer ${showLabel ? 'w-full' : 'w-9'} transition-all`}
    >
      <NavLink
        to={item.to}
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      >
        <Icon variant='outline' icon={item.icon} size='md' className={'w-5'} />
        {showLabel && <span className='text-nowrap'>{item.label}</span>}
      </NavLink>
    </li>
  )
}

// This component is not needed.
function LogoButton({ text }) {
  return (
    <div className='flex h-9 px-2 gap-3 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-neutral-900'>
      <LinkIcon className='w-5 h-5' />
      {text}
    </div>
  )
}

function LogoutButton({ isOpen, username, handleLogout }) {
  return (
    <div className={`${isOpen ? 'w-full' : 'w-9'}`}>
      {isOpen && (
        <div className='text-xs text-neutral-500 text-nowrap pb-2'>
          Signed in as{' '}
          <span className='font-medium text-neutral-900'>
            {username || 'User'}
          </span>
        </div>
      )}
      <button
        type='button'
        onClick={handleLogout}
        className='nav-link border border-ds-border bg-transparent'
      >
        <Icon icon={LogOut} variant='default' className={'w-5'} />
        {isOpen && <span>Logout</span>}
      </button>
    </div>
  )
}

function ToggleButton({ isOpen, onToggle }) {
  return (
    <IconButton
      icon={ArrowRightFromLine}
      variant='ghost'
      onClick={onToggle}
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
      }}
    />
  )
}
