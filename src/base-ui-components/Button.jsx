import { Button as BaseButton } from '@base-ui/react/button'

const variantClasses = {
  filled: [
    'bg-ds-primary text-ds-primary-fg',
    'hover:bg-ds-primary-hover',
    'active:bg-ds-primary-pressed',
    'data-[disabled]:bg-ds-disabled data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
  ].join(' '),
  outline: [
    'border border-ds-border bg-transparent text-ds-foreground',
    'hover:border-ds-border-hover hover:bg-ds-neutral/30',
    'active:bg-ds-neutral/50',
    'data-[disabled]:border-ds-disabled data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-ds-foreground',
    'hover:bg-ds-neutral/40',
    'active:bg-ds-neutral/60',
    'data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
  ].join(' '),
  danger: [
    'bg-ds-danger text-ds-danger-fg',
    'hover:bg-ds-danger-hover',
    'active:bg-ds-danger-pressed',
    'data-[disabled]:bg-ds-disabled data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses = {
  sm: 'h-ds-8 px-ds-3 gap-ds-1.5 text-ds-body-sm',
  md: 'h-ds-9 px-ds-4 gap-ds-2 text-ds-body-sm',
  lg: 'h-ds-10 px-ds-5 gap-ds-2 text-ds-body',
}

function Spinner() {
  return (
    <svg
      className="animate-spin size-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function Button({
  variant = 'filled',
  size = 'md',
  loading = false,
  iconLeading,
  iconTrailing,
  children,
  className = '',
  disabled,
  ...props
}) {
  const iconSize = size === 'lg' ? 'size-5' : 'size-4'

  return (
    <BaseButton
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-ds-md font-satoshi font-medium transition-colors duration-150 select-none',
        variantClasses[variant] ?? variantClasses.filled,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Loading…</span>
        </>
      ) : (
        <>
          {iconLeading && <span className={`shrink-0 ${iconSize}`}>{iconLeading}</span>}
          {children}
          {iconTrailing && <span className={`shrink-0 ${iconSize}`}>{iconTrailing}</span>}
        </>
      )}
    </BaseButton>
  )
}
