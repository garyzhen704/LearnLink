import { Menu as BaseMenu } from '@base-ui/react/menu'

const defaultItemCls = [
  'flex items-center gap-ds-2 px-ds-3 py-ds-1.5',
  'text-ds-body-sm text-ds-foreground cursor-pointer select-none outline-none rounded-[3px]',
  'data-[highlighted]:bg-ds-neutral/60',
  'data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
].join(' ')

const dangerItemCls = [
  'flex items-center gap-ds-2 px-ds-3 py-ds-1.5',
  'text-ds-body-sm text-ds-danger cursor-pointer select-none outline-none rounded-[3px]',
  'data-[highlighted]:bg-ds-danger/10',
  'data-[disabled]:text-ds-disabled-fg data-[disabled]:cursor-not-allowed',
].join(' ')

function renderItem(item, index) {
  if (item.type === 'separator') {
    return (
      <BaseMenu.Separator
        key={index}
        className='my-ds-1.5 h-px bg-ds-border mx-ds-3'
      />
    )
  }

  const iconCls = item.danger
    ? 'size-4 shrink-0 text-ds-danger'
    : 'size-4 shrink-0 text-ds-foreground-muted'

  return (
    <BaseMenu.Item
      key={index}
      disabled={item.disabled}
      onClick={item.onSelect}
      className={item.danger ? dangerItemCls : defaultItemCls}
    >
      {item.icon && <span className={iconCls}>{item.icon}</span>}
      {item.label}
    </BaseMenu.Item>
  )
}

export function Menu({
  trigger,
  items = [],
  open,
  defaultOpen,
  onOpenChange,
  openOnHover = false,
  side = 'bottom',
  align = 'center',
  sideOffset = 6,
}) {
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <BaseMenu.Trigger openOnHover={openOnHover} render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset}>
          <BaseMenu.Popup
            className={[
              'min-w-[133px] rounded-ds-md border border-ds-border bg-ds-background shadow-lg',
              'px-ds-1.5 py-ds-1.5 outline-none z-50 font-satoshi',
            ].join(' ')}
          >
            {items.map((item, index) => renderItem(item, index))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}
