document.addEventListener('DOMContentLoaded', async () => {
  const nukeBtn = document.getElementById('nukeBtn');
  const statusText = document.getElementById('statusText');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');

  const oledToggle = document.getElementById('oledToggle');
  const accentToggle = document.getElementById('accentToggle');

  chrome.storage.local.get({
    nukeActive: false,
    oledMode: true,
    accentMode: true,
    notesEnabled: true,
    superNukeMode: false
  }, (result) => {
    updateNukeUI(result.nukeActive);
    oledToggle.checked = result.oledMode;
    accentToggle.checked = result.accentMode;

    const notesToggle = document.getElementById('notesToggle');
    if (notesToggle) {
      notesToggle.checked = result.notesEnabled;
      notesToggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ notesEnabled: e.target.checked });
      });
    }

    const superNukeToggle = document.getElementById('superNukeToggle');
    if (superNukeToggle) {
      superNukeToggle.checked = result.superNukeMode;
      superNukeToggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ superNukeMode: e.target.checked });
      });
    }
  });

  // settings button
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  // nuke button
  nukeBtn.addEventListener('click', () => {
    chrome.storage.local.get({ nukeActive: false }, (result) => {
      const newState = !result.nukeActive;
      chrome.storage.local.set({ nukeActive: newState }, () => {
        updateNukeUI(newState);
      });
    });
  });

  // settings toggles
  oledToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ oledMode: e.target.checked });
  });

  accentToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ accentMode: e.target.checked });
  });

  function updateNukeUI(isActive) {
    if (isActive) {
      nukeBtn.classList.add('active');
      statusText.textContent = "Focus Nuke Active";
      statusText.className = "status-on";
    } else {
      nukeBtn.classList.remove('active');
      statusText.textContent = "Distractions Active";
      statusText.className = "status-off";
    }
  }
});
