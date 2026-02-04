function setStatus(message) {
  const status = document.getElementById("status");
  status.textContent = message;
  if (message) {
    setTimeout(() => {
      status.textContent = "";
    }, 2000);
  }
}

function restoreOptions() {
  chrome.storage.sync.get({
    googleSafeBrowsingApiKey: "",
    virusTotalApiKey: ""
  }, (items) => {
    document.getElementById("googleSafeBrowsingApiKey").value = items.googleSafeBrowsingApiKey;
    document.getElementById("virusTotalApiKey").value = items.virusTotalApiKey;
  });
}

function saveOptions() {
  const googleSafeBrowsingApiKey = document.getElementById("googleSafeBrowsingApiKey").value.trim();
  const virusTotalApiKey = document.getElementById("virusTotalApiKey").value.trim();

  chrome.storage.sync.set({
    googleSafeBrowsingApiKey,
    virusTotalApiKey
  }, () => {
    setStatus("Settings saved.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  document.getElementById("save").addEventListener("click", saveOptions);
});
