#!/usr/bin/env python3
import csv
import os
import psycopg2
import sys
from typing import Dict, List, Tuple

# Normaliza o nome removendo espaços extras e convertendo para maiúsculas
def normalize_name(name: str) -> str:
    return ' '.join(name.strip().upper().split())

def load_csv_data(csv_file: str) -> Dict[str, Dict]:
    """Carrega dados do CSV e retorna um dicionário indexado pelo nome normalizado"""
    csv_data = {}
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = normalize_name(row['Nome do Aluno'])
            csv_data[name] = {
                'tampas': int(row['Total de Tampas']) if row['Total de Tampas'] else 0,
                'latas': int(row['Total de Latas']) if row['Total de Latas'] else 0,
                'oleo': int(row['Litros de Óleo']) if row['Litros de Óleo'] else 0,
                'moedas': int(row['Total de Moedas']) if row['Total de Moedas'] else 0,
                'pend_tampas': int(row['Total de Tampas Pendente']) if row['Total de Tampas Pendente'] else 0,
                'pend_latas': int(row['Total de Latas Pendente']) if row['Total de Latas Pendente'] else 0,
                'pend_oleo': int(row['Total de Óleo Pendente']) if row['Total de Óleo Pendente'] else 0,
            }
    
    return csv_data

def get_db_data(connection_string: str) -> Dict[str, Dict]:
    """Conecta ao banco e retorna os dados dos estudantes"""
    db_data = {}
    
    conn = psycopg2.connect(connection_string)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT name, total_tampas_exchanged, total_latas_exchanged, total_oleo_exchanged,
               narciso_coins, pending_tampas, pending_latas, pending_oleo
        FROM students
        ORDER BY name
    """)
    
    for row in cur.fetchall():
        name = normalize_name(row[0])
        db_data[name] = {
            'tampas': row[1] or 0,
            'latas': row[2] or 0,
            'oleo': row[3] or 0,
            'moedas': row[4] or 0,
            'pend_tampas': row[5] or 0,
            'pend_latas': row[6] or 0,
            'pend_oleo': row[7] or 0,
        }
    
    cur.close()
    conn.close()
    
    return db_data

def compare_data(csv_data: Dict, db_data: Dict) -> None:
    """Compara os dados e mostra as diferenças"""
    
    print("=== COMPARAÇÃO DE DADOS ===\n")
    
    # Totais gerais
    csv_totals = {
        'tampas': sum(d['tampas'] for d in csv_data.values()),
        'latas': sum(d['latas'] for d in csv_data.values()),
        'oleo': sum(d['oleo'] for d in csv_data.values()),
        'moedas': sum(d['moedas'] for d in csv_data.values())
    }
    
    db_totals = {
        'tampas': sum(d['tampas'] for d in db_data.values()),
        'latas': sum(d['latas'] for d in db_data.values()),
        'oleo': sum(d['oleo'] for d in db_data.values()),
        'moedas': sum(d['moedas'] for d in db_data.values())
    }
    
    print("TOTAIS GERAIS:")
    print(f"Tampas - CSV: {csv_totals['tampas']}, Sistema: {db_totals['tampas']}, Diferença: {csv_totals['tampas'] - db_totals['tampas']}")
    print(f"Latas  - CSV: {csv_totals['latas']}, Sistema: {db_totals['latas']}, Diferença: {csv_totals['latas'] - db_totals['latas']}")
    print(f"Óleo   - CSV: {csv_totals['oleo']}, Sistema: {db_totals['oleo']}, Diferença: {csv_totals['oleo'] - db_totals['oleo']}")
    print(f"Moedas - CSV: {csv_totals['moedas']}, Sistema: {db_totals['moedas']}, Diferença: {csv_totals['moedas'] - db_totals['moedas']}")
    print()
    
    # Diferenças por aluno
    print("DIFERENÇAS POR ALUNO:")
    print("Nome | Tampas (CSV-Sistema) | Latas (CSV-Sistema) | Óleo (CSV-Sistema) | Moedas (CSV-Sistema)")
    print("-" * 120)
    
    differences_found = False
    
    all_names = set(csv_data.keys()) | set(db_data.keys())
    
    for name in sorted(all_names):
        csv_student = csv_data.get(name, {'tampas': 0, 'latas': 0, 'oleo': 0, 'moedas': 0})
        db_student = db_data.get(name, {'tampas': 0, 'latas': 0, 'oleo': 0, 'moedas': 0})
        
        diff_tampas = csv_student['tampas'] - db_student['tampas']
        diff_latas = csv_student['latas'] - db_student['latas']
        diff_oleo = csv_student['oleo'] - db_student['oleo']
        diff_moedas = csv_student['moedas'] - db_student['moedas']
        
        # Só mostra se há diferença
        if any([diff_tampas, diff_latas, diff_oleo, diff_moedas]):
            differences_found = True
            print(f"{name:<40} | {diff_tampas:>8} | {diff_latas:>8} | {diff_oleo:>8} | {diff_moedas:>8}")
    
    if not differences_found:
        print("Nenhuma diferença encontrada por aluno!")
    
    print()
    
    # Alunos só no CSV
    only_in_csv = set(csv_data.keys()) - set(db_data.keys())
    if only_in_csv:
        print("ALUNOS APENAS NO CSV:")
        for name in sorted(only_in_csv):
            print(f"  - {name}")
        print()
    
    # Alunos só no sistema
    only_in_db = set(db_data.keys()) - set(csv_data.keys())
    if only_in_db:
        print("ALUNOS APENAS NO SISTEMA:")
        for name in sorted(only_in_db):
            print(f"  - {name}")

if __name__ == "__main__":
    # Connection string do Supabase - usar variável de ambiente
    conn_str = os.environ.get('DATABASE_URL')
    if not conn_str:
        print("ERRO: Variável de ambiente DATABASE_URL não encontrada!")
        print("Configure a string de conexão do banco de dados.")
        exit(1)
    
    try:
        print("Carregando dados do CSV...")
        csv_data = load_csv_data("atualizado.csv")
        
        print("Carregando dados do sistema...")
        db_data = get_db_data(conn_str)
        
        print("Comparando dados...")
        compare_data(csv_data, db_data)
        
    except Exception as e:
        print(f"Erro: {e}")
        sys.exit(1)