const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const connectDB = require("./config/db");
const { env } = require("./config/env");
const User = require("./models/User");
const ChatMessage = require("./models/ChatMessage");
const StudyGroup = require("./models/StudyGroup");
const ensureDevUsers = require("./scripts/ensureDevUsers");
const { freePort } = require("./scripts/freePort");

const startServer = async () => {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      throw new Error("MongoDB connection is required. Check MONGO_URI in backend/.env");
    }

    if (process.env.NODE_ENV !== "production") {
      await ensureDevUsers();
    }

    // Free the port again right before listen — Atlas connect can take a while,
    // and another old Node process may grab :5000 during that wait.
    freePort(env.PORT);

    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
    });

    // Socket auth middleware — verify JWT from query param
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication required"));

        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("name email role");
        if (!user) return next(new Error("User not found"));

        socket.user = user;
        next();
      } catch {
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      // Join a study group room
      socket.on("joinGroup", async (groupId) => {
        try {
          const group = await StudyGroup.findById(groupId).select("members");
          if (!group) return;
          const isMember = group.members.some((m) => String(m.user) === String(socket.user._id));
          if (!isMember) return;

          socket.join(groupId);
          socket.currentGroup = groupId;
        } catch { /* ignore */ }
      });

      // Leave a study group room
      socket.on("leaveGroup", (groupId) => {
        socket.leave(groupId);
        if (socket.currentGroup === groupId) socket.currentGroup = null;
      });

      // Send a chat message
      socket.on("sendMessage", async (data) => {
        try {
          const { groupId, content } = data;
          if (!groupId || !content?.trim()) return;

          const group = await StudyGroup.findById(groupId).select("members");
          if (!group) return;
          const isMember = group.members.some((m) => String(m.user) === String(socket.user._id));
          if (!isMember) return;

          const msg = await ChatMessage.create({
            group: groupId,
            sender: socket.user._id,
            content: content.trim(),
          });

          const populated = {
            _id: msg._id,
            group: msg.group,
            content: msg.content,
            messageType: msg.messageType,
            createdAt: msg.createdAt,
            sender: { _id: socket.user._id, name: socket.user.name },
          };

          io.to(groupId).emit("newMessage", populated);
        } catch { /* ignore */ }
      });

      // Typing indicator
      socket.on("typing", (data) => {
        const { groupId } = data;
        if (!groupId) return;
        socket.to(groupId).emit("userTyping", {
          userId: socket.user._id,
          name: socket.user.name,
        });
      });

      socket.on("stopTyping", (data) => {
        const { groupId } = data;
        if (!groupId) return;
        socket.to(groupId).emit("userStopTyping", {
          userId: socket.user._id,
        });
      });

      socket.on("disconnect", () => {
        if (socket.currentGroup) {
          socket.to(socket.currentGroup).emit("userStopTyping", {
            userId: socket.user._id,
          });
        }
      });
    });

    httpServer.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });

    httpServer.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${env.PORT} is already in use. Stop the other process or run: npm run free-port`
        );
        process.exit(1);
      }
      throw error;
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Rejection:", error.message);
      httpServer.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
