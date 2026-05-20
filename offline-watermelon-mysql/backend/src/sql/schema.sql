create table if not exists empresa (
  id int primary key auto_increment,
  nome varchar(120) not null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null
);

create table if not exists usuario (
  id int primary key auto_increment,
  nome varchar(120) not null,
  login varchar(120) not null unique,
  senha_hash varchar(255) not null,
  empresa_id int not null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  constraint fk_usuario_empresa foreign key (empresa_id) references empresa(id)
);

create table if not exists registro (
  id varchar(36) primary key,
  empresa_id int not null,
  usuario_id int not null,
  tipo enum('COMPRA', 'VENDA') not null,
  data_hora datetime not null,
  descricao text not null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  constraint fk_registro_empresa foreign key (empresa_id) references empresa(id),
  constraint fk_registro_usuario foreign key (usuario_id) references usuario(id),
  index idx_registro_sync (empresa_id, updated_at, deleted_at)
);

create table if not exists foto_registro (
  id varchar(36) primary key,
  registro_id varchar(36) not null,
  empresa_id int not null,
  local_uri text null,
  remote_uri text null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  deleted_at datetime(3) null,
  constraint fk_foto_registro foreign key (registro_id) references registro(id),
  constraint fk_foto_empresa foreign key (empresa_id) references empresa(id),
  index idx_foto_sync (empresa_id, updated_at, deleted_at)
);
