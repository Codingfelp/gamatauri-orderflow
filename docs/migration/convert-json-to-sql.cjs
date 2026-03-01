#!/usr/bin/env node
/**
 * Converte o JSON exportado do banco em SQL INSERT statements.
 * 
 * Uso:
 *   node docs/migration/convert-json-to-sql.cjs
 * 
 * Gera: docs/migration/002_seed_data.sql
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'data', 'database-export-2026-02-26.json');
const OUTPUT = path.join(__dirname, '002_seed_data.sql');

// Ordem de inserção respeitando foreign keys
const TABLE_ORDER = [
  'store_settings',
  'products',
  'coupons',
  'product_promotions',
  'product_bundles',
  'product_custom_colors',
  // Tabelas dependentes de auth (profiles, user_roles, etc.) são vazias no export
  // mas incluímos caso tenham dados futuros
  'profiles',
  'user_roles',
  'user_addresses',
  'orders',
  'order_items',
  'coupon_usage',
  'push_subscriptions',
  'user_recommendations',
];

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    // PostgreSQL array literal
    if (val.length === 0) return "'{}'";
    const inner = val.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `'{${inner}}'`;
  }
  if (typeof val === 'object') {
    // JSONB
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  // String — escape single quotes
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(tableName, rows) {
  if (!rows || rows.length === 0) return '';

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');
  
  let sql = `-- =============================================\n`;
  sql += `-- ${tableName} (${rows.length} registros)\n`;
  sql += `-- =============================================\n\n`;

  // Use batch inserts (groups of 50)
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    sql += `INSERT INTO public."${tableName}" (${colList}) VALUES\n`;
    
    const valueRows = batch.map(row => {
      const vals = columns.map(col => escapeValue(row[col]));
      return `  (${vals.join(', ')})`;
    });
    
    sql += valueRows.join(',\n');
    sql += `\nON CONFLICT (id) DO NOTHING;\n\n`;
  }

  return sql;
}

// Main
console.log(`Lendo: ${INPUT}`);
const raw = fs.readFileSync(INPUT, 'utf-8');
const json = JSON.parse(raw);
const data = json.data;

let output = `-- =============================================\n`;
output += `-- Seed Data — Zup Deliver\n`;
output += `-- Gerado de: ${path.basename(INPUT)}\n`;
output += `-- Data export: ${json.exported_at || 'N/A'}\n`;
output += `-- Gerado em: ${new Date().toISOString()}\n`;
output += `-- =============================================\n\n`;
output += `-- IMPORTANTE: Execute APÓS o schema (001_schema.sql)\n`;
output += `-- Usa ON CONFLICT (id) DO NOTHING para ser idempotente\n\n`;
output += `BEGIN;\n\n`;

let totalRows = 0;
for (const table of TABLE_ORDER) {
  const rows = data[table];
  if (rows && rows.length > 0) {
    output += generateInserts(table, rows);
    totalRows += rows.length;
    console.log(`  ${table}: ${rows.length} registros`);
  } else {
    output += `-- ${table}: sem dados\n\n`;
  }
}

output += `COMMIT;\n`;
output += `\n-- Total: ${totalRows} registros inseridos\n`;

fs.writeFileSync(OUTPUT, output, 'utf-8');
console.log(`\nGerado: ${OUTPUT} (${totalRows} registros totais)`);
