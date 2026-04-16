import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'

export function RadioGroup({ children, className = '', ...props }) {
  return (
    <BaseRadioGroup
      className={`flex flex-col gap-ds-2 font-satoshi ${className}`}
      {...props}
    >
      {children}
    </BaseRadioGroup>
  )
}

export function RadioItem({ label, value, disabled, className = '' }) {
  return (
    <label
      className={`inline-flex items-center gap-ds-2 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
    >
      <Radio.Root
        value={value}
        disabled={disabled}
        className={[
          'relative size-ds-4 rounded-full border flex items-center justify-center shrink-0',
          'transition-colors duration-150 outline-none',
          'border-ds-input-border bg-ds-background',
          'data-[checked]:border-ds-primary',
          'focus-visible:ring-2 focus-visible:ring-ds-border-focus/30',
          disabled ? 'bg-ds-disabled border-ds-disabled cursor-not-allowed' : '',
        ].join(' ')}
      >
        <Radio.Indicator
          className={[
            'flex items-center justify-center',
            'after:block after:size-2 after:rounded-full after:bg-ds-primary',
            'data-[unchecked]:hidden',
          ].join(' ')}
        />
      </Radio.Root>
      {label && (
        <span className="text-ds-body-sm text-ds-foreground select-none">{label}</span>
      )}
    </label>
  )
}
