# Projeto Moedas Narciso - Otimizações de Desempenho

Este projeto faz parte da iniciativa educacional para incentivar a coleta de materiais recicláveis em escolas, convertendo-os em uma moeda virtual chamada "Moedas Narciso".

## Alterações Recentes

### Refatoração da Estrutura de Rotas
Removemos o prefixo `/authenticated/` das URLs para simplificar os caminhos de navegação:

- `/authenticated/dashboard` → `/dashboard`
- `/authenticated/alunos` → `/alunos`
- `/authenticated/ranking` → `/ranking`
- `/authenticated/contribuicoes` → `/contribuicoes`

### Otimizações de Desempenho
Foram implementadas diversas otimizações para melhorar o desempenho da aplicação:

1. **Memoização de componentes**
   - Componentes como `StudentsTable` e `StatCard` agora usam `React.memo()`
   - Implementamos `useMemo()` para dados estáticos e cálculos frequentes

2. **Otimização de hooks**
   - O hook `useAuth` agora usa `useMemo` para evitar re-renderizações desnecessárias

3. **Configuração do Next.js**
   - Desabilitado modo estrito em ambiente de desenvolvimento
   - Habilitado compilador SWC para minimização
   - Otimizações de webpack

4. **Melhorias no gerenciamento de dados**
   - Implementado lazy loading para dados de alunos
   - Otimização do método `getOverallStats` 
   - Removidos logs de depuração desnecessários

## Documentação Adicional

Para informações detalhadas sobre as otimizações implementadas, consulte:

- [Otimizações de Desempenho](./docs/performance-optimizations.md)
- [Implementação Futura do Supabase](./docs/supabase-implementation.md)

## Como Verificar o Desempenho

Para verificar se o desempenho melhorou, você pode:

1. **Comparar os tempos de carregamento**
   - Use as ferramentas de desenvolvedor do navegador para medir o tempo de carregamento da página
   - Compare com os tempos anteriores às otimizações

2. **Verificar o uso de memória**
   - Monitore o uso de memória antes e depois das otimizações
   - Verifique se há vazamentos de memória

3. **Analisar o comportamento de renderizações**
   - Use o React Profiler para verificar quantas vezes os componentes são renderizados
   - Confirme que componentes memoizados não estão re-renderizando desnecessariamente

## Próximos Passos

1. Remover completamente o diretório `/authenticated/` após confirmar que tudo funciona corretamente
2. Implementar o Supabase para substituir o localStorage, seguindo o guia de implementação
3. Adicionar mais otimizações conforme necessário, baseadas em análises de desempenho contínuas
