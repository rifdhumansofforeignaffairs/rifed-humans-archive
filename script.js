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
        showLoading(false);
    }
}

async function loadStories() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form%20Responses%201?key=${CONFIG.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            allStories = [];
            return;
        }
        
        const rows = data.values.slice(1);
        
        allStories = rows.map((row, index) => ({
            id: index + 1,
            title: row[1] || "Untitled Story",
            yearsOfService: parseInt(row[2]) || 0,
            lastPosition: row[3] || "",
            agency: row[4] || "",
            departureYear: row[5] || "2025",
            regionRIFd: row[6] || "",
            homeState: row[7] || "",
            serviceType: row[8] || "",
            expertise: row[10] || "",
            languagesSpoken: row[11] || "",
            impactStatement: row[12] || "",
            serviceBackground: row[13] || "",
            consequenceNarrative: row[14] || "",
            policyImplications: row[15] || "",
            expertiseReplaceable: row[16] || "",
            replacementCost: row[17] || "",
            networkRebuildTime: row[18] || "",
            hadOnwardAssignment: row[19] || "",
            onwardAssignmentType: row[20] || "",
            submissionDate: row[0] ? new Date(row[0]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
        }));
        
        allStories = allStories.filter(story => story.title && story.title !== "Untitled Story");
        console.log("Final stories with ALL fields:", allStories);
        
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

function updateDisplay() {
    updateQuickStats();
    filterAndDisplayStories();
}

function updateQuickStats() {
    const totalStories = allStories.length;
    const totalYears = allStories.reduce((sum, story) => sum + story.yearsOfService, 0);
    const totalCost = calculateTotalCost();
    
    document.getElementById("totalStories").textContent = totalStories;
    document.getElementById("totalYears").textContent = totalYears;
    document.getElementById("totalLanguages").textContent = extractLanguages().length;
    document.getElementById("totalCost").textContent = formatCost(totalCost);
}

function extractLanguages() {
    const allLanguages = [];
    allStories.forEach(story => {
        if (story.languagesSpoken) {
            const languages = story.languagesSpoken.split(",").map(lang => {
                return lang.trim().split("(")[0].trim();
            });
            allLanguages.push(...languages);
        }
    });
    return [...new Set(allLanguages.filter(lang => lang.length > 0))];
}

function calculateTotalCost() {
    return allStories.reduce((total, story) => {
        if (story.replacementCost) {
            const text = story.replacementCost.toLowerCase();
            const match = text.match(/\$?([\d,]+)\s*k/i);
            if (match) {
                const cost = parseInt(match[1].replace(/,/g, ""));
                return total + (cost * 1000);
            }
        }
        return total;
    }, 0);
}

function formatCost(cost) {
    if (cost === 0) return "$0";
    if (cost >= 1000000) return `$${(cost / 1000000).toFixed(1)}M+`;
    if (cost >= 1000) return `$${(cost / 1000).toFixed(0)}K+`;
    return `$${cost.toLocaleString()}`;
}

function filterAndDisplayStories() {
    filteredStories = allStories;
    displayStories();
    updateStoryCount();
}

function updateStoryCount() {
    const storyCount = document.getElementById("storyCount");
    if (storyCount) {
        storyCount.textContent = filteredStories.length;
    }
}

function displayStories() {
    const container = document.getElementById("storiesContainer");
    if (!container) return;
    
    if (filteredStories.length === 0) {
        container.innerHTML = `
            <div class="no-stories">
                <i class="fas fa-file-text"></i>
                <h3>No stories yet</h3>
                <p>Stories will appear here as people submit them through your form.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredStories.map(story => `
        <div class="story-card" data-story-id="${story.id}">
            <div class="story-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <h3 class="story-title">${story.title}</h3>
                        <div class="story-meta">
                            <span class="meta-tag years">
                                <i class="fas fa-calendar"></i>
                                ${story.yearsOfService} years
                            </span>
                            <span class="meta-tag location">
                                <i class="fas fa-map-marker"></i>
                                ${story.regionRIFd}
                            </span>
                            <span class="meta-tag position">
                                <i class="fas fa-briefcase"></i>
                                ${story.lastPosition}
                            </span>
                            <span class="meta-tag departure">
                                <i class="fas fa-clock"></i>
                                Departed ${story.departureYear}
                            </span>
                        </div>
                        <div class="story-subtitle">
                            ${story.agency} • ${story.serviceType} • 
                            Submitted ${new Date(story.submissionDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="story-content">
                <div class="story-section">
                    <h4 class="section-title">Impact Statement</h4>
                    <p class="section-content">${story.impactStatement}</p>
                </div>
                
                <div class="story-section">
                    <h4 class="section-title">Service Background</h4>
                    <p class="section-content">${story.serviceBackground}</p>
                </div>
                
                <div class="story-section">
                    <h4 class="section-title">Personal Consequences</h4>
                    <p class="section-content">${story.consequenceNarrative}</p>
                </div>
                
                <div class="story-section">
                    <h4 class="section-title">Policy Implications</h4>
                    <p class="section-content">${story.policyImplications}</p>
                </div>
            </div>
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
