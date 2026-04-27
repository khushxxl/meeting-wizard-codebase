// ========== TUTORIAL ==========
const tutorial = document.getElementById("tutorial");
const tutorialNext = document.getElementById("tutorialNext");
const tutorialSkip = document.getElementById("tutorialSkip");
const slides = document.querySelectorAll(".tutorial-slide");
const dots = document.querySelectorAll(".tutorial-dot");
let currentSlide = 0;

async function initTutorial() {
  const { tutorialDone } = await chrome.storage.local.get("tutorialDone");
  if (tutorialDone) {
    tutorial.classList.add("hidden");
  }
}

function goToSlide(index) {
  slides.forEach(s => s.classList.remove("active"));
  dots.forEach(d => d.classList.remove("active"));
  slides[index].classList.add("active");
  dots[index].classList.add("active");
  currentSlide = index;

  if (index === slides.length - 1) {
    tutorialNext.innerHTML = 'Get Started <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  }
}

function dismissTutorial() {
  tutorial.classList.add("hidden");
  chrome.storage.local.set({ tutorialDone: true });
}

tutorialNext.addEventListener("click", () => {
  if (currentSlide < slides.length - 1) {
    goToSlide(currentSlide + 1);
  } else {
    dismissTutorial();
  }
});

tutorialSkip.addEventListener("click", dismissTutorial);

initTutorial();

// ========== SETTINGS ==========
const settingsBtn = document.getElementById("settingsBtn");
const settingsClose = document.getElementById("settingsClose");
const settingsOverlay = document.getElementById("settingsOverlay");
const serverUrlInput = document.getElementById("serverUrlInput");
const apiKeyInput = document.getElementById("apiKeyInput");
const settingsSave = document.getElementById("settingsSave");
const settingsMessage = document.getElementById("settingsMessage");
const connectionStatus = document.getElementById("connectionStatus");

const DEFAULT_SERVER_URL = "https://meeting-wizard.vercel.app";

function normalizeUrl(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

async function getConfig() {
  const { serverUrl = DEFAULT_SERVER_URL, apiKey = "" } =
    await chrome.storage.local.get(["serverUrl", "apiKey"]);
  return { serverUrl: normalizeUrl(serverUrl) || DEFAULT_SERVER_URL, apiKey };
}

async function renderConnectionStatus() {
  const { serverUrl, apiKey } = await getConfig();
  if (serverUrl && apiKey) {
    connectionStatus.textContent = `Connected to ${serverUrl}`;
    connectionStatus.classList.remove("disconnected");
    connectionStatus.classList.add("connected");
  } else {
    connectionStatus.textContent = "Not connected. Add your server URL and API key.";
    connectionStatus.classList.remove("connected");
    connectionStatus.classList.add("disconnected");
  }
}

async function loadSettings() {
  const { serverUrl, apiKey } = await getConfig();
  serverUrlInput.value = serverUrl;
  apiKeyInput.value = apiKey;
  await renderConnectionStatus();
}

settingsBtn.addEventListener("click", async () => {
  await loadSettings();
  settingsOverlay.classList.remove("hidden");
});

settingsClose.addEventListener("click", () => {
  settingsOverlay.classList.add("hidden");
  settingsMessage.textContent = "";
});

settingsSave.addEventListener("click", async () => {
  const serverUrl = normalizeUrl(serverUrlInput.value);
  const apiKey = apiKeyInput.value.trim();

  if (!serverUrl || !apiKey) {
    settingsMessage.textContent = "Server URL and API key are both required.";
    return;
  }

  settingsSave.disabled = true;
  settingsMessage.textContent = "Testing connection...";

  try {
    // POST with empty body: valid key -> 400 (missing audio), bad key -> 401.
    const res = await fetch(`${serverUrl}/api/extension/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: new FormData(),
    });
    if (res.status === 401) throw new Error("Invalid API key");
    if (res.status !== 400) throw new Error(`Unexpected HTTP ${res.status}`);
    await chrome.storage.local.set({ serverUrl, apiKey });
    settingsMessage.textContent = "Saved. Connection verified.";
    await renderConnectionStatus();
  } catch (err) {
    settingsMessage.textContent = `Connection failed: ${err.message}`;
  } finally {
    settingsSave.disabled = false;
  }
});

// ========== MAIN APP ==========
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const timerEl = document.getElementById("timer");
const downloadArea = document.getElementById("downloadArea");
const downloadInfo = document.getElementById("downloadInfo");
const downloadLink = document.getElementById("downloadLink");
const uploadBtn = document.getElementById("uploadBtn");
const uploadBtnLabel = document.getElementById("uploadBtnLabel");
const uploadMeta = document.getElementById("uploadMeta");
const errorEl = document.getElementById("error");
const historyList = document.getElementById("historyList");
const includeMicToggle = document.getElementById("includeMicToggle");

let timerInterval = null;
let currentRecording = null; // { dataUrl, filename, duration, recordedAt }

async function init() {
  const response = await chrome.runtime.sendMessage({ action: "getStatus" });
  if (response && response.recording) {
    showRecordingState(response.startTime);
  }
  const { includeMic = true } = await chrome.storage.local.get("includeMic");
  includeMicToggle.checked = includeMic;
  includeMicToggle.addEventListener("change", () => {
    chrome.storage.local.set({ includeMic: includeMicToggle.checked });
  });
  loadHistory();
  await renderConnectionStatus();
}

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add("visible");
  setTimeout(() => errorEl.classList.remove("visible"), 8000);
}

function showRecordingState(startTime) {
  startBtn.style.display = "none";
  stopBtn.style.display = "inline-flex";
  statusDot.classList.add("recording");
  statusText.textContent = "Recording...";
  downloadArea.classList.remove("visible");

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = formatTime(elapsed);
  }, 500);
}

function showIdleState() {
  startBtn.style.display = "inline-flex";
  startBtn.disabled = false;
  stopBtn.style.display = "none";
  statusDot.classList.remove("recording");
  statusText.textContent = "Ready to record";
  timerEl.textContent = "00:00:00";
  clearInterval(timerInterval);
}

function resetUploadButton() {
  uploadBtn.disabled = false;
  uploadBtn.classList.remove("success");
  uploadBtnLabel.textContent = "Upload to Described";
  uploadMeta.textContent = "";
}

async function loadHistory() {
  const { sessions = [] } = await chrome.storage.local.get("sessions");

  if (sessions.length === 0) {
    historyList.innerHTML = '<li class="history-empty"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>No recordings yet</li>';
    return;
  }

  historyList.innerHTML = "";
  sessions.slice(0, 20).forEach((session) => {
    const li = document.createElement("li");
    const dateObj = new Date(session.date);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const statusLabel = session.uploaded ? " · uploaded" : "";
    li.innerHTML = `
      <span class="history-filename" title="${session.filename}">${session.filename}</span>
      <span class="history-meta">${dateStr} &middot; ${formatDuration(session.duration)}${statusLabel}</span>
    `;
    historyList.appendChild(li);
  });
}

// Start recording. Popup obtains the stream ID (user gesture lives here)
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  errorEl.classList.remove("visible");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showError("No active tab found.");
      startBtn.disabled = false;
      return;
    }

    const includeMic = includeMicToggle.checked;

    // Mic prompts require a user gesture. Request it here (popup has the gesture),
    // then release immediately. Offscreen will re-acquire it silently.
    if (includeMic) {
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
        tmp.getTracks().forEach(t => t.stop());
      } catch (err) {
        showError("Microphone blocked. Enable it for this extension or uncheck 'Include my microphone'.");
        startBtn.disabled = false;
        return;
      }
    }

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });

    const response = await chrome.runtime.sendMessage({
      action: "startRecording",
      streamId,
      includeMic
    });

    if (response && response.success) {
      showRecordingState(Date.now());
      if (includeMic && response.micIncluded === false) {
        showError(`Recording tab only. Mic failed: ${response.micError || "unknown"}`);
      }
    } else {
      showError(response?.error || "Failed to start recording.");
      startBtn.disabled = false;
    }
  } catch (err) {
    showError(err.message || "Failed to capture tab audio.");
    startBtn.disabled = false;
  }
});

// Stop recording
stopBtn.addEventListener("click", async () => {
  stopBtn.disabled = true;
  statusText.textContent = "Stopping...";

  const response = await chrome.runtime.sendMessage({ action: "stopRecording" });

  clearInterval(timerInterval);
  stopBtn.disabled = false;

  if (response && response.success) {
    showIdleState();
    statusText.textContent = "Recording saved";

    currentRecording = {
      dataUrl: response.dataUrl,
      filename: response.filename,
      duration: response.duration,
      recordedAt: new Date().toISOString(),
    };

    downloadInfo.textContent = `${response.filename} (${formatDuration(response.duration)})`;
    downloadLink.href = response.dataUrl;
    downloadLink.download = response.filename;

    resetUploadButton();
    downloadArea.classList.add("visible");
    loadHistory();
  } else {
    showError(response?.error || "Failed to stop recording.");
    showIdleState();
  }
});

// Upload to Described
uploadBtn.addEventListener("click", async () => {
  if (!currentRecording) return;

  const { serverUrl, apiKey } = await getConfig();
  if (!serverUrl || !apiKey) {
    showError("Set your server URL and API key in settings first.");
    settingsOverlay.classList.remove("hidden");
    await loadSettings();
    return;
  }

  uploadBtn.disabled = true;
  uploadBtnLabel.textContent = "Uploading...";
  uploadMeta.textContent = "This can take a minute for longer recordings.";

  try {
    const blob = await (await fetch(currentRecording.dataUrl)).blob();

    const form = new FormData();
    form.append("audio", blob, currentRecording.filename);
    form.append("duration_seconds", String(currentRecording.duration));
    form.append("recorded_at", currentRecording.recordedAt);

    const res = await fetch(`${serverUrl}/api/extension/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    uploadBtn.classList.add("success");
    uploadBtnLabel.textContent = "Uploaded";
    uploadMeta.textContent = "";
    const link = document.createElement("a");
    link.href = `${serverUrl}/meetings/${encodeURIComponent(data.meetingId)}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.style.color = "#0D7FFF";
    link.textContent = "Open meeting →";
    uploadMeta.appendChild(link);

    // Mark the most recent session as uploaded
    const { sessions = [] } = await chrome.storage.local.get("sessions");
    if (sessions[0]) {
      sessions[0].uploaded = true;
      sessions[0].meetingId = data.meetingId;
      await chrome.storage.local.set({ sessions });
      loadHistory();
    }
  } catch (err) {
    uploadBtn.disabled = false;
    uploadBtnLabel.textContent = "Upload to Described";
    uploadMeta.textContent = "";
    showError(`Upload failed: ${err.message}`);
  }
});

init();
