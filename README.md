Offline Watermelon + MySQL

Projeto de teste com:

App mobile React Native usando WatermelonDB como banco local.
API REST Node.js/Express persistindo dados em MySQL.
Login com sessao local.
Sincronizacao offline-first com pullChanges e pushChanges.
Cadastro/edicao de lancamentos com tipo, data/hora, descricao e multiplas fotos.
Estrutura

offline-watermelon-mysql/
  backend/  API REST + schema MySQL
  mobile/   App React Native + WatermelonDB
Requisitos

Node.js 18 ou superior.
MySQL 8 ou superior.
Para Android: Android Studio + emulador ou dispositivo.
Para iOS: macOS, Xcode e CocoaPods.
Backend

Entre na pasta da API:
cd backend
npm install
cp .env.example .env
Ajuste o .env com usuario/senha do MySQL.

Crie as tabelas e os dados iniciais:

npm run db:init
npm run db:seed
O seed cria:

Login	Senha	Empresa
ana@empresa-norte.com	senha123	Empresa Norte
bruno@empresa-sul.com	senha123	Empresa Sul
Suba a API:
npm run dev
Health check:

curl http://localhost:3333/health
App mobile

Configure a URL da API em:
mobile/src/api/config.ts
Valores comuns:

Android emulator: http://10.0.2.2:3333
iOS simulator: http://localhost:3333
Dispositivo fisico: http://IP_DA_SUA_MAQUINA:3333
Instale dependencias:
cd mobile
npm install
Rode no Android:
npm run android
Rode no iOS:
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
Como testar

Suba a API e faca login com um dos usuarios seed.
Cadastre um lancamento com:
Tipo Compra ou Venda.
Data/hora.
Descricao com no minimo 10 caracteres.
Uma ou mais fotos pela galeria ou camera.
Veja o item na lista local.
Desligue internet/rede do emulador ou pare o backend.
Cadastre ou edite lancamentos offline; eles permanecem no WatermelonDB.
Reative a rede/API e toque em Sincronizar, ou aguarde o app detectar a volta da conexao.
O status muda de Pendente para Sincronizado quando o WatermelonDB conclui o push/pull.
Regras de empresa

O backend usa o empresa_id do token JWT para filtrar todos os pulls e pushes. Mesmo que o app envie outro empresa_id, a API grava registros usando a empresa do usuario autenticado.

Fotos

O app persiste a associacao das fotos offline no WatermelonDB e sincroniza os
caminhos locais (local_uri) com a API junto com cada registro. 
A API tambem possui o endpoint POST /photos/:fotoId/upload para
evoluir o fluxo para upload multipart de arquivo e preenchimento de remote_uri.
