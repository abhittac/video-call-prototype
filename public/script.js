const socket = io();
const callBtn = document.getElementById("callBtn");
const answerBtn = document.getElementById("answerBtn");
const declineBtn = document.getElementById("declineBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peer;
const FIXED_RECEIVER_ID = "receiver"; // you can hardcode both clients with role: caller or receiver

// Simulate joining room
const role = prompt("Enter your role: 'caller' or 'receiver'");
socket.emit("join-room", "room1");

// Setup media
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    localStream = stream;
  });

callBtn.onclick = async () => {
  peer = createPeer();
  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("call-user", { to: FIXED_RECEIVER_ID, offer });
};

socket.on("incoming-call", async (data) => {
  answerBtn.hidden = false;
  declineBtn.hidden = false;

  answerBtn.onclick = async () => {
    peer = createPeer();
    localStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, localStream));
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("answer-call", { to: data.from, answer });
    answerBtn.hidden = true;
    declineBtn.hidden = true;
  };

  declineBtn.onclick = () => {
    socket.emit("decline-call", { to: data.from });
    answerBtn.hidden = true;
    declineBtn.hidden = true;
  };
});

socket.on("call-answered", async (data) => {
  await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("call-declined", () => {
  alert("Call declined.");
});

// WebRTC peer creation
function createPeer() {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  return pc;
}
