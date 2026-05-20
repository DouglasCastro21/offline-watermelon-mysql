const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function main() {
  const senhaHash = await bcrypt.hash('senha123', 10);

  await pool.execute(
    `insert into empresa (id, nome)
     values (1, 'Empresa Norte'), (2, 'Empresa Sul')
     on duplicate key update nome = values(nome), updated_at = now(3), deleted_at = null`
  );

  await pool.execute(
    `insert into usuario (id, nome, login, senha_hash, empresa_id)
     values
       (1, 'Ana Compras', 'ana@empresa-norte.com', :senhaHash, 1),
       (2, 'Bruno Vendas', 'bruno@empresa-sul.com', :senhaHash, 2)
     on duplicate key update
       nome = values(nome),
       senha_hash = values(senha_hash),
       empresa_id = values(empresa_id),
       updated_at = now(3),
       deleted_at = null`,
    { senhaHash }
  );

  await pool.end();
  console.log('Seeds criadas. Senha dos usuarios: senha123');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
