import { field } from '@nozbe/watermelondb/decorators';
import { Model } from '@nozbe/watermelondb';

export default class FotoRegistro extends Model {
  static table = 'foto_registros';

  @field('registro_id') registroId!: string;
  @field('empresa_id') empresaId!: string;
  @field('local_uri') localUri?: string;
  @field('remote_uri') remoteUri?: string;
  @field('updated_at') updatedAt?: string;
}
