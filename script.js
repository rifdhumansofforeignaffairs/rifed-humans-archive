// Configuration - YOU NEED TO UPDATE THESE
const CONFIG = {
    SHEET_ID: '1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU',
    API_KEY: 'AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk',
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScnp3d4Ksk8sBElTUpLiA2R-wbDueV5_tEMR0MvitijRgECfQ/viewform?usp=header'
};

// Global variables
let allStories = [];
let filteredStories = [];
let currentView = 'browse';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading(true);
        await loadStories();
        setupEventListeners();
        updateDisplay();
        showLoading(false);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load stories. Please check your configuration.');
        showLoading(false);
    }
}

// Load stories from Google Sheets
async function loadStories() {
    if (!CONFIG.SHEET_ID || !CONFIG.API_KEY || CONFIG.SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE') {
        console.log('Configuration not set up yet');
        allStories = [];
        return;
    }

    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form%20Responses%201?key=${CONFIG.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.values || data.values.length < 2) {
            allStories = [];
            return;
        }
        
        // Convert sheet data to story objects (adjusted for your shorter form)
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        allStories = rows.map((row, index) => ({
            id: index + 1,
            timestamp: row[0] || '',
            title: row[1] || 'Untitled Story',
            yearsOfService: parseInt(row[2]) || 0,
            lastPosition: row[3] || '',
            agency: row[4] || '',
            departureYear: row[5] || '2025',
            regionRIFd: row[6] || '',
            homeState: row[7] || '',
            serviceType: row[8] || '',
            // Column 9 was removed, so we skip it
            expertise: row[9] || '',  // This is now column 9 instead of 10
            languagesSpoken: row[10] || '',  // This is now column 10 instead of 11
            impactStatement: row[11] || '',  // This is now column 11 instead of 12
            serviceBackground: row[12] || '',  // This is now column 12 instead of 13
            consequenceNarrative: row[13] || '',  // This is now column 13 instead of 14
            policyImplications: row[14] || '',  // This is now column 14 instead of 15
            expertiseReplaceable: row[15] || '',  // This is now column 15 instead of 16
            // Column 16 was removed, so we skip it
            replacementCost: row[16] || '',  // This is now column 16 instead of 17
            networkRebuildTime: row[17] || '',  // This is now column 17 instead of 18
            hadOnwardAssignment: row[18] || '',  // This is now column 18 instead of 19
            onwardAssignmentType: row[19] || '',  // This is now column 19 instead of 20
            acknowledgePurpose: row[20] || '',  // This is now column 20 instead of 21
            acknowledgeDisclaimer: row[21] || '',  // This is now column 21 instead of 22
            isAnonymous: row[22] === 'Submit anonymously (recommended)',  // This is now column 22 instead of 23
            // Columns 23 and 24 (name and email) were removed
            name: '',  // Always empty since removed
            email: '',  // Always empty since removed
            regionsOfExpertise: [],  // Empty since column was removed
            submissionDate: row[0] ? new Date(row[0]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        
        console.log('Stories processed:', allStories);
        
        // Filter out empty rows
        allStories = allStories.filter(story => story.title && story.title !== 'Untitled Story');
        
    } catch (error) {
        console.error('Error loading stories:', error);
        allStories = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
    
    const filters = ['regionFilter', 'yearsFilter', 'agencyFilter', 'serviceFilter', 'expertiseFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', handleFilter);
            if (filterId === 'expertiseFilter') {
                element.addEventListener('input', debounce(handleFilter, 300));
            }
        }
    });
    
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn && CONFIG.FORM_URL && CONFIG.FORM_URL !== 'YOUR_GOOGLE_FORM_LINK_HERE') {
        submitBtn.href = CONFIG.FORM_URL;
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
}

function showError(message) {
    const container = document.getElementById('storiesContainer');
    if (container) {
        container.innerHTML = `
            <div class="no-stories">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function updateDisplay() {
    updateQuickStats();
    updateFilters();
    updateStoryCount();
    
    if (currentView === 'browse') {
        filterAndDisplayStories();
    } else if (currentView === 'analytics') {
        updateAnalytics();
    }
}

function updateQuickStats() {
    const totalStories = allStories.length;
    const totalYears = allStories.reduce((sum, story) => sum + story.yearsOfService, 0);
    const languages = extractLanguages();
    const estimatedCost = calculateTotalCost();
    
    document.getElementById('totalStories').textContent = totalStories;
    document.getElementById('totalYears').textContent = totalYears;
    document.getElementById('totalLanguages').textContent = languages.length;
    document.getElementById('totalCost').textContent = formatCost(estimatedCost);
}

function extractLanguages() {
    const allLanguages = [];
    allStories.forEach(story => {
        if (story.languagesSpoken) {
            const languages = story.languagesSpoken.split(',').map(lang => {
                return lang.trim().split('(')[0].trim();
            });
            allLanguages.push(...languages);
        }
    });
    return [...new Set(allLanguages.filter(lang => lang.length > 0))];
}

function calculateTotalCost() {
    return allStories.reduce((total, story) => {
        if (story.replacementCost) {
            const match = story.replacementCost.match(/\$?([\d,]+)/);
            if (match) {
                const cost = parseInt(match[1].replace(/,/g, ''));
                if (story.replacementCost.toLowerCase().includes('m')) return total + (cost * 1000000);
                if (story.replacementCost.toLowerCase().includes('k')) return total + (cost * 1000);
                return total + cost;
            }
        }
        return total;
    }, 0);
}

function formatCost(cost) {
    if (cost === 0) return '$0';
    if (cost >= 1000000) return `$${(cost / 1000000).toFixed(1)}M+`;
    if (cost >= 1000) return `$${(cost / 1000).toFixed(0)}K+`;
    return `$${cost.toLocaleString()}`;
}

function updateFilters() {
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        const regions = [...new Set(allStories.map(story => story.regionRIFd).filter(Boolean))];
        regionFilter.innerHTML = '<option value="">All Locations</option>' + 
            regions.map(region => `<option value="${region}">${region}</option>`).join('');
    }
    
    const agencyFilter = document.getElementById('agencyFilter');
    if (agencyFilter) {
        const agencies = [...new Set(allStories.map(story => story.agency).filter(Boolean))];
        agencyFilter.innerHTML = '<option value="">All Agencies</option>' + 
            agencies.map(agency => `<option value="${agency}">${agency}</option>`).join('');
    }
}

function updateStoryCount() {
    const storyCount = document.getElementById('storyCount');
    if (storyCount) {
        storyCount.textContent = filteredStories.length;
    }
}

function handleSearch() {
    filterAndDisplayStories();
}

function handleSort() {
    filterAndDisplayStories();
}

function handleFilter() {
    filterAndDisplayStories();
}

function filterAndDisplayStories() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const regionFilter = document.getElementById('regionFilter')?.value || '';
    const yearsFilter = document.getElementById('yearsFilter')?.value || '';
    const agencyFilter = document.getElementById('agencyFilter')?.value || '';
    const serviceFilter = document.getElementById('serviceFilter')?.value || '';
    const expertiseFilter = document.getElementById('expertiseFilter')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('sortSelect')?.value || 'newest';
    
    filteredStories = allStories.filter(story => {
        const matchesSearch = !searchTerm || 
            story.title.toLowerCase().includes(searchTerm) ||
            story.expertise.toLowerCase().includes(searchTerm) ||
            story.regionRIFd.toLowerCase().includes(searchTerm) ||
            story.agency.toLowerCase().includes(searchTerm);
        
        const matchesRegion = !regionFilter || story.regionRIFd === regionFilter;
        
        const matchesYears = !yearsFilter || (() => {
            const years = story.yearsOfService;
            switch(yearsFilter) {
                case '0-4': return years <= 4;
                case '5-10': return years >= 5 && years <= 10;
                case '10-20': return years >= 10 && years <= 20;
                case '20+': return years >= 20;
                default: return true;
            }
        })();
        
        const matchesAgency = !agencyFilter || story.agency === agencyFilter;
        const matchesService = !serviceFilter || story.serviceType === serviceFilter;
        const matchesExpertise = !expertiseFilter || story.expertise.toLowerCase().includes(expertiseFilter);
        
        return matchesSearch && matchesRegion && matchesYears && matchesAgency && matchesService && matchesExpertise;
    });
    
    filteredStories.sort((a, b) => {
        switch(sortBy) {
            case 'newest':
                return new Date(b.submissionDate) - new Date(a.submissionDate);
            case 'oldest':
                return new Date(a.submissionDate) - new Date(b.submissionDate);
            case 'experience':
                return b.yearsOfService - a.yearsOfService;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    displayStories();
    updateStoryCount();
}

function displayStories() {
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    if (filteredStories.length === 0) {
        if (allStories.length === 0) {
            container.innerHTML = `
                <div class="no-stories">
                    <i class="fas fa-file-text"></i>
                    <h3>No stories yet</h3>
                    <p>Stories will appear here as people submit them through your form.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="no-stories">
                    <i class="fas fa-search"></i>
                    <h3>No stories found</h3>
                    <p>Try adjusting your search terms or filters.</p>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = filteredStories.map(story => createStoryHTML(story)).join('');
}

function createStoryHTML(story) {
    return `
        <div class="story-card" data-story-id="${story.id}">
            <div class="story-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <h3 class="story-title">${escapeHtml(story.title)}</h3>
                        <div class="story-meta">
                            <span class="meta-tag years">
                                <i class="fas fa-calendar"></i>
                                ${story.yearsOfService} years
                            </span>
                            <span class="meta-tag location">
                                <i class="fas fa-map-marker"></i>
                                ${escapeHtml(story.regionRIFd)}
                            </span>
                            <span class="meta-tag position">
                                <i class="fas fa-briefcase"></i>
                                ${escapeHtml(story.lastPosition)}
                            </span>
                            <span class="meta-tag departure">
                                <i class="fas fa-clock"></i>
                                Departed ${story.departureYear}
                            </span>
                        </div>
                        <div class="story-subtitle">
                            ${escapeHtml(story.agency)} • ${escapeHtml(story.serviceType)} • 
                            Submitted ${new Date(story.submissionDate).toLocaleDateString()}
                        </div>
                    </div>
                    <button class="expand-btn" onclick="toggleStory(${story.id})">
                        <span id="expand-text-${story.id}">Expand</span>
                        <i class="fas fa-chevron-down" id="expand-icon-${story.id}"></i>
                    </button>
                </div>
            </div>
            
            <div class="story-content">
                <div class="story-section">
                    <h4 class="section-title">Impact Statement</h4>
                    <p class="section-content">${escapeHtml(story.impactStatement)}</p>
                </div>
                
                <div id="expanded-${story.id}" style="display: none;">
                    <div class="story-section">
                        <h4 class="section-title">Service Background</h4>
                        <p class="section-content">${escapeHtml(story.serviceBackground)}</p>
                    </div>
                    
                    <div class="story-section">
                        <h4 class="section-title">Personal Consequences</h4>
                        <p class="section-content">${escapeHtml(story.consequenceNarrative)}</p>
                    </div>
                    
                    <div class="story-section">
                        <h4 class="section-title">Policy Implications</h4>
                        <p class="section-content">${escapeHtml(story.policyImplications)}</p>
                    </div>
                    
                    <div class="story-details">
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Expertise:</strong> ${escapeHtml(story.expertise)}
                            </div>
                            <div class="detail-item">
                                <strong>Languages:</strong> ${escapeHtml(story.languagesSpoken) || 'Not specified'}
                            </div>
                            <div class="detail-item">
                                <strong>Expertise Replaceable:</strong> ${escapeHtml(story.expertiseReplaceable)}
                            </div>
                            <div class="detail-item">
                                <strong>Replacement Cost:</strong> ${escapeHtml(story.replacementCost)}
                            </div>
                            <div class="detail-item">
                                <strong>Network Rebuild Time:</strong> ${escapeHtml(story.networkRebuildTime)}
                            </div>
                            ${story.serviceType === 'Foreign Service' && story.hadOnwardAssignment ? `
                            <div class="detail-item">
                                <strong>Onward Assignment:</strong> ${story.hadOnwardAssignment === 'Yes' ? `Yes (${escapeHtml(story.onwardAssignmentType)})` : 'No'}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleStory(storyId) {
    const expanded = document.getElementById(`expanded-${storyId}`);
    const icon = document.getElementById(`expand-icon-${storyId}`);
    const text = document.getElementById(`expand-text-${storyId}`);
    
    if (expanded.style.display === 'none') {
        expanded.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
        text.textContent = 'Collapse';
    } else {
        expanded.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
        text.textContent = 'Expand';
    }
}

function showView(viewName) {
    currentView = viewName;
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(viewName + 'Btn').classList.add('active');
    
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewName + 'View').classList.add('active');
    
    if (viewName === 'analytics') {
        updateAnalytics();
    }
}

function updateAnalytics() {
    const totalStories = allStories.length;
    const totalYears = allStories.reduce((sum, story) => sum + story.yearsOfService, 0);
    const avgYears = totalStories > 0 ? (totalYears / totalStories).toFixed(1) : 0;
    const seniorPersonnel = allStories.filter(story => story.yearsOfService >= 15).length;
    const overseasAssignments = allStories.filter(story => 
        story.serviceType === 'Foreign Service' && 
        story.hadOnwardAssignment === 'Yes' && 
        story.onwardAssignmentType === 'Overseas'
    ).length;
    
    document.getElementById('analyticsTotal').textContent = totalStories;
    document.getElementById('analyticsYears').textContent = totalYears;
    document.getElementById('avgYears').textContent = `Avg: ${avgYears} years per person`;
    document.getElementById('analyticsSenior').textContent = seniorPersonnel;
    document.getElementById('seniorPercent').textContent = totalStories > 0 ? `${((seniorPersonnel / totalStories) * 100).toFixed(1)}% of total` : '0% of total';
    document.getElementById('analyticsOverseas').textContent = overseasAssignments;
}

function toggleFilters() {
    const filters = document.getElementById('advancedFilters');
    const toggle = document.getElementById('filterToggle');
    const icon = toggle.querySelector('i');
    
    if (filters.style.display === 'none') {
        filters.style.display = 'grid';
        icon.className = 'fas fa-chevron-up';
    } else {
        filters.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
    }
}

function exportData() {
    if (allStories.length === 0) {
        alert('No data to export');
        return;
    }
    
    const dataStr = JSON.stringify(allStories, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rifed-humans-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
