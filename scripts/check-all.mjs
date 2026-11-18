#!/usr/bin/env node
/**
 * Параллельный запуск всех проверок сайта:
 * - Линтинг (lint)
 * - Проверка сайта (site check)
 * - SEO проверка (seo check)
 * - Аналитика (analytics consent)
 * - Путешествия пациентов (patient journeys)
 *
 * Экономит время при полной проверке, так как все проверки независимы.
 */

import { spawn } from 'child_process';

const checks = [
  { name: 'Lint (ESLint)', cmd: 'npm', args: ['run', 'lint'] },
  { name: 'Site Check', cmd: 'npm', args: ['run', 'check:site'] },
  { name: 'SEO Check', cmd: 'npm', args: ['run', 'check:seo'] },
  { name: 'Analytics Check', cmd: 'npm', args: ['run', 'check:analytics'] },
  { name: 'Patient Journeys', cmd: 'npm', args: ['run', 'check:journeys'] },
];

const base = process.env.BASE_URL || 'http://127.0.0.1:3111';
const results = new Map();
let failedCount = 0;

function runCheck(check) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(check.cmd, check.args, {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: base, CHECK_URL: base },
    });

    child.on('close', (code) => {
      if (results.has(check.name)) return;
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const result = {
        passed: code === 0,
        duration,
        code,
      };
      results.set(check.name, result);

      if (code === 0) {
        console.log(`\n✓ ${check.name} (${duration}s)`);
      } else {
        console.log(`\n✗ ${check.name} (${duration}s) - код выхода: ${code}`);
        failedCount++;
      }
      resolve();
    });

    child.on('error', (err) => {
      console.error(`\n✗ ${check.name} - ошибка запуска: ${err.message}`);
      results.set(check.name, { passed: false, error: err.message });
      failedCount++;
      resolve();
    });
  });
}

async function main() {
  console.log('🚀 Запуск параллельных проверок сайта...\n');

  // Запускаем все проверки одновременно
  await Promise.all(checks.map(runCheck));

  console.log('\n' + '='.repeat(50));
  console.log('📊 Итоги проверок:\n');

  results.forEach((result, name) => {
    const icon = result.passed ? '✓' : '✗';
    const status = result.passed ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${name}: ${status} (${result.duration}s)`);
  });

  console.log('\n' + '='.repeat(50));
  if (failedCount === 0) {
    console.log('✓ Все проверки пройдены!');
    process.exit(0);
  } else {
    console.log(`✗ Провалено ${failedCount} из ${checks.length} проверок`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
