import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'empresas',
      columns: [
        { name: 'nome', type: 'string' },
        { name: 'updated_at', type: 'string', isOptional: true }
      ]
    }),
    tableSchema({
      name: 'usuarios',
      columns: [
        { name: 'nome', type: 'string' },
        { name: 'login', type: 'string' },
        { name: 'empresa_id', type: 'string', isIndexed: true },
        { name: 'updated_at', type: 'string', isOptional: true }
      ]
    }),
    tableSchema({
      name: 'registros',
      columns: [
        { name: 'empresa_id', type: 'string', isIndexed: true },
        { name: 'usuario_id', type: 'string', isIndexed: true },
        { name: 'tipo', type: 'string' },
        { name: 'data_hora', type: 'string' },
        { name: 'descricao', type: 'string' },
        { name: 'updated_at', type: 'string', isOptional: true }
      ]
    }),
    tableSchema({
      name: 'foto_registros',
      columns: [
        { name: 'registro_id', type: 'string', isIndexed: true },
        { name: 'empresa_id', type: 'string', isIndexed: true },
        { name: 'local_uri', type: 'string', isOptional: true },
        { name: 'remote_uri', type: 'string', isOptional: true },
        { name: 'updated_at', type: 'string', isOptional: true }
      ]
    })
  ]
});
