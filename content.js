chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.prompt) {
    const { prompt } = request;
    const url = window.location.hostname;

    const waitForElement = (selector, callback, timeout = 10000) => {
      const startTime = Date.now();
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          callback(element);
        } else if (Date.now() - startTime > timeout) {
          obs.disconnect();
          console.error(`[AI Broadcaster] Element with selector "${selector}" not found on ${url} after ${timeout}ms.`);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      const initialElement = document.querySelector(selector);
      if(initialElement) {
          observer.disconnect();
          callback(initialElement);
      }
    };

    const simulateUserInput = (element, text) => {
      element.focus();
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    };

    const simulateContentEditableInput = (element, text) => {
        element.focus();
        element.innerHTML = text;
        element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    };

    const fillAndClick = (inputSelector, buttonSelector, text, clickDelay = 100) => {
      waitForElement(inputSelector, (input) => {
        if (input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input') {
            simulateUserInput(input, text);
        } else {
            simulateContentEditableInput(input, text);
        }

        waitForElement(buttonSelector, (button) => {
            setTimeout(() => {
                if (!button.disabled) {
                    button.click();
                    sendResponse({status: "success", site: url});
                } else {
                    console.error(`[AI Broadcaster] Button "${buttonSelector}" on ${url} is disabled.`);
                    sendResponse({status: "error", message: "Button is disabled", site: url});
                }
            }, clickDelay);
        });
      });
    };

    switch (true) {
      case url.includes('chatgpt.com'):
        fillAndClick(
            'textarea[placeholder*="Message"]',
            'button[data-testid="send-button"]',
            prompt
        );
        break;

      case url.includes('gemini.google.com'):
        fillAndClick(
            '.query-box [role="textbox"]',
            'button.send-button',
            prompt
        );
        break;

      case url.includes('claude.ai'):
        fillAndClick(
            'div[contenteditable="true"]',
            'button[aria-label*="Send"]',
            prompt,
            300 // Add a 300ms delay for Claude
        );
        break;

      case url.includes('perplexity.ai'):
        fillAndClick(
            'textarea[placeholder*="Ask"]',
            'button[aria-label="Submit"]',
            prompt
        );
        break;
    }

    return true; // Keep the message channel open for the async response from fillAndClick
  }
});
