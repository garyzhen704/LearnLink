import { Switch as BaseSwitch } from '@base-ui/react/switch'

export function Switch({
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className = '',
}) {
  return (
    <label className={`inline-flex items-center gap-ds-2 font-satoshi cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <BaseSwitch.Root
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={[
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full',
          'transition-colors duration-200 outline-none',
          'bg-ds-toggle-off data-[checked]:bg-ds-toggle-on',
          'focus-visible:ring-2 focus-visible:ring-ds-border-focus/30',
          disabled ? 'cursor-not-allowed' : '',
        ].join(' ')}
      >
        <BaseSwitch.Thumb
          className={[
            'block size-3.5 rounded-full bg-ds-indicator shadow-sm',
            'translate-x-[3px] data-[checked]:translate-x-[19px]',
            'transition-transform duration-200',
          ].join(' ')}
        />
      </BaseSwitch.Root>
      {label && (
        <span className="text-ds-body-sm text-ds-foreground select-none">{label}</span>
      )}
    </label>
  )
}
