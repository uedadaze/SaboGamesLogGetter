// SabotennGamesLogGetter - Background Service Worker
// コンテンツスクリプトからのリクエストに応じてタブのスクリーンショットをキャプチャする

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'captureVisibleTab') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message;
                console.error('[SabotennLogGetter BG] Capture failed:', errorMsg);
                sendResponse({ dataUrl: null, error: errorMsg });
            } else {
                sendResponse({ dataUrl: dataUrl, error: null });
            }
        });
        return true; // 非同期でレスポンスを返すために必要
    }
});
