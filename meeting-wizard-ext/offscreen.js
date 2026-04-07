let mediaRecorder = null;
let recordedChunks = [];
let audioContext = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "offscreen-start") {
    startRecording(message.streamId, sendResponse);
    return true;
  }

  if (message.action === "offscreen-stop") {
    stopRecording(sendResponse);
    return true;
  }
});

async function startRecording(streamId, sendResponse) {
  if (!streamId) {
    sendResponse({ success: false, error: "No stream ID provided." });
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      }
    });

    recordedChunks = [];

    // Pipe audio back to speakers so the user can still hear it
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination);

    // Try audio/webm with opus, fall back to plain audio/webm
    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/webm";
    }

    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error("Offscreen MediaRecorder error:", event.error);
    };

    mediaRecorder.start(1000);
    sendResponse({ success: true });
  } catch (err) {
    console.error("Offscreen startRecording error:", err);
    sendResponse({ success: false, error: err.message });
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

    // Stop all tracks and close audio context
    if (mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    mediaRecorder = null;

    const reader = new FileReader();
    reader.onloadend = () => {
      sendResponse({ success: true, dataUrl: reader.result });
    };
    reader.readAsDataURL(blob);
  };

  mediaRecorder.stop();
}
