# SalesFlow — Ativa Digital ON

MVP de CRM comercial responsivo, instalável como PWA e sem dependências externas de código.

Inclui busca automática de empresas por segmento e cidade, com classificação de prioridade e importação em lote para o funil.

A fonte principal usa dados abertos do CNPJ/Receita Federal tratados pela Base dos Dados no BigQuery. O OpenStreetMap permanece como contingência quando a conexão empresarial não estiver configurada ou disponível.

## Executar

Sirva a pasta por HTTP. Exemplo:

```bash
python3 -m http.server 4173 --directory salesflow-ativa
```

Depois acesse `http://localhost:4173`.

## Dados

Nesta primeira versão, os dados ficam no `localStorage` do navegador. A tela **Configurações** permite exportar e restaurar backup em JSON.

## Configuração da busca empresarial

Crie uma conta de serviço em um projeto Google Cloud com permissão para executar consultas no BigQuery e adicione, apenas no ambiente do servidor, a variável:

```text
GOOGLE_CLOUD_SERVICE_ACCOUNT_BASE64=
```

O valor é o conteúdo JSON da conta de serviço codificado em Base64. Nunca coloque essa credencial no frontend ou no repositório.

## Próxima fase

Substituir a camada de persistência local por Supabase para autenticação, sincronização, permissões e uso por equipe.
