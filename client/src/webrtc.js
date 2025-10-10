export async function getLocalStream(constraints = { audio: true, video: true }) {
  return navigator.mediaDevices.getUserMedia(constraints);
}

export function createPeerConnection() {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  });
  return pc;
}

