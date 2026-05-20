const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { fromMysqlDate, toMysqlDate } = require('../services/date');

const router = express.Router();

function sinceDate(lastPulledAt) {
  if (!lastPulledAt || Number(lastPulledAt) <= 0) {
    return '1970-01-01 00:00:00';
  }

  return toMysqlDate(new Date(Number(lastPulledAt)));
}

function empresaRaw(row) {
  return {
    id: String(row.id),
    nome: row.nome,
    updated_at: fromMysqlDate(row.updated_at)
  };
}

function usuarioRaw(row) {
  return {
    id: String(row.id),
    nome: row.nome,
    login: row.login,
    empresa_id: String(row.empresa_id),
    updated_at: fromMysqlDate(row.updated_at)
  };
}

function registroRaw(row) {
  return {
    id: String(row.id),
    empresa_id: String(row.empresa_id),
    usuario_id: String(row.usuario_id),
    tipo: row.tipo,
    data_hora: fromMysqlDate(row.data_hora),
    descricao: row.descricao,
    updated_at: fromMysqlDate(row.updated_at)
  };
}

function fotoRaw(row) {
  return {
    id: String(row.id),
    registro_id: String(row.registro_id),
    empresa_id: String(row.empresa_id),
    local_uri: row.local_uri,
    remote_uri: row.remote_uri,
    updated_at: fromMysqlDate(row.updated_at)
  };
}

async function queryChanged(table, mapper, where, params) {
  const [createdRows] = await pool.execute(
    `select * from ${table}
      where created_at > :since and deleted_at is null and ${where}`,
    params
  );
  const [updatedRows] = await pool.execute(
    `select * from ${table}
      where created_at <= :since
        and updated_at > :since
        and deleted_at is null
        and ${where}`,
    params
  );
  const [deletedRows] = await pool.execute(
    `select id from ${table}
      where deleted_at > :since and ${where}`,
    params
  );

  return {
    created: createdRows.map(mapper),
    updated: updatedRows.map(mapper),
    deleted: deletedRows.map((row) => String(row.id))
  };
}

router.post('/pull', authMiddleware, async (req, res) => {
  const timestamp = Date.now();
  const since = sinceDate(req.body.lastPulledAt);
  const params = {
    since,
    empresaId: req.user.empresa_id,
    usuarioId: req.user.id
  };

  const empresas = await queryChanged(
    'empresa',
    empresaRaw,
    'id = :empresaId',
    params
  );
  const usuarios = await queryChanged(
    'usuario',
    usuarioRaw,
    'id = :usuarioId and empresa_id = :empresaId',
    params
  );
  const registros = await queryChanged(
    'registro',
    registroRaw,
    'empresa_id = :empresaId',
    params
  );
  const fotoRegistros = await queryChanged(
    'foto_registro',
    fotoRaw,
    'empresa_id = :empresaId',
    params
  );

  return res.json({
    timestamp,
    changes: {
      empresas,
      usuarios,
      registros,
      foto_registros: fotoRegistros
    }
  });
});

async function upsertRegistro(raw, user) {
  await pool.execute(
    `insert into registro
      (id, empresa_id, usuario_id, tipo, data_hora, descricao, created_at, updated_at)
     values
      (:id, :empresaId, :usuarioId, :tipo, :dataHora, :descricao, now(3), now(3))
     on duplicate key update
      empresa_id = values(empresa_id),
      usuario_id = values(usuario_id),
      tipo = values(tipo),
      data_hora = values(data_hora),
      descricao = values(descricao),
      updated_at = now(3),
      deleted_at = null`,
    {
      id: raw.id,
      empresaId: user.empresa_id,
      usuarioId: user.id,
      tipo: raw.tipo,
      dataHora: toMysqlDate(raw.data_hora || new Date()),
      descricao: raw.descricao || ''
    }
  );
}

async function upsertFoto(raw, user) {
  await pool.execute(
    `insert into foto_registro
      (id, registro_id, empresa_id, local_uri, remote_uri, created_at, updated_at)
     values
      (:id, :registroId, :empresaId, :localUri, :remoteUri, now(3), now(3))
     on duplicate key update
      registro_id = values(registro_id),
      empresa_id = values(empresa_id),
      local_uri = values(local_uri),
      remote_uri = values(remote_uri),
      updated_at = now(3),
      deleted_at = null`,
    {
      id: raw.id,
      registroId: raw.registro_id,
      empresaId: user.empresa_id,
      localUri: raw.local_uri || null,
      remoteUri: raw.remote_uri || null
    }
  );
}

router.post('/push', authMiddleware, async (req, res) => {
  const changes = req.body.changes || {};
  const registros = changes.registros || {};
  const fotos = changes.foto_registros || {};

  for (const raw of [...(registros.created || []), ...(registros.updated || [])]) {
    await upsertRegistro(raw, req.user);
  }

  for (const id of registros.deleted || []) {
    await pool.execute(
      `update registro
          set deleted_at = now(3), updated_at = now(3)
        where id = :id and empresa_id = :empresaId`,
      { id, empresaId: req.user.empresa_id }
    );
  }

  for (const raw of [...(fotos.created || []), ...(fotos.updated || [])]) {
    await upsertFoto(raw, req.user);
  }

  for (const id of fotos.deleted || []) {
    await pool.execute(
      `update foto_registro
          set deleted_at = now(3), updated_at = now(3)
        where id = :id and empresa_id = :empresaId`,
      { id, empresaId: req.user.empresa_id }
    );
  }

  return res.json({ ok: true });
});

module.exports = router;
