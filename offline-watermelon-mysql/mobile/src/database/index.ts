import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import Empresa from './models/Empresa';
import FotoRegistro from './models/FotoRegistro';
import Registro from './models/Registro';
import Usuario from './models/Usuario';
import { schema } from './schema';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Erro ao inicializar WatermelonDB', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Empresa, Usuario, Registro, FotoRegistro]
});

export type AppDatabase = typeof database;
