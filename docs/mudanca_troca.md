# Planejamento: Mudança na Lógica das Trocas

## Estado Atual (Analisado)

### Fluxo Atual
```
1. Seleciona tipo de material (URL: /trocas?material=tampas)
2. Seleciona turma (StudentSelector)
3. Seleciona aluno (StudentSelector)
4. Abre formulário de troca (ExchangeModal)
5. Confirmação
6. Sucesso
7. Volta para lista de alunos da turma (mesma página)
```

### Arquivos Envolvidos no Fluxo Atual
- **`/src/app/trocas/page.tsx`**: Página principal das trocas
- **`/src/components/trocas/StudentSelector.tsx`**: Seleção de turma e aluno
- **`/src/components/trocas/ExchangeModal.tsx`**: Modal do formulário de troca

### Características do Sistema Atual
1. **Parâmetro de Material**: O tipo de material é passado via query parameter `?material=tampas|latas|oleo`
2. **Props do Modal**: ExchangeModal recebe `student` e `materialType`
3. **Estados do Modal**: 'form' → 'confirmation' → success → close
4. **Retorno**: Após sucesso, volta para lista de alunos da turma selecionada

## Nova Lógica Proposta

### Novo Fluxo Desejado
```
1. Seleciona turma 
2. Seleciona aluno
3. Seleciona material 
4. Formulário de troca
5. Confirmação 
6. Sucesso
7. Volta para o aluno (não para lista da turma)
```

## Definições da Implementação ✅

### 1. Navegação e URLs
- **✅ Definido**: Manter apenas a página `/trocas` (uma página com estados internos)
- **Motivo**: Simplicidade e consistência com arquitetura atual

### 2. Seleção de Material
- **✅ Definido**: Usar os botões/cards existentes (similares aos da tela atual)
- **Comportamento**: Após selecionar aluno, mostrar botões de material como já existe quando se acessa `/trocas`

### 3. Comportamento do "Volta para aluno"
- **✅ Definido**: Similar ao comportamento atual de turma→alunos
- **Funcionamento**: Ao clicar no aluno, aparece lista de botões dos materiais (tampas, latas, óleo)
- **Após sucesso**: Retorna para a tela de seleção de material do mesmo aluno

### 4. Estado da Aplicação
- **✅ Definido**: Manter como está atualmente (useState no componente)
- **Estrutura**: Estados internos para controlar: turma selecionada → aluno selecionado → material selecionado

### 5. Compatibilidade
- **✅ Definido**: Mudança completa - substituir sistema atual
- **Ação**: Eliminar a lógica antiga baseada em query parameter `?material=...`

## Arquitetura de Componentes

### Novo Fluxo de Estados
```
Estado 1: Seleção de Turma
├── Mostra grid de turmas (reutilizar lógica atual)
└── onClick → vai para Estado 2

Estado 2: Seleção de Aluno  
├── Mostra alunos da turma selecionada (reutilizar lógica atual)
├── Botão "Voltar" → Estado 1
└── onClick aluno → vai para Estado 3

Estado 3: Seleção de Material
├── Mostra botões de material (reutilizar UI atual de /trocas)
├── Botão "Voltar" → Estado 2  
└── onClick material → abre ExchangeModal

Modal de Troca:
├── Após sucesso → volta para Estado 3 (seleção material do mesmo aluno)
└── OnClose → volta para Estado 3
```

### Modificações nos Arquivos

#### 1. `/src/app/trocas/page.tsx` - MODIFICAÇÃO MAJOR
- **Remover**: Lógica de query parameter `?material=...`
- **Remover**: Renderização condicional baseada em material
- **Adicionar**: Estados para controlar fluxo (turma, aluno, material)
- **Adicionar**: Componente de seleção de material (reutilizar UI atual)

#### 2. `/src/components/trocas/StudentSelector.tsx` - MODIFICAÇÃO MENOR
- **Manter**: Toda lógica atual de seleção turma/aluno
- **Modificar**: Adicionar props para controlar se mostra turmas ou alunos
- **Adicionar**: Botão "Voltar" quando necessário

#### 3. `/src/components/trocas/ExchangeModal.tsx` - MODIFICAÇÃO MENOR
- **Manter**: Toda lógica atual
- **Modificar**: Comportamento de fechamento após sucesso

#### 4. Componente Novo: `MaterialSelector.tsx`
- **Criar**: Componente para seleção de material
- **Reutilizar**: UI atual dos botões de material de `/trocas`

## Plano de Implementação

### Etapa 1: Preparar Componente MaterialSelector
- [ ] Extrair UI de seleção de material do `/trocas/page.tsx` atual
- [ ] Criar `/src/components/trocas/MaterialSelector.tsx`
- [ ] Testar componente isoladamente

### Etapa 2: Modificar StudentSelector
- [ ] Adicionar props para controlar modo (turmas vs alunos)
- [ ] Adicionar botão "Voltar"
- [ ] Testar funcionalidade

### Etapa 3: Refatorar Página Principal
- [ ] Remover lógica de query parameter
- [ ] Implementar estados de navegação
- [ ] Integrar todos os componentes
- [ ] Testar fluxo completo

### Etapa 4: Ajustar ExchangeModal
- [ ] Modificar comportamento de fechamento
- [ ] Testar retorno para seleção de material

### Etapa 5: Testes e Validação
- [ ] Testar todos os caminhos do fluxo
- [ ] Validar responsividade
- [ ] Testes com dados reais

## Código de Referência

### Botões de Material (para reutilizar em MaterialSelector)
Localização atual: `/src/app/trocas/page.tsx` linhas ~87-121
```tsx
{/* Botões de seleção de material */}
<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto">
  <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
    <Link href={`/trocas?material=${MATERIAL_TYPES.LIDS}`}>
      <PackageIcon className="h-8 w-8 mb-2" />
      <span className="text-lg font-medium">Tampinhas</span>
      <span className="text-xs text-muted-foreground">Registrar troca de tampinhas plásticas</span>
    </Link>
  </Button>
  // ... outros botões
</div>
```

### Estados de Navegação (para implementar)
```tsx
type NavigationState = 'selectClass' | 'selectStudent' | 'selectMaterial';

const [navState, setNavState] = useState<NavigationState>('selectClass');
const [selectedClass, setSelectedClass] = useState<string | null>(null);
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
```

---
*Documento criado em: 29 de setembro de 2025*
*Última atualização: 29 de setembro de 2025 - Definições implementadas*
