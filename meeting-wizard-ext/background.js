let recording = false;
let recordingStartTime = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRecording") {
    handleStartRecording(message.streamId, message.includeMic !== false, sendResponse);
    return true;
  }

  if (message.action === "stopRecording") {
    handleStopRecording(sendResponse);
    return true;
  }

  if (message.action === "getStatus") {
    sendResponse({ recording, startTime: recordingStartTime });
    return false;
  }
});

async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"]
  });
  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Recording tab audio via MediaRecorder"
  });
}

async function handleStartRecording(streamId, includeMic, sendResponse) {
  if (recording) {
    sendResponse({ success: false, error: "Recording already in progress." });
    return;
  }

  try {
    await ensureOffscreenDocument();

    // Small delay to ensure offscreen document script is loaded
    await new Promise(r => setTimeout(r, 100));

    const response = await chrome.runtime.sendMessage({
      action: "offscreen-start",
      streamId,
      includeMic
    });

    if (response && response.success) {
      recording = true;
      recordingStartTime = Date.now();
      sendResponse({
        success: true,
        micIncluded: response.micIncluded,
        micError: response.micError
      });
    } else {
      sendResponse({ success: false, error: response?.error || "Offscreen recording failed." });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleStopRecording(sendResponse) {
  if (!recording) {
    sendResponse({ success: false, error: "No recording in progress." });
    return;
  }

  try {
    const duration = Math.round((Date.now() - recordingStartTime) / 1000);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const filename = `meeting-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}.webm`;

    const response = await chrome.runtime.sendMessage({
      action: "offscreen-stop"
    });

    recording = false;
    recordingStartTime = null;

    if (response && response.success) {
      const session = {
        id: Date.now().toString(),
        filename,
        date: now.toISOString(),
        duration
      };

      const { sessions = [] } = await chrome.storage.local.get("sessions");
      sessions.unshift(session);
      if (sessions.length > 50) sessions.length = 50;
      await chrome.storage.local.set({ sessions });

      sendResponse({ success: true, dataUrl: response.dataUrl, filename, duration });
    } else {
      sendResponse({ success: false, error: response?.error || "Failed to stop recording." });
    }
  } catch (err) {
    recording = false;
    recordingStartTime = null;
    sendResponse({ success: false, error: err.message });
  }
}
