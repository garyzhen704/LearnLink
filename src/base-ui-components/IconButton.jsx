import { Button as BaseButton } from '@base-ui/react/button'
import { Icon } from './Icon'

const variantClasses = {
  filled: [
    'bg-ds-primary',
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
    'bg-ds-danger',
    'hover:bg-ds-danger-hover text-ds-danger-fg',
    'active:bg-ds-danger-pressed',
    'data-[disabled]:bg-ds-disabled data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses = {
  sm: 'h-ds-8 w-ds-8',
  md: 'h-ds-9 w-ds-9',
  lg: 'h-ds-10 w-ds-10',
}

const iconVariants = {
  filled: 'foreground',
  outline: 'default',
  ghost: 'default',
  danger: 'foreground',
  disabled: 'disabled-foreground',
}

export function IconButton({
  icon,
  variant = 'filled',
  size = 'md',
  className = '',
  disabled,
  ...props
}) {

  return (
    <BaseButton
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-ds-md font-satoshi font-medium transition-colors duration-150 select-none',
        variantClasses[variant] ?? variantClasses.filled,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ].join(' ')}
      {...props}
    >
      <Icon
        icon={icon}
        size={size}
        variant={disabled ? iconVariants['disabled'] : iconVariants[variant]}
      />
    </BaseButton>
  )
}
