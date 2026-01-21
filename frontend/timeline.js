// Timeline state
let timelineEvents = [];
let filters = {
    company: '',
    eventType: '',
    startDate: '',
    endDate: ''
};

// DOM Elements
const timelineEl = document.getElementById('timeline');
const companyFilter = document.getElementById('company-filter');
const eventTypeFilter = document.getElementById('event-type-filter');
const dateStart = document.getElementById('date-start');
const dateEnd = document.getElementById('date-end');
const applyBtn = document.getElementById('apply-filters');
const clearBtn = document.getElementById('clear-filters');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadCompanies();
    await loadTimeline();
});

// Event Listeners
applyBtn.addEventListener('click', applyFilters);
clearBtn.addEventListener('click', clearFilters);

function applyFilters() {
    filters.company = companyFilter.value;
    filters.eventType = eventTypeFilter.value;
    filters.startDate = dateStart.value;
    filters.endDate = dateEnd.value;
    loadTimeline();
}

function clearFilters() {
    companyFilter.value = '';
    eventTypeFilter.value = '';
    dateStart.value = '';
    dateEnd.value = '';
    filters = { company: '', eventType: '', startDate: '', endDate: '' };
    loadTimeline();
}

// Load companies for filter dropdown
async function loadCompanies() {
    try {
        const response = await fetch('/api/timeline/companies');
        const data = await response.json();

        data.companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companyFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load companies:', error);
    }
}

// Load timeline events
async function loadTimeline() {
    timelineEl.innerHTML = '<div class="loading">Loading timeline...</div>';

    const params = new URLSearchParams();
    if (filters.company) params.append('company', filters.company);
    if (filters.eventType) params.append('event_type', filters.eventType);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    try {
        const response = await fetch(`/api/timeline?${params}`);
        const data = await response.json();

        timelineEvents = data.events;
        renderTimeline();
    } catch (error) {
        console.error('Failed to load timeline:', error);
        timelineEl.innerHTML = '<div class="error">Failed to load timeline. Please try again.</div>';
    }
}

// Render timeline
function renderTimeline() {
    if (timelineEvents.length === 0) {
        timelineEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No events found</h3>
                <p>Upload documents to see timeline events extracted from them.</p>
            </div>
        `;
        return;
    }

    // Group events by date
    const eventsByDate = {};
    timelineEvents.forEach(event => {
        const dateKey = event.event_date.split('T')[0];
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });

    // Render
    let html = '<div class="timeline-line"></div>';

    Object.keys(eventsByDate).sort().reverse().forEach(date => {
        html += `
            <div class="timeline-date-group">
                <div class="timeline-date-marker">
                    <div class="date-dot"></div>
                    <h3 class="date-header">${formatDate(date)}</h3>
                </div>
                <div class="timeline-events">
                    ${eventsByDate[date].map(event => renderEvent(event)).join('')}
                </div>
            </div>
        `;
    });

    timelineEl.innerHTML = html;
}

function renderEvent(event) {
    const typeColors = {
        meeting: '#4CAF50',
        email: '#2196F3',
        deadline: '#f44336',
        milestone: '#9C27B0',
        action_item: '#FF9800'
    };

    const typeIcons = {
        meeting: '🤝',
        email: '📧',
        deadline: '⏰',
        milestone: '🎯',
        action_item: '✅'
    };

    const color = typeColors[event.event_type] || '#757575';
    const icon = typeIcons[event.event_type] || '📌';

    return `
        <div class="timeline-event" style="border-left-color: ${color}">
            <div class="event-header">
                <span class="event-type-badge" style="background-color: ${color}">
                    ${icon} ${event.event_type || 'other'}
                </span>
                <a href="/documents?id=${event.document_id}" class="event-source source-link" title="${escapeHtml(event.document_filename)}">
                    📄 ${truncate(event.document_filename, 30)}
                </a>
            </div>
            <h4 class="event-title">${escapeHtml(event.title)}</h4>
            ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ''}
            <div class="event-meta">
                ${event.companies.length ? `
                    <div class="event-companies">
                        ${event.companies.map(c => `<span class="company-tag">${escapeHtml(c)}</span>`).join('')}
                    </div>
                ` : ''}
                ${event.people.length ? `
                    <div class="event-people">
                        ${event.people.map(p => `<span class="person-tag">👤 ${escapeHtml(p)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Utilities
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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
