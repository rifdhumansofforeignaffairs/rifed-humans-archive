const CONFIG = {
    SHEET_ID: "1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU",
    API_KEY: "AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk",
    FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLScnp3d4Ksk8sBElTUpLiA2R-wbDueV5_tEMR0MvitijRgECfQ/viewform?usp=header"
};

let allStories = [];
let filteredStories = [];
let currentView = "browse";

document.addEventListener("DOMContentLoaded", function() {
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
        console.error("Error initializing app:", error);
        showError("Failed to load stories. Please check your configuration.");
        showLoading(false);
    }
}

async function loadStories() {
    console.log("Loading stories...");
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form%20Responses%201?key=${CONFIG.API_KEY}`;
        console.log("API URL:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API Response:", data);
        
        if (!data.values || data.values.length < 2) {
            console.log("No data found");
            allStories = [];
            return;
        }
        
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        console.log("Headers:", headers);
        console.log("Number of rows:", rows.length);
        
        allStories = rows.map((row, index) => ({
            id: index + 1,
            title: row[1] || "Untitled Story",
            yearsOfService: parseInt(row[2]) || 0,
            agency: row[4] || "",
            submissionDate: row[0] ? new Date(row[0]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
        }));
        
        console.log("Stories processed:", allStories);
        
    } catch (error) {
        console.error("Error loading stories:", error);
        allStories = [];
    }
}

function setupEventListeners() {
    const submitBtn = document.querySelector(".submit-btn");
    if (submitBtn) {
        submitBtn.href = CONFIG.FORM_URL;
    }
}

function showLoading(show) {
    const loading = document.getElementById("loadingIndicator");
    if (loading) {
        loading.classList.toggle("hidden", !show);
    }
}

function showError(message) {
    const container = document.getElementById("storiesContainer");
    if (container) {
        container.innerHTML = `
            <div class="no-stories">
                <h3>Error Loading Data</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function updateDisplay() {
    updateQuickStats();
    displayStories();
}

function updateQuickStats() {
    const totalStories = allStories.length;
    document.getElementById("totalStories").textContent = totalStories;
}

function displayStories() {
    const container = document.getElementById("storiesContainer");
    if (!container) return;
    
    if (allStories.length === 0) {
        container.innerHTML = `
            <div class="no-stories">
                <h3>No stories yet</h3>
                <p>Stories will appear here as people submit them through your form.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allStories.map(story => `
        <div class="story-card">
            <h3>${story.title}</h3>
            <p>Years of Service: ${story.yearsOfService}</p>
            <p>Agency: ${story.agency}</p>
            <p>Submitted: ${story.submissionDate}</p>
        </div>
    `).join("");
}

function showView(viewName) {
    currentView = viewName;
    
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(viewName + "Btn").classList.add("active");
    
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.getElementById(viewName + "View").classList.add("active");
}
