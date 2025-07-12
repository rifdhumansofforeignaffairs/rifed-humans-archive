const CONFIG = {
    SHEET_ID: "1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU",
    API_KEY: "AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk"
};

document.addEventListener("DOMContentLoaded", function() {
    console.log("Loading stories...");
    
    // Use CORS proxy to bypass API restrictions
    const proxyUrl = "https://api.allorigins.win/raw?url=";
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form%20Responses%201?key=${CONFIG.API_KEY}`;
    
    fetch(proxyUrl + encodeURIComponent(apiUrl))
    .then(response => response.json())
    .then(data => {
        console.log("Data received:", data);
        
        if (data.values && data.values.length > 1) {
            const stories = data.values.slice(1);
            displayStories(stories);
            document.getElementById("totalStories").textContent = stories.length;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("storiesContainer").innerHTML = `<p>Error loading stories: ${error.message}</p>`;
    });
});

function displayStories(stories) {
    const container = document.getElementById("storiesContainer");
    if (container) {
        container.innerHTML = stories.map((row, index) => `
            <div style="border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 5px;">
                <h3>${row[1] || "Untitled Story"}</h3>
                <p><strong>Years of Service:</strong> ${row[2] || "Unknown"}</p>
                <p><strong>Agency:</strong> ${row[4] || "Unknown"}</p>
                <p><strong>Position:</strong> ${row[3] || "Unknown"}</p>
                <p><strong>Impact:</strong> ${row[12] || "No impact statement"}</p>
            </div>
        `).join("");
    }
}

function showView(viewName) {
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.getElementById(viewName + "View").classList.add("active");
    
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(viewName + "Btn").classList.add("active");
}
