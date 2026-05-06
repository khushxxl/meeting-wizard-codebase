// Records mixed tab + mic audio as 16-bit PCM WAV.
// We avoid MediaRecorder because its WebM output here ships corrupt EBML
// headers, which Whisper rejects. WAV gives us bytes we control end-to-end.

let audioContext = null;
let tabStream = null;
let micStream = null;
let processor = null;
let captureSource = null;
let pcmChunks = []; // Array<Float32Array>
let sampleRate = 0;
let recording = false;

const CHANNELS = 1;
const BUFFER_SIZE = 4096;

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

    audioContext = new AudioContext();
    sampleRate = audioContext.sampleRate;

    const mixDest = audioContext.createMediaStreamDestination();

    // Tab audio: into the recording AND to speakers (so user hears the meeting).
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(mixDest);
    tabSource.connect(audioContext.destination);

    // Mic audio: only into the recording (avoids feedback).
    if (micStream) {
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(mixDest);
    }

    // Capture mixed stream as Float32 PCM via ScriptProcessor.
    captureSource = audioContext.createMediaStreamSource(mixDest.stream);
    processor = audioContext.createScriptProcessor(BUFFER_SIZE, CHANNELS, CHANNELS);

    pcmChunks = [];
    processor.onaudioprocess = (e) => {
      if (!recording) return;
      const ch = e.inputBuffer.getChannelData(0);
      // Copy: the underlying buffer is reused across callbacks.
      pcmChunks.push(new Float32Array(ch));
    };

    captureSource.connect(processor);
    // ScriptProcessor only fires when connected to a destination.
    // Output buffer is left silent, so no doubled audio in speakers.
    processor.connect(audioContext.destination);

    recording = true;
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
  recording = false;
  if (processor) {
    try { processor.disconnect(); } catch (_) {}
    processor.onaudioprocess = null;
    processor = null;
  }
  if (captureSource) {
    try { captureSource.disconnect(); } catch (_) {}
    captureSource = null;
  }
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
  if (!recording) {
    sendResponse({ success: false, error: "No recording in progress." });
    return;
  }
  recording = false;

  // Flatten Float32 chunks then encode as 16-bit PCM WAV.
  const totalSamples = pcmChunks.reduce((sum, c) => sum + c.length, 0);
  const flat = new Float32Array(totalSamples);
  let offset = 0;
  for (const chunk of pcmChunks) {
    flat.set(chunk, offset);
    offset += chunk.length;
  }
  pcmChunks = [];

  const wav = encodeWav(flat, sampleRate, CHANNELS);
  cleanupStreams();

  const blob = new Blob([wav], { type: "audio/wav" });
  const reader = new FileReader();
  reader.onloadend = () => {
    sendResponse({ success: true, dataUrl: reader.result });
  };
  reader.readAsDataURL(blob);
}

// Build a 16-bit PCM WAV file from Float32 samples in [-1, 1].
function encodeWav(samples, sr, channels) {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sr * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);          // fmt chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);          // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(off, s | 0, true);
    off += 2;
  }
  return buffer;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
