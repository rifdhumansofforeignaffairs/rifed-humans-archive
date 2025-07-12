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
        
        const rows = data.values.slice(1);
        
        allStories = rows.map((row, index) => ({
            id: index + 1,
            timestamp: row[0] || "",
            title: row[1] || "Untitled Story",
            yearsOfService: parseInt(row[2]) || 0,
            lastPosition: row[3] || "",
            agency: row[4] || "",
            departureYear: row[5] || "2025",
            regionRIFd: row[6] || "",
            homeState: row[7] || "",
            serviceType: row[8] || "",
            regionsOfExpertise: row[9] ? row[9].split(",").map(r => r.trim()) : [],
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
            acknowledgments: row[21] || "",
            isAnonymous: row[22] === "Submit anonymously (recommended)",
            submissionDate: row[0] ? new Date(row[0]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
        }));
        
        allStories = allStories.filter(story => story.title && story.title !== "Untitled Story");
        console.log("Final stories:", allStories);
        
    } catch (error) {
        console.error("Error loading stories:", error);
        allStories = [];
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", debounce(handleSearch, 300));
    }
    
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", handleSort);
    }
    
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
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function updateDisplay() {
    updateQuickStats();
    filterAndDisplayStories();
}

function updateQuickStats() {
    const totalStories = allStories.length;
    const totalYears = allStories.reduce((sum, story) => sum + story.yearsOfService, 0);
    
    document.getElementById("totalStories").textContent = totalStories;
    document.getElementById("totalYears").textContent = totalYears;
    document.getElementById("totalLanguages").textContent = extractLanguages().length;
    document.getElementById("totalCost").textContent = formatCost(calculateTotalCost());
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
            const match = story.replacementCost.match(/\$?([\d,]+)/);
            if (match) {
                const cost = parseInt(match[1].replace(/,/g, ""));
                if (story.replacementCost.toLowerCase().includes("m")) return total + (cost * 1000000);
                if (story.replacementCost.toLowerCase().includes("k")) return total + (cost * 1000);
                return total + cost;
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

function handleSearch() {
    filterAndDisplayStories();
}

function handleSort() {
    filterAndDisplayStories();
}

function filterAndDisplayStories() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const sortBy = document.getElementById("sortSelect")?.value || "newest";
    
    filteredStories = allStories.filter(story => {
        if (!searchTerm) return true;
        return story.title.toLowerCase().includes(searchTerm) ||
               story.expertise.toLowerCase().includes(searchTerm) ||
               story.regionRIFd.toLowerCase().includes(searchTerm) ||
               story.agency.toLowerCase().includes(searchTerm);
    });
    
    filteredStories.sort((a, b) => {
        switch(sortBy) {
            case "newest":
                return new Date(b.submissionDate) - new Date(a.submissionDate);
            case "oldest":
                return new Date(a.submissionDate) - new Date(b.submissionDate);
            case "experience":
                return b.yearsOfService - a.yearsOfService;
            case "title":
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
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
                    <p>Try adjusting your search terms.</p>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = filteredStories.map(story => createStoryHTML(story)).join("");
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
                                <strong>Regional Expertise:</strong> ${story.regionsOfExpertise.map(escapeHtml).join(", ") || "Not specified"}
                            </div>
                            <div class="detail-item">
                                <strong>Languages:</strong> ${escapeHtml(story.languagesSpoken) || "Not specified"}
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
    
    if (expanded.style.display === "none") {
        expanded.style.display = "block";
        icon.className = "fas fa-chevron-up";
        text.textContent = "Collapse";
    } else {
        expanded.style.display = "none";
        icon.className = "fas fa-chevron-down";
        text.textContent = "Expand";
    }
}

function showView(viewName) {
    currentView = viewName;
    
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(viewName + "Btn").classList.add("active");
    
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.getElementById(viewName + "View").classList.add("active");
    
    if (viewName === "analytics") {
        updateAnalytics();
    }
}

function updateAnalytics() {
    const totalStories = allStories.length;
    const totalYears = allStories.reduce((sum, story) => sum + story.yearsOfService, 0);
    const avgYears = totalStories > 0 ? (totalYears / totalStories).toFixed(1) : 0;
    const seniorPersonnel = allStories.filter(story => story.yearsOfService >= 15).length;
    
    document.getElementById("analyticsTotal").textContent = totalStories;
    document.getElementById("analyticsYears").textContent = totalYears;
    document.getElementById("avgYears").textContent = `Avg: ${avgYears} years per person`;
    document.getElementById("analyticsSenior").textContent = seniorPersonnel;
    document.getElementById("seniorPercent").textContent = totalStories > 0 ? `${((seniorPersonnel / totalStories) * 100).toFixed(1)}% of total` : "0% of total";
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
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
