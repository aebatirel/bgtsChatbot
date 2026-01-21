// State
let conversationId = null;
let useKnowledgeBase = true;
let currentUpload = null;

// DOM Elements
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const kbToggle = document.getElementById('kb-toggle');
const modal = document.getElementById('upload-modal');
const modalFilename = document.getElementById('modal-filename');
const modalPreview = document.getElementById('modal-preview');
const modalInfo = document.getElementById('modal-info');
const modalSave = document.getElementById('modal-save');
const modalCancel = document.getElementById('modal-cancel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    messageInput.focus();
});

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

kbToggle.addEventListener('click', () => {
    useKnowledgeBase = !useKnowledgeBase;
    kbToggle.classList.toggle('off', !useKnowledgeBase);
    kbToggle.querySelector('.toggle-label').textContent = useKnowledgeBase ? 'KB: ON' : 'KB: OFF';
});

fileInput.addEventListener('change', handleFileSelect);
modalSave.addEventListener('click', saveDocument);
modalCancel.addEventListener('click', closeModal);

// Send Message
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessage(message, 'user');
    messageInput.value = '';
    sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = addTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                conversation_id: conversationId,
                use_knowledge_base: useKnowledgeBase
            })
        });

        if (!response.ok) throw new Error('Failed to send message');

        const data = await response.json();
        conversationId = data.conversation_id;

        // Remove typing indicator and add response
        typingEl.remove();
        addMessage(data.message, 'assistant', data.sources);

    } catch (error) {
        typingEl.remove();
        addMessage('Sorry, something went wrong. Please try again.', 'assistant');
        console.error('Chat error:', error);
    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Add message to UI
function addMessage(content, role, sources = []) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    let html = `<div class="message-content">${escapeHtml(content)}</div>`;

    if (sources && sources.length > 0) {
        html += `
            <div class="message-sources">
                <strong>Sources:</strong>
                ${sources.map(s => `
                    <a href="/documents?id=${s.document_id}" class="source-item source-link">
                        📄 ${escapeHtml(s.filename)} (${(s.relevance_score * 100).toFixed(0)}% match)
                    </a>
                `).join('')}
            </div>
        `;
    }

    messageEl.innerHTML = html;
    messagesEl.appendChild(messageEl);
    scrollToBottom();
}

// Add typing indicator
function addTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'message assistant';
    typingEl.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    messagesEl.appendChild(typingEl);
    scrollToBottom();
    return typingEl;
}

// Handle file selection
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show uploading state
    addMessage(`Uploading ${file.name}...`, 'user');
    const typingEl = addTypingIndicator();

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const data = await response.json();
        currentUpload = data;

        typingEl.remove();

        // Show modal with preview
        modalFilename.textContent = data.filename;
        modalPreview.textContent = data.preview;
        modalInfo.textContent = `File size: ${formatFileSize(data.file_size)} | Text length: ${data.full_text_length} characters`;
        modal.classList.remove('hidden');

    } catch (error) {
        typingEl.remove();
        addMessage(`Failed to upload: ${error.message}`, 'assistant');
        console.error('Upload error:', error);
    }

    // Reset file input
    fileInput.value = '';
}

// Save document to knowledge base
async function saveDocument() {
    if (!currentUpload) return;

    const uploadId = currentUpload.upload_id;

    // Get optional custom name and date from modal
    const customNameInput = document.getElementById('modal-suggested-name');
    const dateInput = document.getElementById('modal-date');

    const customName = customNameInput ? customNameInput.value.trim() : null;
    const userProvidedDate = dateInput && dateInput.value ? dateInput.value : null;

    closeModal();
    const typingEl = addTypingIndicator();
    addMessage('Processing document with AI... This may take a few seconds.', 'assistant');

    try {
        const requestBody = {
            upload_id: uploadId
        };

        if (customName) {
            requestBody.custom_name = customName;
        }

        if (userProvidedDate) {
            requestBody.user_provided_date = userProvidedDate;
        }

        const response = await fetch('/api/documents/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Save failed');
        }

        const data = await response.json();
        typingEl.remove();

        // Build enhanced success message
        let message = `Document saved to knowledge base!\n\n`;
        message += `**${data.filename}**\n\n`;

        if (data.summary) {
            message += `Summary: ${data.summary}\n\n`;
        }

        message += `• Type: ${data.document_type ? data.document_type.replace('_', ' ') : 'Unknown'}\n`;
        message += `• ${data.chunk_count} text chunks indexed\n`;

        if (data.companies && data.companies.length > 0) {
            message += `• Companies: ${data.companies.join(', ')}\n`;
        }

        if (data.primary_date) {
            message += `• Date: ${new Date(data.primary_date).toLocaleDateString()}\n`;
        }

        if (data.is_timeless) {
            message += `• Marked as timeless information\n`;
        }

        message += `\nYou can now ask questions about this document, view it in Documents, or see extracted events in Timeline.`;

        addMessage(message, 'assistant');

    } catch (error) {
        typingEl.remove();
        addMessage(`Failed to save document: ${error.message}`, 'assistant');
        console.error('Save error:', error);
    }

    currentUpload = null;
}

// Close modal
function closeModal() {
    modal.classList.add('hidden');
    currentUpload = null;
}

// Utilities
function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
