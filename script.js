// Configuration - YOU NEED TO UPDATE THESE
const CONFIG = {
    SHEET_ID: 1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU,
    API_KEY: AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk,
    FORM_URL: https://docs.google.com/forms/d/e/1FAIpQLScnp3d4Ksk8sBElTUpLiA2R-wbDueV5_tEMR0MvitijRgECfQ/viewform?usp=header
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
        
        if (!data.values || data.values.length < 2) {
            allStories = [];
            return;
        }
        
        // Convert sheet data to story objects
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
            regionsOfExpertise: row[9] ? row[9].split(',').map(r => r.trim()) : [],
            expertise: row[10] || '',
            languagesSpoken: row[11] || '',
            impactStatement: row[12] || '',
            serviceBackground: row[13] || '',
            consequenceNarrative: row[14] || '',
            policyImplications: row[15] || '',
            expertiseReplaceable: row[16] || '',
            replacementCost: row[17] || '',
            networkRebuildTime: row[18] || '',
            hadOnwardAssignment: row[19] || '',
            onwardAssignmentType: row[20] || '',
            acknowledgePurpose: row[21] || '',
            acknowledgeDisclaimer: row[22] || '',
            isAnonymous: row[23] !== 'Include my contact information',
            name: row[24] || '',
            email: row[25] || '',
            submissionDate: row[0] ? new Date(row[0]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        
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
