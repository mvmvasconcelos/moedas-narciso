# Guia de Backup do Banco de Dados

Este documento descreve, passo a passo, como configurar um backup semanal do banco de dados Supabase usando um workflow agendado do GitHub Actions. O objetivo: gerar um dump semanal, enviar para o Supabase Storage e manter apenas as 5 últimas cópias (retenção).

OBS: Responda em PT-BR. Não exponha credenciais no repositório. Use GitHub Secrets para armazenar chaves.

---

## Visão geral

- Origem: Postgres hospedado no Supabase (seu projeto atual).
- Destino: Supabase Storage (bucket privado no mesmo projeto Supabase).
- Agendamento: semanal (ex.: domingo 03:00 UTC).
- Retenção: manter as últimas 5 cópias.

## Status atual

- [X] Bucket criado: `db-backups` (privado).
- [X] GitHub Secrets criados: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`, `BACKUP_BUCKET`, `BACKUP_PREFIX`, `RETENTION_COUNT`.
- [X] Workflow adicionado: `.github/workflows/backup.yml`.

Próximos passos imediatos:
- Rodar o workflow manualmente pelo GitHub Actions (`workflow_dispatch`) para testar.
- Verificar no painel Supabase Storage se o arquivo de backup apareceu.
- Realizar teste de restauração em ambiente de staging.

## Por que essa abordagem

- Não precisa de servidor dedicado (usa GitHub Actions).
- Usa Supabase Storage do mesmo projeto, simplificando permissões e custos.
- Permite restauração manual fácil (baixar e rodar psql).

---

## Requisitos

- Acesso ao painel do Supabase para criar um bucket no Storage.
- Acesso ao repositório GitHub para adicionar Secrets e commitar o workflow.
- Chaves/valores (existem no seu `.env.local` / `scripts/supabase_link`):
  - `SUPABASE_URL` (ex.: https://<proj>.supabase.co)
  - `SUPABASE_SERVICE_ROLE_KEY` (chave `service_role`) — muito sensível
  - `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`

---

## Checklist de implementação

- [X] 1. Criar bucket no Supabase Storage (ex.: `db-backups`).
  - [X] 1.1. No painel Supabase → Storage → Create bucket → `db-backups` (privado).
  - [X] 1.2. (Opcional) Definir política de retenção/acl se disponível.

- [ ] 2. Criar GitHub Secrets no repositório
 - [X] 2. Criar GitHub Secrets no repositório
  - [X] 2.1. `SUPABASE_URL`
  - [X] 2.2. `SUPABASE_SERVICE_ROLE_KEY`
  - [X] 2.3. `PG_HOST`
  - [X] 2.4. `PG_PORT` (padrão `5432`)
  - [X] 2.5. `PG_DATABASE` (ex.: `postgres`)
  - [X] 2.6. `PG_USER`
  - [X] 2.7. `PG_PASSWORD`
  - [X] 2.8. `BACKUP_BUCKET` (ex.: `db-backups`)
  - [X] 2.9. `BACKUP_PREFIX` (opcional, ex.: `backups/`)
  - [X] 2.10. `RETENTION_COUNT` (ex.: `5`)

- [ ] 3. Adicionar o workflow GitHub Actions em `.github/workflows/backup.yml`.
- [X] 3. Adicionar o workflow GitHub Actions em `.github/workflows/backup.yml`.
- [ ] 4. Testar execução manual com `workflow_dispatch`.
- [ ] 5. Verificar arquivo no painel Supabase Storage.
- [ ] 6. Testar restauração em ambiente de staging/local.
- [ ] 7. Validar rotação (apagar backups antigos mantendo `RETENTION_COUNT`).
- [ ] 8. Rotacionar credenciais (se necessário) e documentar procedimento.

---

## Detalhes passo a passo

### 1) Criar bucket no Supabase Storage

Pelo painel:
1. Acesse seu projeto no Supabase.
2. Menu → Storage → Create bucket.
3. Nome: `db-backups` (ou outro de sua preferência).
4. Marque como privado (recommended).

Pelo CLI (opcional, exige supabase CLI e login):

```bash
# cria bucket privado chamado db-backups
supabase storage create-bucket db-backups --public false
```

### 2) Criar GitHub Secrets

No GitHub do repositório:
1. Settings → Secrets → Actions → New repository secret.
2. Adicione os valores listados em Requisitos.

Mapeamento sugerido:
- `SUPABASE_URL` ← `NEXT_PUBLIC_SUPABASE_URL` do `.env.local` (não commitar)
- `SUPABASE_SERVICE_ROLE_KEY` ← `SUPABASE_SERVICE_ROLE_KEY` do `.env.local`
- `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD` ← dados da connection string em `scripts/supabase_link`
- `BACKUP_BUCKET` ← `db-backups`
- `BACKUP_PREFIX` ← `backups/` (opcional)
- `RETENTION_COUNT` ← `5`

Importante: nunca comite essas chaves no código.

### 3) Conteúdo do workflow (exemplo)

Crie o arquivo `.github/workflows/backup.yml` com o conteúdo abaixo. Ele:
- roda semanalmente ou manualmente (workflow_dispatch),
- instala `postgresql-client`, `curl`, `jq`, `gzip`,
- cria `pg_dump | gzip`,
- envia o arquivo para Supabase Storage usando a API,
- lista objetos e apaga os mais antigos mantendo `RETENTION_COUNT`.

```yaml
name: Weekly Supabase DB Backup

on:
  schedule:
    - cron: '0 3 * * 0' # domingo 03:00 UTC
  workflow_dispatch: {}

jobs:
  backup:
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      PG_HOST: ${{ secrets.PG_HOST }}
      PG_PORT: ${{ secrets.PG_PORT }}
      PG_DATABASE: ${{ secrets.PG_DATABASE }}
      PG_USER: ${{ secrets.PG_USER }}
      PG_PASSWORD: ${{ secrets.PG_PASSWORD }}
      BACKUP_BUCKET: ${{ secrets.BACKUP_BUCKET }}
      BACKUP_PREFIX: ${{ secrets.BACKUP_PREFIX }}
      RETENTION_COUNT: ${{ secrets.RETENTION_COUNT }}

    steps:
      - name: Preparar runner (instalar ferramentas)
        run: |
          sudo apt-get update -y
          sudo apt-get install -y postgresql-client curl jq gzip python3

      - name: Criar dump e comprimir
        run: |
          TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
          FILENAME="${PG_DATABASE}_${TIMESTAMP}.sql.gz"
          echo "Gerando dump -> ${FILENAME}"
          export PGPASSWORD="${PG_PASSWORD}"
          pg_dump -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d "${PG_DATABASE}" -F p | gzip > "${FILENAME}"
          ls -lh "${FILENAME}"

      - name: Upload para Supabase Storage
        run: |
          FILENAME="${PG_DATABASE}_$(date -u +"%Y%m%dT%H%M%SZ").sql.gz"
          OBJECT_PATH="${BACKUP_PREFIX}${PG_DATABASE}/${FILENAME}"
          echo "Upload para ${SUPABASE_URL}/storage/v1/object/${BACKUP_BUCKET}/${OBJECT_PATH}"
          curl -s -X POST \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -F "file=@${FILENAME}" \
            "${SUPABASE_URL}/storage/v1/object/${BACKUP_BUCKET}/${OBJECT_PATH}" \
            | jq .

      - name: Rotação — manter apenas N backups
        run: |
          PREFIX="${BACKUP_PREFIX}${PG_DATABASE}/"
          echo "Listando objetos com prefix ${PREFIX}"
          resp=$(curl -s -X GET \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            "${SUPABASE_URL}/storage/v1/object/list/${BACKUP_BUCKET}?prefix=${PREFIX}&limit=1000")
          names=$(echo "$resp" | jq -r '.data[].name' | sort)
          total=$(echo "$names" | wc -l)
          echo "Total de backups encontrados: $total"
          keep=${RETENTION_COUNT:-5}
          to_delete=$(echo "$names" | head -n -${keep} || true)
          if [ -z "$to_delete" ]; then
            echo "Nada para deletar (<= $keep backups)."
            exit 0
          fi
          echo "Arquivos a deletar:"
          echo "$to_delete"
          while read -r obj; do
            if [ -n "$obj" ]; then
              enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read().strip(), safe=''))" <<< "$obj")
              echo "Deletando: $obj"
              curl -s -X DELETE \
                -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
                -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
                "${SUPABASE_URL}/storage/v1/object/${BACKUP_BUCKET}/${enc}" \
                | jq .
            fi
          done <<< "$to_delete"
```

> Observação: o workflow usa `service_role` para autorizar operações de Storage. Essa chave tem privilégios elevados — trate com cuidado (veja seção Segurança).

### 4) Testes (executar manualmente)

1. No GitHub Actions, abra o workflow e clique em "Run workflow" (workflow_dispatch) para testar.
2. Após execução, verifique logs do job:
   - Cheque etapa "Criar dump" (tamanho do arquivo gerado).
   - Cheque etapa "Upload" (resposta da API).
3. No painel Supabase → Storage → Bucket `db-backups`, verifique se o arquivo apareceu no prefix `backups/<dbname>/`.

Comandos locais equivalentes (úteis para debug; execute localmente definindo as variáveis em ambiente):

```bash
# gerar dump localmente
export PGPASSWORD="$PG_PASSWORD"
pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" | gzip > local_dump.sql.gz

# fazer upload manual com curl (substitua variáveis)
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -F "file=@local_dump.sql.gz" \
  "$SUPABASE_URL/storage/v1/object/$BACKUP_BUCKET/backups/$PG_DATABASE/local_dump.sql.gz"
```

### 5) Restaurar (testar em staging)

1. Baixar o arquivo (exemplo):

```bash
curl -s -o dump.sql.gz \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/storage/v1/object/$BACKUP_BUCKET/backups/$PG_DATABASE/<FILENAME>"
```

2. Restaurar para um banco de teste:

```bash
gunzip -c dump.sql.gz | PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DATABASE_TESTE"
```

> Sempre restaure em um ambiente separado antes de aplicar em produção.

---

## Segurança e boas práticas

- Armazene chaves em GitHub Secrets. Não comite `.env.local`.
- Rotação: troque `SUPABASE_SERVICE_ROLE_KEY` se houver suspeita de exposição.
- Minimizar permissões: o `service_role` é poderoso; se quiser, crie uma rota serverless que receba o arquivo do workflow e escreva no Storage sem expor `service_role` diretamente. Essa rota pode usar uma chave com menor escopo.
- Criptografia: para mais segurança, cifre o dump antes do upload com `gpg` (passphrase em Secret) ou use client-side encryption.
- Monitoramento: configure alertas se o workflow falhar (GitHub Actions já registra falhas) e verifique logs periodicamente.

---

## Procedimento de recuperação de desastres (resumido)

1. Identificar o arquivo de backup mais recente no bucket (`backups/<dbname>/`).
2. Baixar o arquivo localmente.
3. Restaurar para instância de staging para validação.
4. Se estiver tudo ok, restaurar para produção (planejar janela de manutenção se necessário).

---

## Próximos passos sugeridos

- [ ] Eu posso criar o arquivo `.github/workflows/backup.yml` para você no repositório com base nesse guia.
- [ ] Testar a execução manual (`workflow_dispatch`) e verificar upload.
- [ ] Realizar um teste de restauração em ambiente de staging.

Se quiser que eu gere e adicione o workflow automaticamente, autorize-me e eu crio o arquivo no repositório. Caso prefira que eu apenas gere o YAML aqui para você aplicar manualmente, também posso fazer.

---

## Referências rápidas

- Supabase Storage API: https://supabase.com/docs/reference/javascript/storage
- pg_dump: https://www.postgresql.org/docs/current/app-pgdump.html
- GitHub Actions: https://docs.github.com/en/actions

