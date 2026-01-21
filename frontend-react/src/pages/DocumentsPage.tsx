import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Search, RefreshCw, Download, Trash2, Clock, FileText } from 'lucide-react'
import { GlassCard, GlassButton, GlassSelect, GlassModal, GlassBadge, GlassTag } from '@/components/ui'
import { getDocTypeConfig, DOCUMENT_TYPES } from '@/lib/constants'
import { formatDate, formatFileSize, truncate } from '@/lib/formatters'
import { documentsApi } from '@/api'
import type { Document } from '@/types'

export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Load documents
  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await documentsApi.list()
      setDocuments(response.documents)

      // Check URL for document ID to auto-open
      const docId = searchParams.get('id')
      if (docId) {
        const doc = response.documents.find((d) => d.id === parseInt(docId))
        if (doc) setSelectedDoc(doc)
        setSearchParams({})
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType = !typeFilter || doc.document_type === typeFilter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        doc.filename.toLowerCase().includes(searchLower) ||
        doc.generated_name?.toLowerCase().includes(searchLower) ||
        doc.summary?.toLowerCase().includes(searchLower) ||
        doc.companies?.some((c) => c.toLowerCase().includes(searchLower))

      return matchesType && matchesSearch
    })
  }, [documents, typeFilter, searchQuery])

  const handleDelete = async () => {
    if (!selectedDoc) return

    setIsDeleting(true)
    try {
      await documentsApi.delete(selectedDoc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== selectedDoc.id))
      setSelectedDoc(null)
    } catch (error) {
      console.error('Failed to delete document:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...Object.entries(DOCUMENT_TYPES).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  ]

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4">
      {/* Filters */}
      <div className="py-4">
        <div className="glass rounded-2xl p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="glass-input w-full pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
          <div className="w-48">
            <GlassSelect
              options={typeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <GlassButton variant="secondary" onClick={loadDocuments}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </GlassButton>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="glass-card px-8 py-10 text-center">
              <FileText className="w-12 h-12 mb-4 mx-auto text-primary-500" />
              <p className="text-lg font-semibold mb-2 text-text-primary">No documents found</p>
              <p className="text-sm text-text-secondary">Upload documents in the Chat page to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DocumentCard document={doc} onClick={() => setSelectedDoc(doc)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <GlassModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.generated_name || selectedDoc?.filename || 'Document'}
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-6">
            {/* Summary */}
            {selectedDoc.summary && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Summary</h4>
                <p className="text-text-primary">{selectedDoc.summary}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <MetaItem label="Original Filename" value={selectedDoc.original_filename} />
              <MetaItem label="Document Type" value={getDocTypeConfig(selectedDoc.document_type).label} />
              <MetaItem label="File Type" value={selectedDoc.file_type} />
              <MetaItem label="File Size" value={formatFileSize(selectedDoc.file_size)} />
              <MetaItem label="Primary Date" value={formatDate(selectedDoc.primary_date)} />
              <MetaItem label="Chunks Indexed" value={selectedDoc.chunk_count.toString()} />
              <MetaItem label="Uploaded" value={formatDate(selectedDoc.created_at)} />
              <MetaItem label="Timeless" value={selectedDoc.is_timeless ? 'Yes' : 'No'} />
            </div>

            {/* Companies */}
            {selectedDoc.companies && selectedDoc.companies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.companies.map((company) => (
                    <GlassTag key={company}>{company}</GlassTag>
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            {selectedDoc.people && selectedDoc.people.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">People</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.people.map((person) => (
                    <GlassTag key={person} variant="secondary">{person}</GlassTag>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {selectedDoc.content_preview && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Content Preview</h4>
                <div className="glass-card p-4 max-h-48 overflow-y-auto text-sm text-text-secondary font-mono">
                  {selectedDoc.content_preview}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-primary-500/15">
              <GlassButton
                variant="secondary"
                onClick={() => window.open(documentsApi.getDownloadUrl(selectedDoc.id), '_blank')}
                className="flex-1"
              >
                <Download className="w-4 h-4" />
                Download Original
              </GlassButton>
              <GlassButton
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  )
}

function DocumentCard({ document, onClick }: { document: Document; onClick: () => void }) {
  const typeConfig = getDocTypeConfig(document.document_type)
  const displayName = document.generated_name || document.filename

  return (
    <GlassCard
      variant="interactive"
      onClick={onClick}
      className="flex flex-col h-full"
      style={{ borderTopColor: typeConfig.color, borderTopWidth: '3px' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-primary-500/10 flex items-center justify-between">
        <GlassBadge color={typeConfig.color} Icon={typeConfig.Icon}>
          {typeConfig.label}
        </GlassBadge>
        {document.is_timeless && (
          <span className="flex items-center gap-1 text-xs text-text-secondary bg-white/20 px-2 py-0.5 rounded font-medium">
            <Clock className="w-3 h-3" />
            Timeless
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1">
        <h3 className="font-medium text-text-primary mb-2 leading-snug" title={displayName}>
          {truncate(displayName, 50)}
        </h3>
        {document.summary && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {truncate(document.summary, 100)}
          </p>
        )}
        {document.companies && document.companies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.companies.slice(0, 3).map((company) => (
              <GlassTag key={company}>{company}</GlassTag>
            ))}
            {document.companies.length > 3 && (
              <GlassTag variant="muted">+{document.companies.length - 3}</GlassTag>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-primary-500/10 flex justify-between text-xs text-text-secondary">
        <span>{formatDate(document.primary_date || document.created_at)}</span>
        <span>{document.chunk_count} chunks</span>
      </div>
    </GlassCard>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-secondary font-medium mb-1">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  )
}
