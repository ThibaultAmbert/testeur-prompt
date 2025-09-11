// A map to store the prompt for each tab we open.
// We'll use this to pass the prompt to the content script once the tab is ready.
const tabPrompts = new Map();

// 1. Listen for the message from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.prompt) {
    const urls = [
      "https://chatgpt.com/",
      "https://gemini.google.com/app?hl=fr",
      "https://claude.ai/new",
      "https://www.perplexity.ai/"
    ];

    // 2. Create a new tab for each URL
    urls.forEach(url => {
      chrome.tabs.create({ url: url, active: false }, (tab) => {
        // Store the prompt for this specific tab's ID
        tabPrompts.set(tab.id, request.prompt);
      });
    });
  }
});

// 3. Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab has finished loading and if it's one of the tabs we're tracking
  if (changeInfo.status === 'complete' && tabPrompts.has(tabId)) {
    // 4. Inject the content script into the tab
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(() => {
      // 5. Send the prompt to the content script in that tab
      const prompt = tabPrompts.get(tabId);
      chrome.tabs.sendMessage(tabId, { prompt: prompt }, () => {
        // 6. Clean up the map entry after the prompt has been sent
        tabPrompts.delete(tabId);
      });
    }).catch(err => console.error('Failed to inject script: ', err));
  }
});

// 7. Clean up if a tab is closed before we're done with it
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabPrompts.has(tabId)) {
    tabPrompts.delete(tabId);
  }
});
