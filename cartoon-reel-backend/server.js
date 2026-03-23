/**
 * server.js — CartoonReel Backend
 * Express server that:
 * 1. Accepts music file uploads (multer)
 * 2. Receives generated video blobs from the frontend
 * 3. Merges video + audio using FFmpeg (fluent-ffmpeg + ffmpeg-static)
 * 4. Returns a downloadable optimized MP4
 */

'use strict';

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg   = require('fluent-ffmpeg');
const ffmpegBin = require('ffmpeg-static');

/* ── FFmpeg binary path ─────────────────────────────────── */
ffmpeg.setFfmpegPath(ffmpegBin);

/* ── Configuration ──────────────────────────────────────── */
const PORT         = process.env.PORT || 4000;
const UPLOAD_DIR   = path.join(__dirname, 'uploads');
const OUTPUT_DIR   = path.join(__dirname, 'output');
const MAX_FILE_MB  = 50;

// Ensure directories exist
[UPLOAD_DIR, OUTPUT_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ── Express app ────────────────────────────────────────── */
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static directory for Admin-uploaded template backgrounds
app.use('/uploads', express.static(UPLOAD_DIR));

// DB Path
const DB_PATH = path.join(__dirname, 'data', 'db.json');

/* ── Multer storage ─────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = uuidv4();
    cb(null, `${safe}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Allow audio and images
    const allowed = /\.(mp3|wav|ogg|aac|m4a|flac|png|jpg|jpeg|webp)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Only audio and image files are allowed.'));
    }
    cb(null, true);
  },
});

/* ── Helper: cleanup old files ──────────────────────────── */
function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.warn('[cleanup] Could not delete:', filePath, err.message);
    });
  }
}

function scheduleCleanup(filePath, delayMs = 5 * 60 * 1000) {
  setTimeout(() => cleanupFile(filePath), delayMs);
}

/* ── Routes ─────────────────────────────────────────────── */

/** Health check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), ffmpeg: !!ffmpegBin });
});

/**
 * POST /api/upload-image
 * For admin uploading bg images.
 */
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided.' });
  const url = `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/${req.file.filename}`;
  res.json({ url });
});

/**
 * DB Routes (Categories & Templates)
 */
app.get('/api/db', (req, res) => {
  if (!fs.existsSync(DB_PATH)) return res.json({ categories: [], templates: [] });
  res.json(JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
});

app.post('/api/db', (req, res) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write DB' });
  }
});

/**
 * POST /api/upload-music
 * Accepts a single music file. Returns a fileId to reference later.
 */
app.post('/api/upload-music', upload.single('music'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No music file provided.' });
  }
  const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
  res.json({
    fileId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

/**
 * POST /api/merge-reel
 * Body (multipart/form-data):
 *   - video: webm/mp4 blob from MediaRecorder
 *   - musicFileId: (optional) fileId returned from /upload-music
 *   - text: subtitle text (optional, for metadata)
 *   - templateId: string
 *
 * Returns: application/octet-stream (MP4 file)
 */
app.post('/api/merge-reel',
  upload.fields([{ name: 'video', maxCount: 1 }]),
  async (req, res) => {
    const videoFile   = req.files?.video?.[0];
    const musicFileId = req.body?.musicFileId;
    const templateId  = req.body?.templateId || 'unknown';

    if (!videoFile) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const videoPath  = videoFile.path;
    const outputName = `reel-${templateId}-${uuidv4()}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    // Find uploaded music if provided
    let musicPath = null;
    if (musicFileId) {
      const candidates = fs.readdirSync(UPLOAD_DIR).filter((f) => f.startsWith(musicFileId));
      if (candidates.length > 0) {
        musicPath = path.join(UPLOAD_DIR, candidates[0]);
      }
    }

    try {
      await mergeWithFFmpeg({ videoPath, musicPath, outputPath });

      // Stream response to client
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
      res.setHeader('Cache-Control', 'no-store');

      const readStream = fs.createReadStream(outputPath);
      readStream.pipe(res);
      readStream.on('end', () => {
        // Cleanup after 5 minutes
        scheduleCleanup(videoPath);
        scheduleCleanup(outputPath);
        if (musicPath) scheduleCleanup(musicPath, 1000);
      });
    } catch (err) {
      console.error('[merge] FFmpeg error:', err.message);
      cleanupFile(videoPath);
      cleanupFile(outputPath);
      res.status(500).json({ error: 'Video processing failed.', detail: err.message });
    }
  }
);

/**
 * DELETE /api/music/:fileId
 * Cleanup a previously uploaded music file.
 */
app.delete('/api/music/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (!fileId || fileId.includes('..')) {
    return res.status(400).json({ error: 'Invalid fileId.' });
  }
  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => f.startsWith(fileId));
  files.forEach((f) => cleanupFile(path.join(UPLOAD_DIR, f)));
  res.json({ deleted: files.length });
});

/* ── FFmpeg merge function ──────────────────────────────── */
/**
 * Merges a video file with an optional audio track.
 * Outputs an optimized 9:16 MP4 for mobile.
 *
 * FFmpeg command breakdown:
 *   -i video.webm         → input video
 *   -i audio.mp3          → input audio (optional)
 *   -c:v libx264          → H.264 video codec (wide compatibility)
 *   -preset fast          → fast encode (good quality/speed balance)
 *   -crf 23               → quality factor (18=best, 28=worst; 23 is default)
 *   -vf scale=540:960     → enforce 9:16 vertical resolution
 *   -c:a aac -b:a 128k    → AAC audio at 128kbps
 *   -shortest             → cut to shortest stream
 *   -movflags +faststart  → move moov atom to start for streaming
 *   -t 31                 → max 31 seconds
 */
function mergeWithFFmpeg({ videoPath, musicPath, outputPath }) {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(videoPath)
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-threads 8',
        '-crf 23',
        '-tune fastdecode',
        '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-t 31',
      ]);

    if (musicPath && fs.existsSync(musicPath)) {
      cmd = cmd
        .input(musicPath)
        .outputOptions(['-c:a aac', '-b:a 128k', '-shortest', '-map 0:v:0', '-map 1:a:0']);
    } else {
      // No audio — add silent audio track for compatibility
      cmd = cmd.outputOptions(['-an']);
    }

    cmd
      .output(outputPath)
      .on('start', (cli) => console.log('[ffmpeg] Start:', cli))
      .on('progress', (p) => process.stdout.write(`\r[ffmpeg] ${p.percent?.toFixed(1) ?? '?'}% `))
      .on('end', () => { console.log('\n[ffmpeg] Done:', outputPath); resolve(); })
      .on('error', (err) => reject(err))
      .run();
  });
}

/* ── Serve Frontend in Production ───────────────────────── */
const frontendDist = path.join(__dirname, '..', 'cartoon-reel-frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  console.log(`[production] Serving static frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  // Catch-all route for client-side routing (e.g. /admin page)
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

/* ── Error handling middleware ───────────────────────────── */
// Handle multer errors
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max ${MAX_FILE_MB} MB.` });
  }
  console.error('[express error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

/* ── Start server ───────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🎬 CartoonReel backend running on http://localhost:${PORT}`);
  console.log(`   FFmpeg: ${ffmpegBin || 'not found'}`);
  console.log(`   Uploads: ${UPLOAD_DIR}`);
  console.log(`   Outputs: ${OUTPUT_DIR}`);
});

module.exports = app;
