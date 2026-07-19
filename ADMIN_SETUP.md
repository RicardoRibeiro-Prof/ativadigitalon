# Painel administrativo do blog

O painel fica em `https://ativadigitalon.com.br/admin/` e publica as matérias diretamente no repositório conectado à Vercel.

## Variáveis obrigatórias na Vercel

Em **Project → Settings → Environment Variables**, cadastre para o ambiente **Production**:

- `ADMIN_EMAIL`: e-mail usado para entrar no painel;
- `ADMIN_PASSWORD`: senha longa e exclusiva;
- `SESSION_SECRET`: texto aleatório com pelo menos 32 caracteres;
- `GITHUB_TOKEN`: token fine-grained com acesso somente ao repositório `ativadigitalon` e permissão **Contents: Read and write**.

As variáveis abaixo são opcionais porque já possuem os valores corretos como padrão:

- `GITHUB_REPOSITORY=RicardoRibeiro-Prof/ativadigitalon`
- `GITHUB_BRANCH=main`

Depois de salvar as variáveis, abra **Deployments**, selecione o último deploy e use **Redeploy**. Senhas e tokens nunca devem ser colocados em arquivos do projeto ou enviados por mensagem.

## Como a publicação funciona

1. O administrador cria ou edita a matéria em `/admin/`.
2. O painel atualiza a matéria, a página inicial do blog e o sitemap em um único commit.
3. A integração do GitHub com a Vercel inicia um novo deploy automaticamente.
4. O artigo continua sendo uma página HTML rápida e indexável pelo Google.

Rascunhos ficam criptografados em `content/drafts/`; mesmo em um repositório público, o texto não pode ser lido sem o `SESSION_SECRET`. Matérias publicadas são registradas em `content/posts.json`.
