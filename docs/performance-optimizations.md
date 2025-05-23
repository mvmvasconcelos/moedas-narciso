# Otimizações de Desempenho no Projeto Moedas-Narciso

Este documento detalha as otimizações de desempenho implementadas no projeto Moedas-Narciso e sugere melhorias adicionais para implementação futura.

## Otimizações Implementadas

### 1. Reestruturação das Rotas
- Removido o prefixo `/authenticated/` das URLs para simplificar os caminhos
- Criadas novas rotas diretas: `/dashboard`, `/alunos`, `/ranking`, `/contribuicoes`
- Implementado redirecionamento das rotas antigas para as novas

### 2. Componentes React Otimizados
- Uso de `React.memo()` em componentes que não precisam re-renderizar frequentemente:
  - `StudentsTable`
  - `StatCard`
- Implementado `useMemo()` para dados estáticos e cálculos caros
- Adicionado `useCallback()` em funções que são passadas para componentes filhos

### 3. Otimizações do Next.js
- Desabilitado o modo estrito (`reactStrictMode: false`) em ambiente de desenvolvimento para evitar dupla renderização
- Habilitado `swcMinify: true` para usar o compilador SWC para minimização
- Configurado o webpack para usar módulos deterministícos (`moduleIds: 'deterministic'`)

### 4. Gerenciamento de Dados
- Implementado lazy loading para carregamento de dados de alunos
- Otimização do método `getOverallStats` usando `reduce` em vez de `forEach`
- Removidos logs de depuração desnecessários de `AuthContext`, `AuthGuard` e `AppLayout`

### 5. Outras Otimizações
- Memoização do hook `useAuth` com `useMemo` para evitar re-renderizações
- Redução de cálculos redundantes em componentes

## Otimizações Pendentes

### 1. Virtualização de Listas Longas
Para melhorar o desempenho de listas com muitos itens, considere implementar a virtualização:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Na tabela de alunos
const rowVirtualizer = useVirtualizer({
  count: students.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 45, // altura aproximada de cada linha
});

// Renderizar apenas as linhas visíveis
```

### 2. Carregamento Progressivo / Paginação
Para lidar com grandes conjuntos de dados:

```jsx
const [page, setPage] = useState(1);
const [perPage] = useState(20);
const paginatedStudents = students.slice((page - 1) * perPage, page * perPage);

// Renderizar apenas paginatedStudents
```

### 3. Code Splitting
Dividir o código em chunks menores usando importações dinâmicas:

```jsx
import dynamic from 'next/dynamic';

const DynamicContributionForm = dynamic(
  () => import('@/components/contribuicoes/ContributionForm'),
  { loading: () => <p>Carregando formulário...</p> }
);
```

### 4. Suspense e React.lazy
Usar Suspense para componentes carregados lentamente:

```jsx
import React, { Suspense, lazy } from 'react';

const LazyStudentRankCard = lazy(() => import('@/components/ranking/StudentRankCard'));

// No componente
<Suspense fallback={<div>Carregando...</div>}>
  <LazyStudentRankCard />
</Suspense>
```

### 5. Migração para Supabase
A migração para o Supabase (conforme detalhado em `docs/supabase-implementation.md`) pode trazer melhorias significativas:
- Reduzir o tamanho do localStorage
- Permitir busca e filtros mais eficientes no servidor
- Reduzir a quantidade de dados carregados no cliente

### 6. Profiling e Análise
Usar o React Profiler para identificar gargalos de desempenho:

```jsx
import { Profiler } from 'react';

<Profiler id="StudentsTable" onRender={onRenderCallback}>
  <StudentsTable onEditStudent={handleEditStudent} />
</Profiler>
```

## Desenvolvimento com Docker

O projeto foi configurado para funcionar com Docker, o que garante um ambiente consistente e isolado:

### Usando Docker para Desenvolvimento

```powershell
# PowerShell (Windows)
$currentPath = (Get-Location).Path
docker run -it --rm -v "${currentPath}:/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
```

```bash
# Bash (Linux/Mac)
docker run -it --rm -v "$(pwd):/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
```

### Usando o Script Deploy.bat
```powershell
.\deploy.bat local
```

Para mais detalhes sobre o desenvolvimento com Docker, consulte o arquivo [docker-development.md](./docker-development.md).

## Como Verificar o Desempenho

1. **Chrome DevTools Performance**
   - Abra o DevTools (F12)
   - Vá para a aba "Performance"
   - Clique em "Record" e use a aplicação
   - Analise os gráficos para identificar gargalos

2. **React Developer Tools**
   - Instale a extensão "React Developer Tools"
   - Use a aba "Profiler" para gravar e analisar renderizações

3. **Lighthouse**
   - Abra o DevTools
   - Vá para a aba "Lighthouse"
   - Execute uma análise completa da página

## Métricas para Monitorar

- **First Contentful Paint (FCP)**: Quanto tempo leva para renderizar o primeiro conteúdo
- **Time to Interactive (TTI)**: Quando a página se torna totalmente interativa
- **Total Blocking Time (TBT)**: Tempo total em que a thread principal está bloqueada
- **Re-renderizações**: Quantas vezes um componente renderiza para a mesma entrada
- **Tempo de Resposta da UI**: Quão responsiva é a UI durante interações
