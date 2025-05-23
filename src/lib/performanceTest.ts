import { DataService } from '@/lib/dataService';
import { generateInitialStudents } from '@/lib/constants';

// Este arquivo contém funções para testar o desempenho da aplicação

/**
 * Testa o desempenho da geração e manipulação de grandes conjuntos de dados
 */
export async function testPerformance() {
  console.time('generateLargeDataset');
  
  // Gerar um conjunto grande de dados (1000 alunos)
  const baseStudents = generateInitialStudents();
  const largeDataset = [];
  
  for (let i = 0; i < 100; i++) {
    baseStudents.forEach(student => {
      largeDataset.push({
        ...student,
        id: `s${largeDataset.length + 1}`,
        name: `${student.name} ${largeDataset.length + 1}`,
      });
    });
  }
  
  console.timeEnd('generateLargeDataset');
  console.log(`Dataset gerado com ${largeDataset.length} alunos`);
  
  // Testar salvamento dos dados (comentado para evitar sobrescrever dados reais)
  /*
  console.time('saveData');
  DataService.saveStudents(largeDataset);
  console.timeEnd('saveData');
  */
  
  // Testar leitura dos dados
  console.time('readData');
  const students = DataService.getStudents();
  console.timeEnd('readData');
  
  return {
    generatedCount: largeDataset.length,
    currentCount: students.length,
    success: true
  };
}

/**
 * Testa o desempenho da função getOverallStats
 */
export function testStatsCalculation(iterations = 100) {
  const students = DataService.getStudents();
  
  console.time('statsCalculation');
  
  let totalLids = 0;
  let totalCans = 0;
  let totalOil = 0;
  let totalCoins = 0;
  
  // Executar o cálculo múltiplas vezes para testar desempenho
  for (let i = 0; i < iterations; i++) {
    // Usando forEach (método antigo mais lento)
    if (i % 2 === 0) {
      students.forEach(student => {
        totalLids += student.contributions.tampas || 0;
        totalCans += student.contributions.latas || 0;
        totalOil += student.contributions.oleo || 0;
        totalCoins += student.narcisoCoins || 0;
      });
    } 
    // Usando reduce (método novo otimizado)
    else {
      const stats = students.reduce((acc, student) => {
        return {
          lids: acc.lids + (student.contributions.tampas || 0),
          cans: acc.cans + (student.contributions.latas || 0),
          oil: acc.oil + (student.contributions.oleo || 0),
          coins: acc.coins + (student.narcisoCoins || 0)
        };
      }, { lids: 0, cans: 0, oil: 0, coins: 0 });
      
      totalLids = stats.lids;
      totalCans = stats.cans;
      totalOil = stats.oil;
      totalCoins = stats.coins;
    }
  }
  
  console.timeEnd('statsCalculation');
  
  return {
    iterations,
    totalLids,
    totalCans,
    totalOil,
    totalCoins,
    success: true
  };
}

// Não execute automaticamente estes testes para evitar problemas de desempenho
// Use explicitamente ao testar
