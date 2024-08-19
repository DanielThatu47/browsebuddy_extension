(function () {
  function injectSafetyBadge(score, message) {
      let badge = document.getElementById('safety-badge');
      
      if (!badge) {
          badge = document.createElement('div');
          badge.id = 'safety-badge';
          badge.style.position = 'fixed';
          badge.style.bottom = '10px';
          badge.style.right = '10px';
          badge.style.padding = '5px 10px';
          badge.style.borderRadius = '5px';
          badge.style.zIndex = '10000';
          badge.style.fontWeight = 'bold';
          badge.style.fontSize = '14px';
          document.body.appendChild(badge);
      }

      if (score === "Not reviewed") {
          badge.style.backgroundColor = 'yellow';
          badge.style.color = 'black';
          badge.innerText = 'Safety Score: Not reviewed';
      } else if (score < 50) {
          badge.style.backgroundColor = 'red';
          badge.style.color = 'white';
          badge.innerText = `Safety Score: ${score} (Unsafe)`;
      } else {
          badge.style.backgroundColor = 'green';
          badge.style.color = 'white';
          badge.innerText = `Safety Score: ${score} (Safe)`;
      }

      badge.innerText += `\n${message || ''}`;
  }

  // Fetch and inject the safety score badge
  function fetchAndDisplaySafetyScore() {
      const url = location.hostname;

      chrome.runtime.sendMessage({ action: 'getSafetyScore', url }, (response) => {
          if (response && response.score !== undefined) {
              injectSafetyBadge(response.score, response.message);
          } else {
              injectSafetyBadge('Not reviewed');
          }
      });
  }

  fetchAndDisplaySafetyScore();

  // Listen for updates to the score and re-inject the badge
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateSafetyScore') {
          injectSafetyBadge(request.score, request.message);
      }
  });
})();
