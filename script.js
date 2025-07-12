// Configuration - YOU NEED TO UPDATE THESE
const CONFIG = {
    SHEET_ID: '1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU',    // Replace with your Sheet ID
    API_KEY: 'AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk',             // Replace with your API key
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScnp3d4Ksk8sBElTUpLiA2R-wbDueV5_tEMR0MvitijRgECfQ/viewform?usp=header'    // Replace with your form link
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
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Sheet1?key=${CONFIG.API_KEY}`;
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
            regionRIF
