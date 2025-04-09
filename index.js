require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// ✅ Redirect root URL to the catalog
app.get('/', (req, res) => {
  res.redirect('/catalog.html');
});

// Set up Multer to use memoryStorage
const upload = multer({ storage: multer.memoryStorage() });

let videos = [];
let nextVideoNumber = 1;

// Upload route
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.post('/upload', upload.single('video'), (req, res) => {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const password = req.body.password;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).send('Incorrect password.');
  }

  const originalName = req.file.originalname;
  const savePath = path.join(__dirname, 'uploads', originalName);

  fs.writeFileSync(savePath, req.file.buffer);

  const title = `Finally Mel Presents: Volume ${nextVideoNumber++}`;
  const description = "Exclusive from the streets. Straight talk and real cuts.";

  videos.push({ filename: originalName, title, description });
  res.redirect('/catalog.html');
});

app.get('/api/videos', (req, res) => {
  res.json(videos);
});

app.get('/video', (req, res) => {
  const videoName = req.query.name;
  if (!videoName) return res.status(400).send('No video specified.');

  const videoPath = path.join(__dirname, 'uploads', videoName);
  if (!fs.existsSync(videoPath)) return res.status(404).send('Video not found.');

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
