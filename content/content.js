// content.js - Applies states and restructures YouTube UI

let state = {
    nukeActive: false,
    oledMode: false,
    accentMode: false,
    notesEnabled: true
};

chrome.storage.local.get(['nukeActive', 'oledMode', 'accentMode', 'notesEnabled'], (result) => {
    if (result.nukeActive !== undefined) state.nukeActive = result.nukeActive;
    if (result.oledMode !== undefined) state.oledMode = result.oledMode;
    if (result.accentMode !== undefined) state.accentMode = result.accentMode;
    if (result.notesEnabled !== undefined) state.notesEnabled = result.notesEnabled;

    applyStateClasses();
    if (state.nukeActive) {
        restructureUI();
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.nukeActive) state.nukeActive = changes.nukeActive.newValue;
        if (changes.oledMode) state.oledMode = changes.oledMode.newValue;
        if (changes.accentMode) state.accentMode = changes.accentMode.newValue;
        if (changes.notesEnabled) {
            state.notesEnabled = changes.notesEnabled.newValue;
            setupFocusNotes();
        }

        applyStateClasses();
        if (state.nukeActive) {
            restructureUI();
        } else {
            revertUI();
        }
    }
});

function applyStateClasses() {
    const body = document.body;
    if (!body) return;

    if (state.nukeActive) body.classList.add('fn-nuked');
    else body.classList.remove('fn-nuked');

    if (state.oledMode) body.classList.add('fn-oled');
    else body.classList.remove('fn-oled');

    if (state.accentMode) body.classList.add('fn-accent');
    else body.classList.remove('fn-accent');
}

document.addEventListener('DOMContentLoaded', () => {
    applyStateClasses();
    handleNavigation();
});

document.addEventListener('yt-navigate-finish', handleNavigation);

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        document.body.classList.add('fn-fullscreen');
    } else {
        document.body.classList.remove('fn-fullscreen');
    }
});

function handleNavigation() {
    setupWatchPageContext();
    if (state.nukeActive) {
        restructureUI();
    }
    setupFocusNotes();
}

function setupWatchPageContext() {
    const isWatchPage = window.location.pathname.startsWith('/watch');
    if (isWatchPage) {
        document.body.classList.add('fn-watch-page');
    } else {
        document.body.classList.remove('fn-watch-page');
    }
}

function restructureUI() {
    if (document.getElementById('fn-custom-nav')) return;

    const masthead = document.querySelector('ytd-masthead');
    if (masthead) {
        const customNav = document.createElement('div');
        customNav.id = 'fn-custom-nav';
        customNav.className = 'fn-injected-nav';
        customNav.innerHTML = `
      <a href="/feed/history">History</a>
      <a href="/feed/playlists">Playlists</a>
      <a href="/feed/courses">Courses</a>
    `;
        masthead.appendChild(customNav);

        const center = document.getElementById('center');
        if (center) {
            if (!document.getElementById('fn-logo')) {
                const logoLink = document.createElement('a');
                logoLink.href = '/';
                logoLink.id = 'fn-logo';
                logoLink.className = 'fn-logo-inject';

                const logoImg = document.createElement('img');
                logoImg.src = chrome.runtime.getURL('assets/icon48.png');
                logoLink.appendChild(logoImg);

                center.insertBefore(logoLink, center.firstChild);
            }


            function tagProfileBtn() {
                let avatarBtn = document.getElementById('avatar-btn');
                if (!avatarBtn) {
                    avatarBtn = document.querySelector('yt-img-shadow#avatar');
                }
                const container = avatarBtn?.closest('ytd-topbar-menu-button-renderer') || avatarBtn;
                if (container) {
                    if (!container.classList.contains('fn-profile-btn')) {
                        container.classList.add('fn-profile-btn');
                    }

                    const center = document.getElementById('center');
                    if (center && !center.contains(container)) {
                        center.appendChild(container);
                    }
                    return true;
                }
                return !!document.querySelector('.fn-profile-btn');
            }

            if (!tagProfileBtn()) {
                const observer = new MutationObserver((mutations, obs) => {
                    if (tagProfileBtn()) {
                        obs.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => observer.disconnect(), 10000);
            }
        }

        if (!document.getElementById('fn-floating-logo')) {
            const floatingLogo = document.createElement('a');
            floatingLogo.href = '/';
            floatingLogo.id = 'fn-floating-logo';
            floatingLogo.className = 'fn-floating-logo';

            const floatingImg = document.createElement('img');
            floatingImg.src = chrome.runtime.getURL('assets/icon48.png');
            floatingLogo.appendChild(floatingImg);

            document.body.appendChild(floatingLogo);
        }

        const start = document.getElementById('start');
        if (start) start.style.display = 'none';
    } else {
        setTimeout(restructureUI, 500);
    }
}

function revertUI() {
    const customNav = document.getElementById('fn-custom-nav');
    if (customNav) customNav.remove();

    const logo = document.getElementById('fn-logo');
    if (logo) logo.remove();

    const floatingLogo = document.getElementById('fn-floating-logo');
    if (floatingLogo) floatingLogo.remove();

    const profileBtn = document.querySelector('.fn-profile-btn');
    if (profileBtn) profileBtn.classList.remove('fn-profile-btn');

    const start = document.getElementById('start');
    if (start) start.style.display = '';
}

// Focus Notes Module

let currentVideoId = null;

function extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function setupFocusNotes() {
    const videoId = extractVideoId();

    if (!videoId || !state.nukeActive || !state.notesEnabled) {
        removeFocusNotes();
        currentVideoId = null;
        return;
    }

    if (currentVideoId === videoId && document.getElementById('fn-notes-container')) {
        return;
    }

    currentVideoId = videoId;
    removeFocusNotes();

    const container = document.createElement('div');
    container.id = 'fn-notes-container';

    container.innerHTML = `
        <button id="fn-notes-toggle" class="fn-notes-btn" title="Focus Notes">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <div id="fn-notes-panel" class="fn-notes-panel hidden">
            <div class="fn-notes-header">
                <span>Focus Notes</span>
                <button id="fn-notes-close" class="fn-notes-close">&times;</button>
            </div>
            <div id="fn-notes-list" class="fn-notes-list"></div>
            <div class="fn-notes-input-area">
                <textarea id="fn-notes-textarea" class="fn-notes-textarea" placeholder="Jot down a new note..."></textarea>
                <div class="fn-notes-controls">
                    <button id="fn-notes-save" class="fn-notes-save">Save Note</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    const toggleBtn = document.getElementById('fn-notes-toggle');
    const panel = document.getElementById('fn-notes-panel');
    const closeBtn = document.getElementById('fn-notes-close');
    const saveBtn = document.getElementById('fn-notes-save');
    const textarea = document.getElementById('fn-notes-textarea');

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            textarea.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.add('hidden');
    });

    const storageKey = `fn_notes_array_${videoId}`;
    const legacyKey = `fn_note_${videoId}`; // Keep for migration

    let notesArray = [];

    function renderNotes() {
        const list = document.getElementById('fn-notes-list');
        list.innerHTML = '';
        notesArray.forEach((note, index) => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'fn-note-item';

            const noteText = document.createElement('div');
            noteText.className = 'fn-note-text';
            noteText.textContent = note;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'fn-note-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Delete Note';
            deleteBtn.onclick = () => {
                notesArray.splice(index, 1);
                chrome.storage.local.set({ [storageKey]: notesArray }, renderNotes);
            };

            noteDiv.appendChild(noteText);
            noteDiv.appendChild(deleteBtn);
            list.appendChild(noteDiv);
        });
        list.scrollTop = list.scrollHeight;
    }

    // Load existing notes
    chrome.storage.local.get([storageKey, legacyKey], (result) => {
        if (result[storageKey]) {
            notesArray = result[storageKey];
        } else if (result[legacyKey]) {

            if (result[legacyKey].trim().length > 0) {
                notesArray = [result[legacyKey]];
                chrome.storage.local.set({ [storageKey]: notesArray });
            }
        }
        renderNotes();
    });

    saveBtn.addEventListener('click', () => {
        const content = textarea.value.trim();
        if (content.length === 0) return;

        notesArray.push(content);
        chrome.storage.local.set({ [storageKey]: notesArray }, () => {
            textarea.value = '';
            renderNotes();

            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.color = '#4dd0e1';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.color = '';
            }, 1000);
        });
    });
}

function removeFocusNotes() {
    const container = document.getElementById('fn-notes-container');
    if (container) container.remove();
}
