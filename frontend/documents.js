// Documents state
let documents = [];
let filteredDocuments = [];
let selectedDocument = null;

// DOM Elements
const documentsGrid = document.getElementById('documents-grid');
const typeFilter = document.getElementById('type-filter');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const detailModal = document.getElementById('detail-modal');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');
const closeDetailBtn = document.getElementById('close-detail');
const downloadBtn = document.getElementById('download-btn');
const deleteBtn = document.getElementById('delete-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
});

// Event Listeners
typeFilter.addEventListener('change', filterDocuments);
searchInput.addEventListener('input', filterDocuments);
refreshBtn.addEventListener('click', loadDocuments);
closeDetailBtn.addEventListener('click', closeDetailModal);
downloadBtn.addEventListener('click', downloadDocument);
deleteBtn.addEventListener('click', deleteDocument);

// Close modal on background click
detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
        closeDetailModal();
    }
});

// Load documents from API
async function loadDocuments() {
    documentsGrid.innerHTML = '<div class="loading">Loading documents...</div>';

    try {
        const response = await fetch('/api/documents');
        const data = await response.json();

        documents = data.documents;
        filterDocuments();

        // Check for document ID in URL params and auto-open detail modal
        const urlParams = new URLSearchParams(window.location.search);
        const docIdParam = urlParams.get('id');
        if (docIdParam) {
            const docId = parseInt(docIdParam);
            if (!isNaN(docId)) {
                openDocumentDetail(docId);
                // Clear the URL param without reloading
                window.history.replaceState({}, '', '/documents');
            }
        }
    } catch (error) {
        console.error('Failed to load documents:', error);
        documentsGrid.innerHTML = '<div class="error">Failed to load documents. Please try again.</div>';
    }
}

// Filter documents
function filterDocuments() {
    const typeValue = typeFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();

    filteredDocuments = documents.filter(doc => {
        const matchesType = !typeValue || (doc.document_type && doc.document_type.toLowerCase() === typeValue);
        const matchesSearch = !searchValue ||
            doc.filename.toLowerCase().includes(searchValue) ||
            (doc.generated_name && doc.generated_name.toLowerCase().includes(searchValue)) ||
            (doc.summary && doc.summary.toLowerCase().includes(searchValue)) ||
            (doc.companies && doc.companies.some(c => c.toLowerCase().includes(searchValue)));

        return matchesType && matchesSearch;
    });

    renderDocuments();
}

// Render documents grid
function renderDocuments() {
    if (filteredDocuments.length === 0) {
        documentsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>No documents found</h3>
                <p>Upload documents from the Chat page to see them here.</p>
            </div>
        `;
        return;
    }

    documentsGrid.innerHTML = filteredDocuments.map(doc => renderDocumentCard(doc)).join('');

    // Add click handlers
    document.querySelectorAll('.document-card').forEach(card => {
        card.addEventListener('click', () => {
            const docId = parseInt(card.dataset.id);
            openDocumentDetail(docId);
        });
    });
}

function renderDocumentCard(doc) {
    const typeColors = {
        email_thread: '#2196F3',
        meeting_notes: '#4CAF50',
        client_profile: '#9C27B0',
        report: '#FF9800',
        contract: '#f44336',
        proposal: '#00BCD4',
        notes: '#795548',
        other: '#757575'
    };

    const typeIcons = {
        email_thread: '📧',
        meeting_notes: '📝',
        client_profile: '👤',
        report: '📊',
        contract: '📋',
        proposal: '💼',
        notes: '📒',
        other: '📄'
    };

    const docType = doc.document_type || 'other';
    const color = typeColors[docType] || typeColors.other;
    const icon = typeIcons[docType] || typeIcons.other;
    const displayName = doc.generated_name || doc.filename;

    return `
        <div class="document-card" data-id="${doc.id}">
            <div class="card-header" style="border-top-color: ${color}">
                <span class="doc-type-badge" style="background-color: ${color}">
                    ${icon} ${docType.replace('_', ' ')}
                </span>
                ${doc.is_timeless ? '<span class="timeless-badge">Timeless</span>' : ''}
            </div>
            <div class="card-body">
                <h3 class="doc-title" title="${escapeHtml(displayName)}">${truncate(displayName, 50)}</h3>
                ${doc.summary ? `<p class="doc-summary">${truncate(doc.summary, 100)}</p>` : ''}
                ${doc.companies && doc.companies.length > 0 ? `
                    <div class="doc-companies">
                        ${doc.companies.slice(0, 3).map(c => `<span class="company-tag">${escapeHtml(c)}</span>`).join('')}
                        ${doc.companies.length > 3 ? `<span class="more-tag">+${doc.companies.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <span class="doc-date">${formatDate(doc.primary_date || doc.created_at)}</span>
                <span class="doc-chunks">${doc.chunk_count} chunks</span>
            </div>
        </div>
    `;
}

// Open document detail modal
function openDocumentDetail(docId) {
    selectedDocument = documents.find(d => d.id === docId);
    if (!selectedDocument) return;

    const doc = selectedDocument;
    const displayName = doc.generated_name || doc.filename;

    detailTitle.textContent = displayName;

    detailContent.innerHTML = `
        <div class="detail-section">
            <h4>Summary</h4>
            <p>${doc.summary || 'No summary available.'}</p>
        </div>

        <div class="detail-grid">
            <div class="detail-item">
                <label>Original Filename</label>
                <span>${escapeHtml(doc.original_filename)}</span>
            </div>
            <div class="detail-item">
                <label>Document Type</label>
                <span>${doc.document_type ? doc.document_type.replace('_', ' ') : 'Unknown'}</span>
            </div>
            <div class="detail-item">
                <label>File Type</label>
                <span>${doc.file_type}</span>
            </div>
            <div class="detail-item">
                <label>File Size</label>
                <span>${formatFileSize(doc.file_size)}</span>
            </div>
            <div class="detail-item">
                <label>Primary Date</label>
                <span>${doc.primary_date ? formatDate(doc.primary_date) : 'Not dated'}</span>
            </div>
            <div class="detail-item">
                <label>Chunks Indexed</label>
                <span>${doc.chunk_count}</span>
            </div>
            <div class="detail-item">
                <label>Uploaded</label>
                <span>${formatDateTime(doc.created_at)}</span>
            </div>
            <div class="detail-item">
                <label>Timeless</label>
                <span>${doc.is_timeless ? 'Yes' : 'No'}</span>
            </div>
        </div>

        ${doc.companies && doc.companies.length > 0 ? `
            <div class="detail-section">
                <h4>Companies</h4>
                <div class="tags-list">
                    ${doc.companies.map(c => `<span class="company-tag">${escapeHtml(c)}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${doc.people && doc.people.length > 0 ? `
            <div class="detail-section">
                <h4>People</h4>
                <div class="tags-list">
                    ${doc.people.map(p => `<span class="person-tag">👤 ${escapeHtml(p)}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${doc.content_preview ? `
            <div class="detail-section">
                <h4>Content Preview</h4>
                <div class="content-preview">${escapeHtml(doc.content_preview)}</div>
            </div>
        ` : ''}
    `;

    detailModal.classList.remove('hidden');
}

function closeDetailModal() {
    detailModal.classList.add('hidden');
    selectedDocument = null;
}

// Download document
async function downloadDocument() {
    if (!selectedDocument) return;

    try {
        window.location.href = `/api/documents/${selectedDocument.id}/download`;
    } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download document. The original file may not be available.');
    }
}

// Delete document
async function deleteDocument() {
    if (!selectedDocument) return;

    if (!confirm(`Are you sure you want to delete "${selectedDocument.filename}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/documents/${selectedDocument.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        closeDetailModal();
        loadDocuments();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete document. Please try again.');
    }
}

// Utilities
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
