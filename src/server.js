const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { setupWebSocket } = require('./websocket');
const routes = require('./routes');
const logger = require('./utils/logger');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// WebSocket setup
setupWebSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = config.port || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});