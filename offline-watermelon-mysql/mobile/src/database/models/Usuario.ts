import { field } from '@nozbe/watermelondb/decorators';
import { Model } from '@nozbe/watermelondb';

export default class Usuario extends Model {
  static table = 'usuarios';

  @field('nome') nome!: string;
  @field('login') login!: string;
  @field('empresa_id') empresaId!: string;
  @field('updated_at') updatedAt?: string;
}
