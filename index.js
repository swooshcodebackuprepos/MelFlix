const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, 'public/thumbnails')));
app.use(express.urlencoded({ extended: true }));

app.get('/videos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'videos.json'));
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  const savePath = path.join(__dirname, 'uploads', req.file.originalname);
  fs.writeFileSync(savePath, req.file.buffer);

  const thumbPath = path.join(__dirname, 'public', 'thumbnails', req.file.originalname.replace('.mp4', '.jpg'));
  const command = `ffmpeg -ss 00:00:01 -i "${savePath}" -frames:v 1 -q:v 2 "${thumbPath}"`;

  exec(command, (err) => {
    if (err) console.error("Thumbnail generation failed:", err);
    res.redirect('/catalog.html');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Melflix running on http://localhost:${PORT}`);
});

// NEW: util to build the list on the fly
const buildCatalog = () => {
  const files = fs.readdirSync(path.join(__dirname, 'uploads'));
  // group by simple rule: filenames starting with "videoplayback" -> Street Classics, everything else -> Misc
  const catalog = {
    "Street Classics": [],
    "Misc": []
  };

  files.filter(f => f.endsWith('.mp4')).forEach(f => {
    if (f.startsWith('videoplayback')) {
      catalog["Street Classics"].push({ filename: f });
    } else {
      catalog["Misc"].push({ filename: f });
    }
  });
  // turn hash → array expected by frontend
  return Object.entries(catalog).map(([category, videos]) => ({ category, videos }));
};

// existing static & uploads middleware ...
app.get('/videos', (req, res) => {
  res.json(buildCatalog());        // ⬅️ always fresh
});

// Serve the main landing page (or catalog) at “/”
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index_landing.html'));
  // or  res.redirect('/login.html');
});

