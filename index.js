// index.js – updated for Render deploy
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────
// Ensure required directories exist
// ────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
const thumbsDir = path.join(__dirname, 'public', 'thumbnails');
[uploadsDir, thumbsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));
app.use('/thumbnails', express.static(thumbsDir));
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────────────────────────────────
// Multer storage (stream video straight to disk)
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('video/'))
});

// ────────────────────────────────────────────────────────────
// POST /upload – receive video + generate thumbnail
// ────────────────────────────────────────────────────────────
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const savePath = path.join(uploadsDir, req.file.filename);
  const thumbPath = path.join(
    thumbsDir,
    `${path.parse(req.file.filename).name}.jpg`
  );

  // Generate thumbnail (first frame at 1 s)
  const ffmpegCmd = `ffmpeg -y -ss 00:00:01 -i "${savePath}" -frames:v 1 -q:v 2 "${thumbPath}"`;
  exec(ffmpegCmd, err => {
    if (err) console.error('Thumbnail generation failed:', err);
  });

  res.redirect('/catalog.html');
});

// ────────────────────────────────────────────────────────────
// Helper to build catalog JSON on the fly
// ────────────────────────────────────────────────────────────
const buildCatalog = async () => {
  const files = (await fs.promises.readdir(uploadsDir)).filter(f =>
    f.toLowerCase().endsWith('.mp4')
  );

  const catalog = {
    'Street Classics': [],
    Misc: []
  };

  files.forEach(f => {
    const entry = { filename: f };
    if (f.startsWith('videoplayback')) {
      catalog['Street Classics'].push(entry);
    } else {
      catalog.Misc.push(entry);
    }
  });

  return Object.entries(catalog).map(([category, videos]) => ({
    category,
    videos
  }));
};

// GET /videos – dynamic catalog
app.get('/videos', async (_, res) => {
  try {
    res.json(await buildCatalog());
  } catch (e) {
    console.error('Catalog build error:', e);
    res.status(500).send('Server error');
  }
});

// Health check for Render
app.get('/health', (_, res) => res.sendStatus(200));

// Landing page
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index_landing.html'));
});

// ────────────────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Melflix running on :${PORT}`);
});
