chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.prompt) {
    const { prompt } = request;
    const url = window.location.hostname;

    /**
     * Waits for an element to appear in the DOM and then executes a callback.
     * @param {string} selector The CSS selector of the element.
     * @param {function(HTMLElement)} callback The function to execute with the element.
     * @param {number} timeout The timeout in milliseconds to stop waiting.
     */
    const waitForElement = (selector, callback, timeout = 10000) => {
      const startTime = Date.now();
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect(); // Stop observing
          callback(element);
        } else if (Date.now() - startTime > timeout) {
          obs.disconnect();
          console.error(`Element with selector "${selector}" not found after ${timeout}ms.`);
        }
      });

      // Start observing the document body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also check if the element already exists
      const initialElement = document.querySelector(selector);
      if(initialElement) {
          observer.disconnect();
          callback(initialElement);
      }
    };

    /**
     * Simulates a user typing into a textarea or input field.
     * @param {HTMLElement} element The textarea or input element.
     * @param {string} text The text to input.
     */
    const simulateUserInput = (element, text) => {
      element.focus();
      // Setting the value directly is often not enough for modern frameworks.
      // We need to dispatch events to make the framework's state update.
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };

    /**
     * Sets content for a contenteditable div and dispatches events.
     * @param {HTMLElement} element The contenteditable element.
     * @param {string} text The text to input.
     */
    const simulateContentEditableInput = (element, text) => {
        element.focus();
        element.innerHTML = text; // More reliable than execCommand
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    switch (true) {
      case url.includes('chatgpt.com'):
        waitForElement('#prompt-textarea', (textarea) => {
          simulateUserInput(textarea, prompt);
          // The send button is often a sibling or near the textarea
          waitForElement('button[data-testid="send-button"]', (button) => {
            button.click();
          });
        });
        break;

      case url.includes('gemini.google.com'):
        // Gemini uses a contenteditable div for input
        waitForElement('.query-box [role="textbox"]', (textbox) => {
          simulateContentEditableInput(textbox, prompt);
          waitForElement('button.send-button', (button) => {
            button.click();
          });
        });
        break;

      case url.includes('claude.ai'):
        // Claude also uses a contenteditable div
        waitForElement('div[contenteditable="true"]', (textbox) => {
          simulateContentEditableInput(textbox, prompt);
          // Find the submit button, which might not have a stable selector
          waitForElement('button[aria-label*="Send"]', (button) => {
            if (!button.disabled) {
              button.click();
            }
          });
        });
        break;

      case url.includes('perplexity.ai'):
        waitForElement('textarea[placeholder*="Ask"]', (textarea) => {
          simulateUserInput(textarea, prompt);
          // Perplexity's submit button is often an sibling of the parent of the textarea
          waitForElement('button[type="submit"]', (button) => {
            if(!button.disabled) {
                button.click();
            }
          });
        });
        break;
    }

    // Indicate that the message was received.
    sendResponse({status: "done"});
    return true; // Keep the message channel open for async response
  }
});
