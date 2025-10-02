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

### Etapa 1: Preparar Componente MaterialSelector ✅
- [x] Extrair UI de seleção de material do `/trocas/page.tsx` atual
- [x] Criar `/src/components/trocas/MaterialSelector.tsx`
- [x] Componente criado com props: `student`, `onMaterialSelect`, `onBack`

### Etapa 2: Modificar StudentSelector ✅
- [x] Adicionar props para controlar modo (turmas vs alunos)
- [x] Adicionar botão "Voltar"
- [x] Props adicionadas: `selectedClassName`, `onBack`, `showBackButton`

### Etapa 3: Refatorar Página Principal ✅
- [x] Remover lógica de query parameter
- [x] Implementar estados de navegação
- [x] Integrar todos os componentes
- [x] Novo fluxo: selectClass → selectStudent → selectMaterial

### Etapa 4: Ajustar ExchangeModal ✅
- [x] Comportamento de fechamento já estava correto
- [x] Modal fecha e retorna para seleção de material (conforme planejado)

### Etapa 5: Testes e Validação ✅ TESTADO E AJUSTADO
- [x] **Testar fluxo completo**: Turma → Aluno → Material → Troca → Sucesso → Volta para material
- [x] **Testar navegação**: Interface unificada funcionando perfeitamente
- [x] **Ajustar modal**: Aumentado tamanho e quebra de linha para nomes longos
- [x] **Validar com dados reais**: Testado com aluno "VALENTIN HENRIQUE GREFENHAGEN DO NASCIMENTO"

## Status da Implementação: 🎉 COMPLETA - INTERFACE REALMENTE UNIFICADA

### Novo Fluxo Implementado com Interface Totalmente Unificada:
1. ✅ **Página inicial** `/trocas` mostra seleção de turmas
2. ✅ **Clica na turma** → colapsa turmas e mostra alunos da turma (animação suave)
3. ✅ **Clica no aluno** → colapsa alunos e mostra materiais (mesma animação)
4. ✅ **Clica novamente no aluno selecionado** → volta para lista de alunos
5. ✅ **Clica novamente na turma selecionada** → volta para lista de turmas
6. ✅ **Após sucesso da troca** → volta para seleção de material do mesmo aluno

### Correções Implementadas:
- ❌ **Problema 1**: Ainda mostrava tela separada com botão "Voltar"
- ✅ **Solução 1**: Removida lógica de estados externos da página principal
- ✅ **Resultado 1**: `StudentSelector` agora gerencia 100% da navegação interna

- ❌ **Problema 2**: Modal muito pequeno para nomes longos de alunos
- ✅ **Solução 2**: Modal expandido (`sm:max-w-lg`) e quebra de linha (`break-words`)
- ✅ **Resultado 2**: Nomes longos agora são exibidos corretamente no modal

### Comportamento da Interface:
- 🎯 **Consistência Visual**: Mesma animação e estilo em todas as etapas
- 🔄 **Navegação Intuitiva**: Clicar no item selecionado volta ao estado anterior
- 📱 **Responsivo**: Layout adaptável para diferentes tamanhos de tela

### Arquivos Modificados:
- ✅ **Expandido**: `/src/components/trocas/StudentSelector.tsx` (adicionada seção de materiais)
- ✅ **Refatorado**: `/src/app/trocas/page.tsx` (interface unificada)
- ✅ **Mantido**: `/src/components/trocas/ExchangeModal.tsx` (já funcionava corretamente)
- ❌ **Removido**: `/src/components/trocas/MaterialSelector.tsx` (não mais necessário)

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

## Nova Melhoria: Sistema de Cores por Material 🎨

### Problema Identificado pelos Usuários:
- ❌ **Confusão entre materiais**: Risco de cadastrar tipo errado de material
- ❌ **Interface genérica**: Todos os botões e modais têm a mesma aparência
- ❌ **Falta de feedback visual**: Usuário não tem certeza do tipo selecionado

### Solução: Implementar Sistema de Cores Consistente

#### Paleta de Cores (baseada nos hexágonos da homepage):
- 🔵 **Tampinhas**: Tons de azul (`#3B82F6` - blue-500)
- ⚫ **Latinhas**: Tons de cinza (`#6B7280` - gray-500) 
- 🟠 **Óleo**: Tons de laranja (`#F97316` - orange-500)

### Plano de Implementação:

#### Etapa 1: Definir Classes CSS Customizadas ✅
- [x] **Criar variantes de cores** para cada material no sistema de design
- [x] **Função getMaterialColors()** com paleta específica para cada material
- [x] **Sistema de cores consistente** implementado

#### Etapa 2: Atualizar Botões de Material (StudentSelector) ✅
- [x] **Tampinhas**: `bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`
- [x] **Latinhas**: `bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100`
- [x] **Óleo**: `bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100`
- [x] **Ícones coloridos** e transições suaves implementadas

#### Etapa 3: Personalizar Modal (ExchangeModal) ✅
- [x] **Header do modal**: Background gradient conforme material
- [x] **Ícone do material**: Cor matching no header  
- [x] **Botão de confirmação**: Cor específica do material
- [x] **Card de informações**: Cores específicas para sobra de material
- [x] **Modal de confirmação**: Header e elementos coloridos

#### Etapa 4: Melhorias Adicionais de UX ✅
- [x] **Texto do material no modal**: Destacado com cor específica
- [x] **Feedback de quantidade**: Indicator colorido para sobra de material
- [x] **Animações**: Transições suaves implementadas (duration-200)
- [x] **Cores de fundo dinâmicas**: Background específico por material

#### Etapa 5: Validação e Testes ⏳ PRONTO PARA TESTAR
- [ ] **Teste com usuários**: Validar redução de confusão entre materiais
- [ ] **Teste de acessibilidade**: Verificar contraste e usabilidade
- [ ] **Responsividade**: Validar cores em mobile/desktop

### Benefícios Esperados:
- ✅ **Redução de erros**: Identificação visual imediata do material
- ✅ **Melhor UX**: Interface mais intuitiva e profissional  
- ✅ **Confiança do usuário**: Feedback visual claro do que está fazendo
- ✅ **Consistência**: Alinhamento com identidade visual da homepage

### Arquivos a Modificar:
- `/src/components/trocas/StudentSelector.tsx` (botões de material)
- `/src/components/trocas/ExchangeModal.tsx` (modal de troca)
- Possível criação de arquivo de estilos para variantes customizadas

---
*Documento criado em: 29 de setembro de 2025*
*Última atualização: 30 de setembro de 2025 - Sistema de cores planejado*
