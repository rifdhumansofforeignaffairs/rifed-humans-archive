console.log("Script loaded successfully");

const CONFIG = {
    SHEET_ID: "1bNwTlOZeK3yKHCU8VTVRswFFDxqphAHUkLDuz4gaimU",
    API_KEY: "AIzaSyCW81U8mptSsw9k1hkTXTtSGDkI4uUEPnk"
};

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded");
    console.log("CONFIG:", CONFIG);
    
    // Test API call
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/Form%20Responses%201?key=${CONFIG.API_KEY}`)
    .then(response => response.json())
    .then(data => {
        console.log("API works! Data:", data);
        if (data.values) {
            console.log("Headers:", data.values[0]);
            console.log("First row:", data.values[1]);
        }
    })
    .catch(error => console.error("API error:", error));
});
