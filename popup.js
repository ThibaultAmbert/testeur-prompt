document.addEventListener('DOMContentLoaded', function() {
  const submitButton = document.getElementById('submit-button');
  const promptTextarea = document.getElementById('prompt-textarea');

  submitButton.addEventListener('click', function() {
    const promptText = promptTextarea.value;
    if (promptText) {
      chrome.runtime.sendMessage({ prompt: promptText });
      window.close();
    }
  });
});
