let mediaRecorder = null;
let recordedChunks = [];
let audioContext = null;
let tabStream = null;
let micStream = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "offscreen-start") {
    startRecording(message.streamId, message.includeMic !== false, sendResponse);
    return true;
  }

  if (message.action === "offscreen-stop") {
    stopRecording(sendResponse);
    return true;
  }
});

async function startRecording(streamId, includeMic, sendResponse) {
  if (!streamId) {
    sendResponse({ success: false, error: "No stream ID provided." });
    return;
  }

  try {
    tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      }
    });

    let micError = null;
    if (includeMic) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        micError = err.message || "Microphone access denied";
        micStream = null;
      }
    }

    recordedChunks = [];

    audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Mix tab audio into the recording AND pipe it back to speakers
    // so the user still hears the meeting.
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(destination);
    tabSource.connect(audioContext.destination);

    // Mix mic audio into the recording, but NOT to speakers (would cause feedback).
    if (micStream) {
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
    }

    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/webm";
    }

    mediaRecorder = new MediaRecorder(destination.stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error("Offscreen MediaRecorder error:", event.error);
    };

    mediaRecorder.start(1000);
    sendResponse({
      success: true,
      micIncluded: Boolean(micStream),
      micError
    });
  } catch (err) {
    console.error("Offscreen startRecording error:", err);
    cleanupStreams();
    sendResponse({ success: false, error: err.message });
  }
}

function cleanupStreams() {
  if (tabStream) {
    tabStream.getTracks().forEach(t => t.stop());
    tabStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

function stopRecording(sendResponse) {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    sendResponse({ success: false, error: "No recording in progress." });
    return;
  }

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "audio/webm" });
    recordedChunks = [];

    cleanupStreams();
    mediaRecorder = null;

    const reader = new FileReader();
    reader.onloadend = () => {
      sendResponse({ success: true, dataUrl: reader.result });
    };
    reader.readAsDataURL(blob);
  };

  mediaRecorder.stop();
}
