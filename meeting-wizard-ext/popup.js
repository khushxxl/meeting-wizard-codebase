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

// ========== MAIN APP ==========
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const timerEl = document.getElementById("timer");
const downloadArea = document.getElementById("downloadArea");
const downloadInfo = document.getElementById("downloadInfo");
const downloadLink = document.getElementById("downloadLink");
const errorEl = document.getElementById("error");
const historyList = document.getElementById("historyList");

let timerInterval = null;

// Initialize popup state
async function init() {
  const response = await chrome.runtime.sendMessage({ action: "getStatus" });
  if (response && response.recording) {
    showRecordingState(response.startTime);
  }
  loadHistory();
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
    li.innerHTML = `
      <span class="history-filename" title="${session.filename}">${session.filename}</span>
      <span class="history-meta">${dateStr} &middot; ${formatDuration(session.duration)}</span>
    `;
    historyList.appendChild(li);
  });
}

// Start recording — popup obtains the stream ID (user gesture lives here)
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  errorEl.classList.remove("visible");

  try {
    // 1. Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showError("No active tab found.");
      startBtn.disabled = false;
      return;
    }

    // 2. Get stream ID from the popup context (has user gesture)
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });

    // 3. Send stream ID to background to set up offscreen recording
    const response = await chrome.runtime.sendMessage({
      action: "startRecording",
      streamId
    });

    if (response && response.success) {
      showRecordingState(Date.now());
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

    downloadInfo.textContent = `${response.filename} (${formatDuration(response.duration)})`;
    downloadLink.href = response.dataUrl;
    downloadLink.download = response.filename;
    downloadArea.classList.add("visible");

    loadHistory();
  } else {
    showError(response?.error || "Failed to stop recording.");
    showIdleState();
  }
});

init();
