import { field } from '@nozbe/watermelondb/decorators';
import { Model } from '@nozbe/watermelondb';

export default class Registro extends Model {
  static table = 'registros';

  @field('empresa_id') empresaId!: string;
  @field('usuario_id') usuarioId!: string;
  @field('tipo') tipo!: 'COMPRA' | 'VENDA';
  @field('data_hora') dataHora!: string;
  @field('descricao') descricao!: string;
  @field('updated_at') updatedAt?: string;

  get sincronizado() {
    return this.syncStatus === 'synced';
  }
}
