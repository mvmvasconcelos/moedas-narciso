# Projeto Moedas Narciso

Um projeto educacional para incentivar a coleta de materiais recicláveis em escolas, convertendo-os em uma moeda virtual chamada "Moedas Narciso".

## Sobre o Projeto

Este projeto permite que professores gerenciem alunos e suas contribuições de materiais recicláveis (tampinhas, latas e óleo), convertendo-os automaticamente em "Moedas Narciso" que podem ser usadas em atividades educacionais.

## Funcionalidades Principais

- Dashboard com estatísticas gerais de coleta
- Gerenciamento de alunos
- Registro de contribuições por tipo de material
- Ranking dos alunos com mais contribuições
- Conversão automática de materiais em moedas virtuais

## Documentação

- [Otimizações de Desempenho](./docs/performance-optimizations.md)
- [Implementação do Supabase](./docs/supabase-implementation.md)
- [Desenvolvimento com Docker](./docs/docker-development.md)
- [Resumo das Otimizações](./README-otimizacoes.md)

## Executando o Projeto

### Com Docker (Recomendado)

```powershell
.\deploy.bat local
```

### Manualmente

```powershell
npm install
npm run dev
```

## Tecnologias Utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Docker (ambiente de desenvolvimento)
- Supabase (planejado para implementação futura)
