import {
  Mail,
  Users,
  Clock,
  Target,
  CheckSquare,
  FileText,
  FileCheck,
  Lightbulb,
  StickyNote,
  User,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'

export interface TypeConfig {
  label: string
  color: string
  bgClass: string
  textClass: string
  Icon: LucideIcon
}

export const DOCUMENT_TYPES: Record<string, TypeConfig> = {
  email_thread: {
    label: 'Email',
    color: 'oklch(65% 0.18 250)',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    Icon: Mail,
  },
  meeting_notes: {
    label: 'Meeting',
    color: 'oklch(65% 0.18 150)',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    Icon: Users,
  },
  client_profile: {
    label: 'Client',
    color: 'oklch(65% 0.15 280)',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
    Icon: User,
  },
  report: {
    label: 'Report',
    color: 'oklch(70% 0.15 50)',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    Icon: FileText,
  },
  contract: {
    label: 'Contract',
    color: 'oklch(60% 0.18 20)',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    Icon: FileCheck,
  },
  proposal: {
    label: 'Proposal',
    color: 'oklch(65% 0.15 200)',
    bgClass: 'bg-cyan-100',
    textClass: 'text-cyan-700',
    Icon: Lightbulb,
  },
  notes: {
    label: 'Notes',
    color: 'oklch(55% 0.08 50)',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    Icon: StickyNote,
  },
  other: {
    label: 'Other',
    color: 'oklch(60% 0.02 250)',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    Icon: HelpCircle,
  },
}

export const EVENT_TYPES: Record<string, TypeConfig> = {
  meeting: {
    label: 'Meeting',
    color: 'oklch(65% 0.18 150)',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    Icon: Users,
  },
  email: {
    label: 'Email',
    color: 'oklch(65% 0.18 250)',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    Icon: Mail,
  },
  deadline: {
    label: 'Deadline',
    color: 'oklch(65% 0.20 25)',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    Icon: Clock,
  },
  milestone: {
    label: 'Milestone',
    color: 'oklch(60% 0.20 310)',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-700',
    Icon: Target,
  },
  action_item: {
    label: 'Action',
    color: 'oklch(70% 0.18 70)',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    Icon: CheckSquare,
  },
}

export function getDocTypeConfig(type: string | undefined): TypeConfig {
  return DOCUMENT_TYPES[type || 'other'] || DOCUMENT_TYPES.other
}

export function getEventTypeConfig(type: string | undefined): TypeConfig {
  return EVENT_TYPES[type || 'meeting'] || EVENT_TYPES.meeting
}
