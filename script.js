const CONFIG = {
    SHEET_ID: "1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU",
    API_KEY: "AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk",
    FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLScnp3d4Ksk8sBElTUpLiA2R-wbDueV5_tEMR0MvitijRgECfQ/viewform?usp=header"
};

document.addEventListener("DOMContentLoaded", function() {
    console.log("App starting...");
    loadAndDisplayStories();
});

async function loadAndDisplayStories() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form%20Responses%201?key=${CONFIG.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            const stories = data.values.slice(1).map((row, index) => ({
                title: row[1] || "Untitled",
                years: row[2] || "0", 
                agency: row[4] || "Unknown",
                position: row[3] || "",
                impact: row[12] || ""
            }));
            
            displayStories(stories);
            updateStats(stories);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function displayStories(stories) {
    const container = document.getElementById("storiesContainer");
    if (container) {
        container.innerHTML = stories.map(story => `
            <div class="story-card">
                <h3>${story.title}</h3>
                <p><strong>Years:</strong> ${story.years} | <strong>Agency:</strong> ${story.agency}</p>
                <p><strong>Position:</strong> ${story.position}</p>
                <p><strong>Impact:</strong> ${story.impact}</p>
            </div>
        `).join("");
    }
}

function updateStats(stories) {
    const totalYears = stories.reduce((sum, story) => sum + parseInt(story.years || 0), 0);
    
    document.getElementById("totalStories").textContent = stories.length;
    document.getElementById("totalYears").textContent = totalYears;
}

function showView(viewName) {
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.getElementById(viewName + "View").classList.add("active");
    
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(viewName + "Btn").classList.add("active");
}
