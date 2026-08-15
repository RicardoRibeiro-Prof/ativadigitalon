# SalesFlow — Ativa Digital ON

MVP de CRM comercial responsivo, instalável como PWA e sem dependências externas de código.

## Executar

Sirva a pasta por HTTP. Exemplo:

```bash
python3 -m http.server 4173 --directory salesflow-ativa
```

Depois acesse `http://localhost:4173`.

## Dados

Nesta primeira versão, os dados ficam no `localStorage` do navegador. A tela **Configurações** permite exportar e restaurar backup em JSON.

## Próxima fase

Substituir a camada de persistência local por Supabase para autenticação, sincronização, permissões e uso por equipe.
