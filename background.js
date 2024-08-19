let safetyScores = {};

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ safetyScores: {} });
});

// Handle messages from content or popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "submitSafetyScore") {
        submitSafetyScore(request.url, request.score, request.user).then(response => {
            sendResponse({ status: "success", message: "Score added successfully!" });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        });
        return true; // Keep the message channel open for sendResponse
    } else if (request.action === "getSafetyScore") {
        fetchSafetyScore(request.url).then(scoreData => {
            sendResponse(scoreData);
        }).catch(error => {
            sendResponse({ score: "Not reviewed", message: "" });
        });
        return true; // Keep the message channel open for sendResponse
    }
});

// Fetch the safety score, or retrieve it from the BrowseBuddy API if not found locally
async function fetchSafetyScore(url) {
    return fetch(`https://browsebuddy.onrender.com/api/check?url=${url}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.score !== undefined) {
                return { score: data.score, message: "Fetched from API" };
            } else {
                return { score: "Not reviewed", message: "" };
            }
        })
        .catch(error => {
            console.error('Error fetching safety score:', error);
            return { score: "Not reviewed", message: "" };
        });
}

// Submit the safety score to the BrowseBuddy API
function submitSafetyScore(url, score, user) {
    return fetch("https://browsebuddy.onrender.com/api/submit", {
        method: "POST",
        body: JSON.stringify({ url, score, user }),
        headers: { "Content-Type": "application/json" }
    })
        .then(response => response.json());
}


// Notify the user about site safety
function notifyUser(message, type) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: type === 'unsafe' ? "icons/icon_red.png" : "icons/icon_green.png",
        title: "Safety Alert",
        message: message
    });
}












const GOOGLE_SAFE_BROWSING_API_KEY = "AIzaSyDd4dLoXFwoWf2CVSh5-QzxgAKurRkUC4A";



function checkWithGoogleSafeBrowsing(url) {
    const requestUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`;

    const body = {
        client: {
            clientId: "yourcompanyname",
            clientVersion: "1.5.2"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url }]
        }
    };

    return fetch(requestUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(data => {
            if (data.matches) {
                return { safe: false, data: data.matches };
            }
            return { safe: true };
        })
        .catch(error => {
            console.error('Error checking Google Safe Browsing:', error);
            return { safe: true }; // Default to safe if error
        });
}

// Usage within the checkSafety function
async function checkSafety(url) {
    // Existing logic...

    // Check with Google Safe Browsing
    const safeBrowsingResult = await checkWithGoogleSafeBrowsing(url);
    if (!safeBrowsingResult.safe) {
        notifyUser('This site is flagged by Google Safe Browsing!', 'unsafe');
    }

    // Additional logic...
}












const VIRUSTOTAL_API_KEY = "60e36d5ffd98adaed48b99828f8689163bc43c75bc96793036b49bef4f18f17c";

function checkWithVirusTotal(url) {
    const requestUrl = `https://www.virustotal.com/api/v3/urls`;

    // Encode the URL in base64
    const urlEncoded = btoa(url);

    return fetch(`${requestUrl}/${urlEncoded}`, {
        method: 'GET',
        headers: {
            'x-apikey': VIRUSTOTAL_API_KEY
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.data.attributes.last_analysis_stats.malicious > 0) {
                return { safe: false, data: data.data.attributes.last_analysis_stats };
            }
            return { safe: true };
        })
        .catch(error => {
            console.error('Error checking VirusTotal:', error);
            return { safe: true }; // Default to safe if error
        });
}

// Usage within the checkSafety function
async function checkSafety(url) {
    // Existing logic...

    // Check with VirusTotal
    const virusTotalResult = await checkWithVirusTotal(url);
    if (!virusTotalResult.safe) {
        notifyUser('This site is flagged by VirusTotal!', 'unsafe');
    }

    // Additional logic...
}
