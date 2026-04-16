import { Select as BaseSelect } from '@base-ui/react/select'

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 4L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M1 5L4.5 8.5L11 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Select({
  label,
  placeholder = 'Select…',
  options = [],
  value,
  defaultValue,
  onValueChange,
  disabled,
  id,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-ds-1.5 font-satoshi ${className}`}>
      {label && (
        <label htmlFor={id} className="text-ds-label text-ds-foreground">
          {label}
        </label>
      )}
      <BaseSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <BaseSelect.Trigger
          id={id}
          className={[
            'inline-flex h-ds-9 w-full items-center justify-between rounded-ds-md border px-ds-3',
            'text-ds-body-sm text-ds-foreground bg-ds-background',
            'transition-colors duration-150 outline-none cursor-pointer',
            'border-ds-input-border hover:border-ds-border-hover',
            'focus:border-ds-border-focus focus:ring-2 focus:ring-ds-border-focus/20',
            disabled ? 'bg-ds-disabled text-ds-disabled-fg cursor-not-allowed border-ds-disabled' : '',
          ].join(' ')}
        >
          <BaseSelect.Value placeholder={<span className="text-ds-foreground-muted">{placeholder}</span>} />
          <BaseSelect.Icon className="text-ds-foreground-muted">
            <ChevronDown />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4}>
            <BaseSelect.Popup
              className={[
                'min-w-[var(--trigger-width)] rounded-ds-md border border-ds-border bg-ds-background shadow-lg',
                'py-ds-1.5 outline-none z-50',
              ].join(' ')}
            >
              <BaseSelect.List>
                {options.map((opt) => (
                  <BaseSelect.Item
                    key={opt.value}
                    value={opt.value}
                    className={[
                      'flex items-center justify-between px-ds-3 py-ds-1.5',
                      'text-ds-body-sm text-ds-foreground cursor-pointer select-none outline-none',
                      'data-[highlighted]:bg-ds-neutral/60',
                      'data-[selected]:text-ds-primary data-[selected]:font-medium',
                    ].join(' ')}
                  >
                    <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="text-ds-primary">
                      <CheckMark />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  )
}
