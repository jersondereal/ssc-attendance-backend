const { Server } = require("socket.io");

let io = null;

function initSocket(server, allowedOrigins) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-event", (eventId) => {
      if (eventId) socket.join(`event-${eventId}`);
    });
    socket.on("leave-event", (eventId) => {
      if (eventId) socket.leave(`event-${eventId}`);
    });
  });

  return io;
}

function emitAttendanceHistoryCreated(eventId, entry) {
  if (!io) return;
  io.to(`event-${eventId}`).emit("attendance-history:created", entry);
}

module.exports = { initSocket, emitAttendanceHistoryCreated };
