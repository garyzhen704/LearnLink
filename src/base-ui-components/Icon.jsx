const variantClasses = {
  'base': '',
  'primary-foreground':  'text-ds-primary',
  'foreground':          'text-ds-primary-fg',
  'danger-foreground':   'text-ds-danger',
  'disabled-foreground': 'text-ds-disabled-fg',
  'foreground-muted':    'text-ds-foreground-muted',
}

const sizeMap = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
}

export function Icon({
  icon,
  variant = 'foreground',
  size = 'md',
  strokeWidth = 1.6,
  className = '',
  ...props
}) {
  const IconComponent = icon
  return (
    <span
      className={[
        'inline-flex items-center justify-center shrink-0',
        // variantClasses[variant] ?? variantClasses.foreground,
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      <IconComponent
        size={sizeMap[size] ?? sizeMap.md}
        strokeWidth={strokeWidth}
        aria-hidden="true"
        {...props}
      />
    </span>
  )
}
