import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula totais de material, moedas e sobra (pendente) a partir da lista de trocas.
 * @param exchanges Lista de trocas ordenada por data (ascendente)
 * @returns { totalMaterial, totalMoedas, pendente }
 */
export function calcularTotaisTrocas(exchanges: Array<{ quantity: number, conversion_rate: number }>) {
  let pendente = 0;
  let totalMoedas = 0;
  let totalMaterial = 0;
  for (const ex of exchanges) {
    const quantidade = ex.quantity || 0;
    const taxa = ex.conversion_rate || 1;
    const total = pendente + quantidade;
    const moedas = Math.floor(total / taxa);
    pendente = total - (moedas * taxa);
    totalMoedas += moedas;
    totalMaterial += quantidade;
  }
  return { totalMaterial, totalMoedas, pendente };
}
