
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ReportSchema = new mongoose.Schema({
  crop: String,
  description: String,
  image: Buffer,
  location: String,
  timestamp: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', ReportSchema);
const Message = mongoose.model('Message', MessageSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.post('/api/report', upload.single('image'), async (req, res) => {
  const { crop, description, location } = req.body;
  const report = new Report({
    crop,
    description,
    location,
    image: req.file.buffer
  });
  await report.save();
  res.json({ message: 'Report submitted successfully!' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('send_message', async (data) => {
    const message = new Message(data);
    await message.save();
    io.emit('receive_message', message);
  });
});

server.listen(5000, () => console.log('Server running on http://localhost:5000'));
