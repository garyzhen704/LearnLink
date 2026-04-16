import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path
        d="M1 4L3.5 6.5L9 1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="10" height="2" viewBox="0 0 10 2" fill="none" aria-hidden="true">
      <path
        d="M1 1H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Checkbox({
  label,
  indeterminate,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  className = '',
}) {
  return (
    <label className={`inline-flex items-center gap-ds-2 font-satoshi cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <BaseCheckbox.Root
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        indeterminate={indeterminate}
        disabled={disabled}
        className={[
          'size-ds-4 rounded-ds-xs border flex items-center justify-center shrink-0',
          'transition-colors duration-150 outline-none',
          'data-[checked]:bg-ds-primary data-[checked]:border-ds-primary data-[checked]:text-ds-primary-fg',
          'data-[indeterminate]:bg-ds-primary data-[indeterminate]:border-ds-primary data-[indeterminate]:text-ds-primary-fg',
          'border-ds-input-border bg-ds-background',
          'focus-visible:ring-2 focus-visible:ring-ds-border-focus/30',
          disabled ? 'bg-ds-disabled border-ds-disabled cursor-not-allowed' : '',
        ].join(' ')}
      >
        <BaseCheckbox.Indicator
          keepMounted
          className="flex items-center justify-center text-current"
        >
          {indeterminate ? <DashIcon /> : <CheckIcon />}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label && (
        <span className="text-ds-body-sm text-ds-foreground select-none">{label}</span>
      )}
    </label>
  )
}
