import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, FileText, Filter, X } from 'lucide-react'
import { GlassCard, GlassButton, GlassSelect, GlassInput, GlassBadge, GlassTag } from '@/components/ui'
import { getEventTypeConfig, EVENT_TYPES } from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import { timelineApi } from '@/api'
import type { TimelineEvent, TimelineFilters } from '@/types'

export function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TimelineFilters>({
    company: '',
    eventType: '',
    startDate: '',
    endDate: '',
  })
  const [appliedFilters, setAppliedFilters] = useState<TimelineFilters>(filters)

  // Load companies for filter
  useEffect(() => {
    timelineApi.getCompanies().then((res) => setCompanies(res.companies)).catch(console.error)
  }, [])

  // Load events
  const loadEvents = async (filtersToApply: TimelineFilters = appliedFilters) => {
    setIsLoading(true)
    try {
      const response = await timelineApi.getEvents(filtersToApply)
      setEvents(response.events)
    } catch (error) {
      console.error('Failed to load timeline:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    loadEvents(filters)
  }

  const handleClearFilters = () => {
    const cleared: TimelineFilters = { company: '', eventType: '', startDate: '', endDate: '' }
    setFilters(cleared)
    setAppliedFilters(cleared)
    loadEvents(cleared)
  }

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {}
    events.forEach((event) => {
      const dateKey = event.event_date.split('T')[0]
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(event)
    })
    // Sort by date descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [events])

  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map((c) => ({ value: c, label: c })),
  ]

  const eventTypeOptions = [
    { value: '', label: 'All Types' },
    ...Object.entries(EVENT_TYPES).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  ]

  const hasActiveFilters = filters.company || filters.eventType || filters.startDate || filters.endDate

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
      {/* Filters */}
      <div className="py-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassSelect
              label="Company"
              options={companyOptions}
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            />
            <GlassSelect
              label="Event Type"
              options={eventTypeOptions}
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            />
            <GlassInput
              label="From Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <GlassInput
              label="To Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <GlassButton variant="primary" onClick={handleApplyFilters}>
              Apply Filters
            </GlassButton>
            {hasActiveFilters && (
              <GlassButton variant="ghost" onClick={handleClearFilters}>
                <X className="w-4 h-4" />
                Clear
              </GlassButton>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="glass-card px-8 py-10 text-center">
              <FileText className="w-12 h-12 mb-4 mx-auto text-primary-500" />
              <p className="text-lg font-semibold mb-2 text-text-primary">No events found</p>
              <p className="text-sm text-text-secondary">Upload documents with dates to see timeline events.</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-400 to-primary-300 opacity-50" />

            <div className="space-y-8">
              {groupedEvents.map(([date, dateEvents]) => (
                <div key={date} className="relative">
                  {/* Date marker */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center z-10 shadow-lg">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                      {formatDate(date)}
                    </span>
                  </div>

                  {/* Events for this date */}
                  <div className="ml-12 space-y-3">
                    <AnimatePresence>
                      {dateEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TimelineEventCard event={event} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const typeConfig = getEventTypeConfig(event.event_type)

  return (
    <GlassCard className="p-4" style={{ borderLeftColor: typeConfig.color, borderLeftWidth: '4px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <GlassBadge color={typeConfig.color} Icon={typeConfig.Icon}>
          {typeConfig.label}
        </GlassBadge>
        {event.document_filename && (
          <Link
            to={`/documents?id=${event.document_id}`}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary-600 transition-colors font-medium"
          >
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{event.document_filename}</span>
          </Link>
        )}
      </div>

      {/* Title & Description */}
      <h4 className="font-medium text-text-primary mb-1">{event.title}</h4>
      {event.description && (
        <p className="text-sm text-text-secondary mb-3">{event.description}</p>
      )}

      {/* Meta tags */}
      <div className="flex flex-wrap gap-2">
        {event.companies?.map((company) => (
          <GlassTag key={company}>{company}</GlassTag>
        ))}
        {event.people?.map((person) => (
          <GlassTag key={person} variant="secondary">{person}</GlassTag>
        ))}
      </div>
    </GlassCard>
  )
}
