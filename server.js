const express = require('express');
const multer = require('multer');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// In-memory storage
const reports = [];
const messages = [];

// Pest report endpoint
app.post('/api/report', upload.single('image'), (req, res) => {
  const { crop, description, location } = req.body;
  const report = {
    crop,
    description,
    location,
    image: req.file?.buffer,
    timestamp: new Date()
  };
  reports.push(report);
  res.json({ message: 'Report stored in memory successfully!' });
});

// Chat with Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('send_message', (data) => {
    const message = { ...data, timestamp: new Date() };
    messages.push(message);
    io.emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(5000, () => console.log('Server running on http://localhost:5000'));
