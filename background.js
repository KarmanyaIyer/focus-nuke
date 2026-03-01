
chrome.runtime.onInstalled.addListener(() => {
    // Initialize default state
    chrome.storage.local.get({
        nukeActive: false,
        oledMode: true,
        accentMode: true
    }, (result) => {
        chrome.storage.local.set(result);
    });
});


chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {

        console.log('[Focus Nuke] State updated:', changes);
    }
});
