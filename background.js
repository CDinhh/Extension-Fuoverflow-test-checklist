chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "captureTab") {
    const options = { format: "png" };
    const windowId = sender.tab?.windowId;

    const capture = (targetWindowId, callback) => {
      try {
        if (typeof targetWindowId === "number") {
          chrome.tabs.captureVisibleTab(targetWindowId, options, (dataUrl) => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.warn("Capture with target windowId failed, retrying with default window:", err.message);
              chrome.tabs.captureVisibleTab(null, options, callback);
            } else {
              callback(dataUrl);
            }
          });
        } else {
          chrome.tabs.captureVisibleTab(null, options, callback);
        }
      } catch (e) {
        chrome.tabs.captureVisibleTab(null, options, callback);
      }
    };

    capture(windowId, (dataUrl) => {
      const err = chrome.runtime.lastError;
      if (err || !dataUrl) {
        const errorMsg = err?.message || "Không thể chụp được nội dung tab";
        console.error("FuOverflow captureVisibleTab error:", errorMsg);
        sendResponse({ success: false, error: errorMsg });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });

    return true; // Keep message channel open for asynchronous response
  }
});
