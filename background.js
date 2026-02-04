// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ safetyScores: {} });
    chrome.storage.sync.set({
        googleSafeBrowsingApiKey: "",
        virusTotalApiKey: ""
    });
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
        checkSafety(request.url).catch(error => {
            console.error("Error running supplemental safety checks:", error);
        });
        return true; // Keep the message channel open for sendResponse
    }
});

// Fetch the safety score, or retrieve it from the BrowseBuddy API if not found locally
async function fetchSafetyScore(url) {
    const encodedUrl = encodeURIComponent(url);
    return fetch(`https://browsebuddy.onrender.com/api/check?url=${encodedUrl}`)
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

function getApiKeys() {
    return new Promise(resolve => {
        chrome.storage.sync.get({
            googleSafeBrowsingApiKey: "",
            virusTotalApiKey: ""
        }, resolve);
    });
}

function checkWithGoogleSafeBrowsing(url, apiKey) {
    if (!apiKey) {
        return Promise.resolve({ safe: true, skipped: true });
    }

    const requestUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

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

function checkWithVirusTotal(url, apiKey) {
    if (!apiKey) {
        return Promise.resolve({ safe: true, skipped: true });
    }

    const requestUrl = `https://www.virustotal.com/api/v3/urls`;

    // Encode the URL in base64
    const urlEncoded = btoa(url);

    return fetch(`${requestUrl}/${urlEncoded}`, {
        method: 'GET',
        headers: {
            'x-apikey': apiKey
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

async function checkSafety(url) {
    const { googleSafeBrowsingApiKey, virusTotalApiKey } = await getApiKeys();

    const [safeBrowsingResult, virusTotalResult] = await Promise.all([
        checkWithGoogleSafeBrowsing(url, googleSafeBrowsingApiKey),
        checkWithVirusTotal(url, virusTotalApiKey)
    ]);

    if (!safeBrowsingResult.safe) {
        notifyUser('This site is flagged by Google Safe Browsing!', 'unsafe');
    }

    if (!virusTotalResult.safe) {
        notifyUser('This site is flagged by VirusTotal!', 'unsafe');
    }

    return { safeBrowsingResult, virusTotalResult };
}
