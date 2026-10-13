import type { ReactNode } from 'react'

// A handful of small stroke icons, drawn on a 24x24 grid. Decorative only (aria-hidden):
// buttons that show just an icon must carry their own aria-label.

interface IconProps {
  className?: string
}

function Svg({ className = 'size-5', children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>
}

export function CloseIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 6l12 12M18 6L6 18" /></Svg>
}

export function PlusIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 5v14M5 12h14" /></Svg>
}

export function CheckIcon(props: IconProps) {
  return <Svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
}

export function PencilIcon(props: IconProps) {
  return <Svg {...props}><path d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4 11.5-11.5z" /></Svg>
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
    </Svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </Svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 9l6 6 6-6" /></Svg>
}

export function ArrowLeftIcon(props: IconProps) {
  return <Svg {...props}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>
}

export function HomeIcon(props: IconProps) {
  return <Svg {...props}><path d="M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5" /></Svg>
}

export function ListIcon(props: IconProps) {
  return <Svg {...props}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></Svg>
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </Svg>
  )
}

export function ShieldIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /></Svg>
}

export function LogoutIcon(props: IconProps) {
  return <Svg {...props}><path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" /></Svg>
}
