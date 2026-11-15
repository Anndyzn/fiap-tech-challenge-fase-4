# Tech Challenge — Fase 4 | FIAP

## Sobre o projeto

Este projeto foi desenvolvido para o Tech Challenge da Fase 4 da Pós-Tech em Full Stack Development da FIAP.

A ideia foi dar continuidade ao blog educacional que começamos a desenvolver nas fases anteriores, aproveitando o que já tínhamos feito e adicionando as funcionalidades aprendidas nesta nova etapa.

Na **Fase 2**, desenvolvemos o backend utilizando Node.js, TypeScript e PostgreSQL, criando uma API para gerenciar as postagens.

Na **Fase 3**, trabalhamos com React para desenvolver a interface web e integrar o frontend ao backend.

Agora, na **Fase 4**, o foco foi desenvolver um aplicativo mobile com React Native, utilizando a API das fases anteriores como base.

Durante o desenvolvimento, também precisamos fazer algumas alterações no backend para permitir o cadastro de professores e alunos, melhorar a autenticação e controlar o que cada tipo de usuário pode fazer.

## Tecnologias utilizadas

**Backend**

- Node.js e Express
- TypeScript
- PostgreSQL
- Docker
- JWT e bcrypt
- Jest e Supertest

**Mobile**

- React Native
- Expo
- TypeScript
- Axios
- Expo Router
- SecureStore

**Outras ferramentas**

- Git e GitHub
- GitHub Actions
- VS Code
- Android Studio (emulador Android)

## Funcionalidades do aplicativo

O aplicativo funciona como um blog educacional, onde professores podem gerenciar o conteúdo e alunos podem acompanhar as postagens.

### Professores

Ao fazer login como professor, é possível:

- Criar, editar e excluir postagens.
- Visualizar e pesquisar as postagens.
- Cadastrar professores e alunos.
- Consultar a lista de usuários.
- Editar ou excluir usuários cadastrados.

### Alunos

Ao fazer login como aluno, é possível:

- Visualizar as postagens disponíveis.
- Pesquisar postagens.
- Abrir uma postagem para ler seu conteúdo completo.

O aluno não tem acesso às funções administrativas. Além de esconder essas opções no aplicativo, também fizemos a verificação das permissões no backend.

## Organização dos arquivos

Para facilitar a organização, separei o projeto em duas partes principais:

```text
fiap-tech-challenge-fase-4/
├── .github/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   └── docker-compose.yml
├── mobile/
│   ├── src/
│   └── package.json
└── README.md
```

- **backend:** contém a API, a conexão com o banco, as rotas, os Controllers e os testes.
- **mobile:** contém as telas e a navegação do aplicativo React Native.
- **.github:** contém a configuração dos testes automáticos do GitHub Actions.

## Como executar o projeto

Para executar o projeto, é necessário ter instalado:

- Node.js e npm
- Docker Desktop
- Android Studio com um emulador Android

### 1. Iniciando o backend

Primeiro, abra o Docker Desktop.

Depois, no terminal, entre na pasta do backend:

```powershell
cd backend
```

Na primeira execução, copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

Gere uma chave para autenticação:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Coloque a chave gerada na variável `JWT_SECRET` do arquivo `.env`.

Essa configuração é necessária para gerar e validar os tokens de login.

Com isso feito, inicie os containers:

```powershell
docker compose -p fiap-fase4 up -d --build
```

O Docker iniciará a API e o PostgreSQL.

A API ficará disponível em:

`http://localhost:4001`

Para verificar se está funcionando, acesse:

`http://localhost:4001/posts`

Na primeira execução, as tabelas serão preparadas automaticamente. É normal que a lista de postagens esteja vazia no início.

### 2. Criando o primeiro professor

Como o sistema ainda não possui usuários cadastrados, precisamos criar o primeiro professor para acessar as funções administrativas.

No terminal PowerShell, dentro da pasta `backend`, execute:

```powershell
$senha = [System.Net.NetworkCredential]::new(
  "",
  (Read-Host "Senha do administrador" -AsSecureString)
).Password

$senha | docker exec -i api_blog_fiap_f4 node dist/scripts/criar-admin.js

Remove-Variable senha
```

Utilize uma senha de pelo menos 12 caracteres.

O professor inicial terá o e-mail:

`admin@fiap.local`

Depois disso, será possível cadastrar outros professores e alunos pelo aplicativo.

### 3. Iniciando o aplicativo mobile

Abra outro terminal e entre na pasta do mobile:

```powershell
cd mobile
```

Instale as dependências:

```powershell
npm ci
```

Inicie o Expo:

```powershell
npx expo start --clear --go
```

Com o emulador Android aberto, pressione `a` no terminal para iniciar o aplicativo.

O mobile utiliza o endereço `http://10.0.2.2:4001` para acessar a API pelo emulador Android.

Com tudo funcionando, já podemos entrar com o professor cadastrado e utilizar o sistema.

## Testes realizados

Durante o desenvolvimento, fiz testes para verificar as principais funcionalidades do projeto.

Testei o cadastro e a edição de usuários, o login de professores e alunos, a criação de postagens e a integração do aplicativo com o PostgreSQL.

Também verificamos as permissões: o professor consegue acessar as funções administrativas, enquanto o aluno pode apenas consultar as postagens.

No backend, utilizamos Jest e Supertest para automatizar alguns testes. Ao final da implementação, conseguimos executar **11 testes com sucesso**.

Para executar os testes localmente, utilizamos um banco separado chamado `blog_fiap_f4_test`, evitando alterar as informações do banco principal.

Com o banco de testes configurado, os comandos são:

```powershell
npm run build
npx tsc --project tests/tsconfig.json
npm test -- --runInBand
```

Também configurei o GitHub Actions para verificar o código do backend e do aplicativo mobile quando houver atualizações no repositório.

## Dificuldades e aprendizados

Uma das principais dificuldades foi adaptar o backend que já tínhamos desenvolvido nas fases anteriores para funcionar com os novos requisitos da Fase 4.

Precisamos adicionar o cadastro de professores e alunos, modificar a autenticação e trabalhar com diferentes permissões dentro da aplicação.

Outro desafio foi configurar a comunicação entre o React Native e o backend executado no Docker. Durante essa parte, tivemos que verificar portas, conexões com a API e o funcionamento do emulador Android.

Também encontramos alguns erros de TypeScript, problemas de configuração do Expo e testes antigos que precisaram ser atualizados depois das mudanças no sistema de login.

Esses problemas fizeram parte do desenvolvimento e ajudaram a entender melhor como o frontend, o backend e o banco de dados trabalham juntos.

## Conclusão

Com este Tech Challenge, conseguimos continuar o projeto das fases anteriores e transformá-lo em uma aplicação mobile integrada ao backend.

A Fase 4 ajudou principalmente a colocar em prática os conteúdos de React Native, integração com APIs, navegação entre telas, autenticação e gerenciamento de dados.

Além de desenvolver as funcionalidades, também conseguimos entender melhor a importância de organizar o projeto, testar as operações e controlar as permissões dos usuários.

Foi uma oportunidade de reunir os conhecimentos aprendidos durante o curso em um projeto que funciona de forma integrada.
