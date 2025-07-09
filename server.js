const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("call-user", (data) => {
    io.to(data.to).emit("incoming-call", {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on("answer-call", (data) => {
    io.to(data.to).emit("call-answered", {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on("decline-call", (data) => {
    io.to(data.to).emit("call-declined");
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
    if (clients.length === 2) {
      io.to(room).emit("ready");
    }
  });
});

server.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
