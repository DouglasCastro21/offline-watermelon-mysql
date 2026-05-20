const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const database = process.env.DB_NAME || 'offline_watermelon';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  await connection.query(`create database if not exists \`${database}\``);
  await connection.query(`use \`${database}\``);

  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(schema);
  await connection.end();

  console.log(`Banco ${database} inicializado.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
