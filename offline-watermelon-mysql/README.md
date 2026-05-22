# Offline Watermelon + MySQL

Projeto de teste com:

- App mobile React Native usando WatermelonDB como banco local.
- API REST Node.js/Express persistindo dados em MySQL.
- Login com sessao local.
- Sincronizacao offline-first com `pullChanges` e `pushChanges`.
- Cadastro/edicao de lancamentos com tipo, data/hora, descricao e multiplas fotos.

## Estrutura

```txt
offline-watermelon-mysql/
  backend/  API REST + schema MySQL
  mobile/   App React Native + WatermelonDB
```

## Requisitos

- Node.js 18 ou superior.
- MySQL 8 ou superior.
- Para Android: Android Studio + emulador ou dispositivo.
- Para iOS: macOS, Xcode e CocoaPods.

## Backend

1. Suba o MySQL com Docker:

```bash
docker compose up -d mysql
```

2. Entre na pasta da API:

```bash
cd backend
npm install
cp .env.example .env
```

3. Ajuste o `.env` com usuario/senha do MySQL.

Se estiver usando o `docker-compose.yml` deste projeto, use:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=offline_watermelon
```

4. Crie as tabelas e os dados iniciais:

```bash
npm run db:init
npm run db:seed
```

O seed cria:

| Login | Senha | Empresa |
| --- | --- | --- |
| `ana@empresa-norte.com` | `senha123` | Empresa Norte |
| `bruno@empresa-sul.com` | `senha123` | Empresa Sul |

5. Suba a API e mantenha este terminal aberto:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3333/health
```

## App mobile

1. Configure a URL da API em:

```txt
mobile/src/api/config.ts
```

Valores comuns:

- Android emulator: `http://10.0.2.2:3333`
- iOS simulator: `http://localhost:3333`
- Dispositivo fisico: `http://IP_DA_SUA_MAQUINA:3333`

2. Instale dependencias:

```bash
cd mobile
npm install
```

3. Rode no Android:

```bash
npm run android
```

4. Rode no iOS:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

## Como testar

1. Suba a API e faca login com um dos usuarios seed.
2. Cadastre um lancamento com:
   - Tipo `Compra` ou `Venda`.
   - Data/hora.
   - Descricao com no minimo 10 caracteres.
   - Uma ou mais fotos pela galeria ou camera.
3. Veja o item na lista local.
4. Desligue internet/rede do emulador ou pare o backend.
5. Cadastre ou edite lancamentos offline; eles permanecem no WatermelonDB.
6. Reative a rede/API e toque em `Sincronizar`, ou aguarde o app detectar a volta da conexao.
7. O status muda de `Pendente` para `Sincronizado` quando o WatermelonDB conclui o push/pull.

## Regras de empresa

O backend usa o `empresa_id` do token JWT para filtrar todos os pulls e pushes. Mesmo que o app envie outro `empresa_id`, a API grava registros usando a empresa do usuario autenticado.

## Fotos

O app persiste a associacao das fotos offline no WatermelonDB e sincroniza os caminhos locais (`local_uri`) com a API junto com cada registro. A API tambem possui o endpoint `POST /photos/:fotoId/upload` para evoluir o fluxo para upload multipart de arquivo e preenchimento de `remote_uri`.
