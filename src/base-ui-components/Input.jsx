import { Field } from '@base-ui/react/field'
import { Input as BaseInput } from '@base-ui/react/input'

export function Input({
  label,
  error,
  disabled,
  id,
  className = '',
  ...props
}) {
  return (
    <Field.Root disabled={disabled} className="flex flex-col gap-ds-1.5 font-satoshi">
      {label && (
        <Field.Label
          htmlFor={id}
          className="text-ds-label text-ds-foreground"
        >
          {label}
        </Field.Label>
      )}
      <BaseInput
        id={id}
        disabled={disabled}
        className={[
          'h-ds-9 w-full rounded-ds-md border px-ds-3 text-ds-body-sm text-ds-foreground bg-ds-background',
          'placeholder:text-ds-foreground-muted',
          'transition-colors duration-150 outline-none',
          error
            ? 'border-red-600 focus:ring-2 focus:ring-red-600/30'
            : 'border-ds-input-border focus:border-ds-border-focus focus:ring-2 focus:ring-ds-border-focus/20',
          disabled ? 'bg-ds-disabled text-ds-disabled-fg cursor-not-allowed' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-ds-body-sm text-red-600">{error}</p>
      )}
    </Field.Root>
  )
}
