import { field } from '@nozbe/watermelondb/decorators';
import { Model } from '@nozbe/watermelondb';

export default class Empresa extends Model {
  static table = 'empresas';

  @field('nome') nome!: string;
  @field('updated_at') updatedAt?: string;
}
