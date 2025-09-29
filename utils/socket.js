// src/socket.js
const { Server } = require("socket.io");

let ioInstance;

function init(server, corsOptions) {
  if (!ioInstance) {
    ioInstance = new Server(server, { cors: corsOptions });

    ioInstance.on("connection", (socket) => {
      console.log("Yeni socket bağlandı:", socket.id);
      socket.on("joinRoom", (roomName) => {
        console.log(`${socket.id} joined ${roomName}`);
        socket.join(roomName);
      });
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
  }
  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.IO not initialized yet");
  return ioInstance;
}

module.exports = { init, getIO };
