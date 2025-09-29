#!/usr/bin/env python3
"""
Gera um arquivo SQL com INSERTs para popular a tabela public.exchanges
a partir de um CSV (`alunos_with_ids.csv`) que contém `student_id` e
quantidades para cada material.

Funcionalidades:
- Argumentos via CLI (input, output, rates, teacher_id, mode overwrite/append)
- Escreve cabeçalho BEGIN; e rodapé COMMIT; quando em modo overwrite
- Trata valores ausentes/strings corretamente
- Mostra um resumo ao final

Uso:
  python3 scripts/generate_inserts.py --in alunos_with_ids.csv --out aluno.sql --rates scripts/rates.csv --teacher "e8ebe6d2-7ec5-4d8c-98ff-7b72a09a5311" --mode overwrite
"""

import argparse
import csv
import sys
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser(description='Gerar INSERTs em public.exchanges a partir do CSV de alunos')
    p.add_argument('--in', dest='infile', default='alunos_with_ids.csv', help='CSV de entrada (com student_id)')
    p.add_argument('--out', dest='outfile', default='aluno.sql', help='Arquivo SQL de saída')
    p.add_argument('--rates', dest='ratesfile', default='scripts/rates.csv', help='CSV com taxas (material_id,units_per_coin)')
    p.add_argument('--teacher', dest='teacher_id', default=None, help='UUID do teacher_id a inserir (se omitido, será NULL)')
    p.add_argument('--mode', dest='mode', choices=['overwrite','append'], default='overwrite', help='overwrite: recria o arquivo com BEGIN/COMMIT; append: adiciona no fim (não escreve BEGIN/COMMIT)')
    return p.parse_args()


def load_rates(path):
    rates = {}
    p = Path(path)
    if not p.exists():
        print(f'Warning: rates file {path} não encontrado — usando defaults', file=sys.stderr)
        return {'tampas': 20, 'latas': 30, 'oleo': 2}
    with p.open(newline='') as rf:
        r = csv.DictReader(rf)
        for row in r:
            try:
                rates[row['material_id']] = int(row.get('units_per_coin') or row.get('units_per_coin'.strip()) or 0)
            except Exception:
                # fallback se a coluna tiver outro nome
                try:
                    rates[row.get('material_id') or row.get('material') or ''] = int(row[list(row.keys())[-1]] or 0)
                except Exception:
                    continue
    # defaults se faltar
    for k, v in (('tampas',20),('latas',30),('oleo',2)):
        rates.setdefault(k, v)
    return rates


def parse_int(value):
    if value is None:
        return 0
    s = str(value).strip()
    if s == '':
        return 0
    # remover possíveis separadores de milhar
    s = s.replace('.', '').replace(',', '')
    try:
        return int(s)
    except ValueError:
        try:
            return int(float(s))
        except Exception:
            return 0


def make_insert(student_id, material, qty, coins, teacher_id, conversion_rate):
    teacher_val = f"'{teacher_id}'" if teacher_id else 'NULL'
    return ("INSERT INTO public.exchanges (student_id, material_id, quantity, coins_earned, teacher_id, conversion_rate, created_at) "
            f"VALUES ('{student_id}', '{material}', {qty}, {coins}, {teacher_val}, {conversion_rate}, now());")


def main():
    args = parse_args()
    rates = load_rates(args.ratesfile)

    infile = Path(args.infile)
    outfile = Path(args.outfile)

    if not infile.exists():
        print(f'Arquivo de entrada {infile} não encontrado', file=sys.stderr)
        sys.exit(1)

    inserts = []
    skipped_no_id = 0
    total_statements = 0

    with infile.open(newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            student_id = (row.get('student_id') or '').strip()
            if not student_id:
                skipped_no_id += 1
                continue

            tampas = parse_int(row.get('Total de Tampas') or row.get('tampas') or row.get('Tampas'))
            latas = parse_int(row.get('Total de Latas') or row.get('latas') or row.get('Latas'))
            oleo = parse_int(row.get('Litros de Óleo') or row.get('oleo') or row.get('Oleo') or row.get('Litros'))

            if tampas > 0:
                units = rates.get('tampas', 20)
                coins = tampas // units
                inserts.append(make_insert(student_id, 'tampas', tampas, coins, args.teacher_id, units))
            if latas > 0:
                units = rates.get('latas', 30)
                coins = latas // units
                inserts.append(make_insert(student_id, 'latas', latas, coins, args.teacher_id, units))
            if oleo > 0:
                units = rates.get('oleo', 2)
                coins = oleo // units
                inserts.append(make_insert(student_id, 'oleo', oleo, coins, args.teacher_id, units))

    # Escrever arquivo
    if args.mode == 'overwrite':
        with outfile.open('w') as out:
            out.write('-- Script gerado automaticamente a partir de ' + str(infile) + '\n')
            out.write('-- Campos: student_id, material_id, quantity, coins_earned, teacher_id, conversion_rate, created_at\n\n')
            out.write('BEGIN;\n\n')
            for stmt in inserts:
                out.write(stmt + '\n')
            out.write('\nCOMMIT;\n')
    else:  # append
        with outfile.open('a') as out:
            for stmt in inserts:
                out.write(stmt + '\n')

    total_statements = len(inserts)
    print(f'Gerado {total_statements} INSERT statements em {outfile} (ignorados sem student_id: {skipped_no_id})')


if __name__ == '__main__':
    main()

