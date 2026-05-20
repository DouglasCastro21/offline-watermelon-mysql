const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/:fotoId/upload', authMiddleware, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Arquivo nao enviado.' });
  }

  const remoteUri = `${process.env.PUBLIC_BASE_URL || 'http://localhost:3333'}/uploads/${req.file.filename}`;

  await pool.execute(
    `update foto_registro
        set remote_uri = :remoteUri, updated_at = now(3), deleted_at = null
      where id = :id and empresa_id = :empresaId`,
    {
      id: req.params.fotoId,
      empresaId: req.user.empresa_id,
      remoteUri
    }
  );

  return res.json({ remote_uri: remoteUri });
});

module.exports = router;
