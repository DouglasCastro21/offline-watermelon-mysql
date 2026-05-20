const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function publicUser(row) {
  return {
    id: String(row.id),
    nome: row.nome,
    login: row.login,
    empresa_id: String(row.empresa_id),
    empresa: {
      id: String(row.empresa_id),
      nome: row.empresa_nome
    }
  };
}

router.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ message: 'Login e senha sao obrigatorios.' });
  }

  const [rows] = await pool.execute(
    `select u.id, u.nome, u.login, u.senha_hash, u.empresa_id, e.nome as empresa_nome
       from usuario u
       join empresa e on e.id = u.empresa_id
      where u.login = :login and u.deleted_at is null
      limit 1`,
    { login }
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const token = jwt.sign(
    {
      id: String(user.id),
      login: user.login,
      empresa_id: String(user.empresa_id)
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );

  return res.json({ token, user: publicUser(user) });
});

router.get('/me', authMiddleware, async (req, res) => {
  const [rows] = await pool.execute(
    `select u.id, u.nome, u.login, u.empresa_id, e.nome as empresa_nome
       from usuario u
       join empresa e on e.id = u.empresa_id
      where u.id = :id and u.deleted_at is null
      limit 1`,
    { id: req.user.id }
  );

  if (!rows[0]) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }

  return res.json({ user: publicUser(rows[0]) });
});

module.exports = router;
