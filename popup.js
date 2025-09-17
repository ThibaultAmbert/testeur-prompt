document.addEventListener('DOMContentLoaded', function() {
  const submitButton = document.getElementById('submit-button');
  const promptTextarea = document.getElementById('prompt-textarea');
  const aiCheckboxes = document.querySelectorAll('#ai-options input[type="checkbox"]');

  submitButton.addEventListener('click', function() {
    const promptText = promptTextarea.value;
    const selectedUrls = [];
    aiCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedUrls.push(checkbox.value);
      }
    });

    if (promptText && selectedUrls.length > 0) {
      chrome.runtime.sendMessage({ prompt: promptText, urls: selectedUrls });
      window.close();
    }
  });
});
