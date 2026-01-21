import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Paperclip, BookOpen, BookOpenCheck, X, FileText, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { GlassButton, TypingIndicator } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ChatMessage, SourceDocument, DocumentUploadResponse, DocumentSaveResponse } from '@/types'
import { chatApi, documentsApi } from '@/api'

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadData, setUploadData] = useState<DocumentUploadResponse | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<DocumentSaveResponse | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatApi.sendMessage({
        message: userMessage.content,
        conversation_id: conversationId,
        use_knowledge_base: useKnowledgeBase,
      })

      setConversationId(response.conversation_id)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        sources: response.sources,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    try {
      const response = await documentsApi.upload(file)
      setUploadData(response)
      setShowUploadModal(true)
    } catch (error) {
      console.error('Upload failed:', error)
      setSelectedFile(null)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveDocument = async () => {
    if (!uploadData) return

    setIsSaving(true)
    try {
      const result = await documentsApi.save({ upload_id: uploadData.upload_id })
      setSaveResult(result)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const closeModal = () => {
    setShowUploadModal(false)
    setUploadData(null)
    setSelectedFile(null)
    setSaveResult(null)
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
      {/* KB Toggle */}
      <div className="py-3 flex justify-end">
        <GlassButton
          variant={useKnowledgeBase ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setUseKnowledgeBase(!useKnowledgeBase)}
          className="gap-2"
        >
          {useKnowledgeBase ? (
            <>
              <BookOpenCheck className="w-4 h-4" />
              <span className="hidden sm:inline">KB: ON</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">KB: OFF</span>
            </>
          )}
        </GlassButton>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center glass-card px-8 py-10">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary-500" />
              <p className="text-lg font-semibold mb-2 text-text-primary">Welcome to Knowledge Base Assistant</p>
              <p className="text-sm text-text-secondary">Upload documents and ask questions about them.</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="py-4 space-y-2">
        {/* File preview */}
        <AnimatePresence>
          {selectedFile && !showUploadModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl px-3 py-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-primary-500" />
                <span className="text-text-primary">{selectedFile.name}</span>
              </div>
              <GlassButton variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                <X className="w-4 h-4" />
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input container */}
        <div className="glass rounded-full px-2 py-2 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            className="hidden"
            onChange={handleFileSelect}
          />
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </GlassButton>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your documents..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted px-2"
          />

          <GlassButton
            variant="primary"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </GlassButton>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && uploadData && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass-modal w-full max-w-lg p-6"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {saveResult ? 'Document Saved!' : 'Document Preview'}
                  </h3>
                  <GlassButton variant="ghost" size="icon" onClick={closeModal}>
                    <X className="w-5 h-5" />
                  </GlassButton>
                </div>

                {!saveResult ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-text-secondary mb-1">Filename</p>
                        <p className="font-medium">{uploadData.filename}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary mb-1">Preview</p>
                        <div className="glass-card p-3 max-h-48 overflow-y-auto text-sm text-text-secondary">
                          {uploadData.preview}
                        </div>
                      </div>
                      <p className="text-sm text-text-muted">
                        {uploadData.full_text_length.toLocaleString()} characters extracted
                      </p>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <GlassButton variant="secondary" onClick={closeModal} className="flex-1">
                        Cancel
                      </GlassButton>
                      <GlassButton
                        variant="primary"
                        onClick={handleSaveDocument}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? 'Saving...' : 'Save to Knowledge Base'}
                      </GlassButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-text-secondary mb-1">Document Name</p>
                        <p className="font-medium">{saveResult.generated_name || saveResult.filename}</p>
                      </div>
                      {saveResult.summary && (
                        <div>
                          <p className="text-sm text-text-secondary mb-1">Summary</p>
                          <p className="text-sm">{saveResult.summary}</p>
                        </div>
                      )}
                      <div className="flex gap-4 text-sm">
                        {saveResult.document_type && (
                          <span className="text-text-muted">Type: {saveResult.document_type}</span>
                        )}
                        <span className="text-text-muted">{saveResult.chunk_count} chunks indexed</span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <GlassButton variant="primary" onClick={closeModal} className="flex-1">
                        Done
                      </GlassButton>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary-500 text-white rounded-br-md shadow-lg shadow-primary-500/25'
            : 'glass-card rounded-bl-md'
        )}
      >
        <p className={cn(
          'whitespace-pre-wrap leading-relaxed',
          !isUser && 'text-text-primary'
        )}>
          {message.content}
        </p>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-primary-500/15">
            <p className="text-xs text-text-secondary font-medium mb-2">Sources:</p>
            <div className="space-y-1">
              {message.sources.map((source, idx) => (
                <SourceLink key={idx} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SourceLink({ source }: { source: SourceDocument }) {
  return (
    <Link
      to={`/documents?id=${source.document_id}`}
      className="flex items-center gap-2 text-xs text-primary-700 hover:text-primary-600 transition-colors font-medium"
    >
      <ExternalLink className="w-3 h-3" />
      <span className="truncate">{source.filename}</span>
      <span className="text-text-secondary font-normal">({Math.round(source.relevance_score * 100)}%)</span>
    </Link>
  )
}
