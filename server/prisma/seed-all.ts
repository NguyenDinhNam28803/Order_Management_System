/**
 * Seed orchestrator — run with: npx ts-node prisma/seed-all.ts
 *
 * Order matters: orgs/users must exist before PRs, budgets, etc.
 * Each step is wrapped in a try/catch so a single failure doesn't abort all.
 */

import { execSync } from 'child_process';
import path from 'path';

const run = (file: string) => {
  const full = path.resolve(__dirname, file);
  console.log(`\n▶  ${file}`);
  try {
    execSync(`npx ts-node --transpile-only "${full}"`, { stdio: 'inherit' });
    console.log(`✅ ${file} — done`);
  } catch (err) {
    console.error(`❌ ${file} — failed`, err);
  }
};

async function main() {
  console.log('=== OMS Seed Orchestrator ===\n');

  // 1. Core data
  run('seed.ts');

  // 2. Organizations / buyers
  run('seed_buyers.ts');
  run('seed_new_test_org.ts');

  // 3. Suppliers
  run('seed_supplier_1.ts');
  run('seed_supplier_abc.ts');
  run('seed_supplier_electronics.ts');
  run('seed_office_supplies_supplier.ts');
  run('seed_fpt_shop.ts');
  run('seed_fpt_software.ts');
  run('seed_nam_viet.ts');
  run('seed_nam_fpt.ts');
  run('seed_new_suppliers.ts');

  // 4. Products
  run('seed_vn_products.ts');
  run('seed_business_office_products.ts');
  run('seed_fpt_shop_products_volatility.ts');
  run('seed_fptshop_bienhoa.ts');

  // 5. Users
  run('seed_users_for_org.ts');

  // 6. Budget & approval rules
  run('seed_budget_costcenter.ts');
  run('seed_budget_for_testing.ts');
  run('seed_all_quarters_budget.ts');
  run('seed_q1_2026_one_billion.ts');
  run('seed_budget_approval_rules.ts');
  run('seed_approval_rules.ts');
  run('seed_pr_ceilings.ts');

  // 7. Flow data
  run('seed_flow.ts');

  // 8. Email templates
  run('seed_email_templates.ts');

  console.log('\n=== Seeding complete ===');
}

main().catch(console.error);
