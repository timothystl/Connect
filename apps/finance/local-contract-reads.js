// Finance answers its own accounting contracts instead of asking Connect.
//
// Finance's accounting records live only in Finance's database. Reads (reports) and, since
// 2026-09-29, writes (budget plan, imports, Chart of Accounts layout, Commercial Property, Daycare
// Report, Compensation plan, settings) run here with Finance's own copy of the accounting code
// (apps/finance/accounting/), so a Finance change never needs a matching Connect change and a slow
// or redeploying Connect no longer blanks or blocks them.
//
// Connect still answers what it owns: Giving, staff identity and roles (every local write asks
// Connect who is acting), the reads that mix in Giving, and the myMDO syncs until Finance has
// that connection's settings. A local READ that fails falls through to Connect, which reads the
// same database; a local WRITE never does, so a save can't be applied twice.
import {
  respondWithFinanceDataStatusV1, respondWithFinanceCashRunwayV1, respondWithFinanceChartOfAccountsV1,
  respondWithFinanceBudgetV1, respondWithFinanceChurchReportV1, respondWithFinanceChurchReportTrendV1,
  respondWithFinanceBalanceSheetV1, respondWithFinanceBalanceSheetTrendV1, respondWithFinanceDaycareReportV1,
  respondWithFinanceDaycareEntriesV1, respondWithFinancePropertyValuationV1, respondWithFinanceCompensationV1,
  respondWithFinancePropertyOperatingV1, respondWithFinancePropertyReservesV1, respondWithFinancePropertyLedgersV1,
  respondWithFinancePropertyForecastV1,
} from './accounting/contracts.js';
import { respondWithFinanceClassificationV1 } from './accounting/classification-contract.js';
import { respondWithFinanceBoardLayoutV1 } from './accounting/board-layout-contract.js';
import { respondWithFinanceBudgetBuilderV1 } from './accounting/budget-builder-contract.js';
import { respondWithFinancePlanningBasisV1 } from './accounting/planning-contract.js';
import { respondWithFinancePropertyPolicyV1 } from './accounting/property-policy-contract.js';
import { respondWithFinancePropertyDebtV1 } from './accounting/property-debt-contract.js';
import { respondWithFinanceImportStatusV1, respondWithFinanceDaycareChurchBudgetPreviewV1 } from './accounting/data-imports-contract.js';
import { localAccountingContract } from './accounting/write-contracts.js';

const LOCAL_READS = {
  'finance-data-status-v1': (url, db) => respondWithFinanceDataStatusV1(db),
  'finance-classification-v1': respondWithFinanceClassificationV1,
  // finance_import_log plus the imported tables it derives dates from, and finance_church_entries:
  // all Finance-owned. (The board packet also reads Giving's fund totals, so it stays with Connect.)
  'finance-import-status-v1': (url, db) => respondWithFinanceImportStatusV1(db),
  'finance-daycare-church-budget-preview-v1': respondWithFinanceDaycareChurchBudgetPreviewV1,
  'finance-cash-runway-v1': respondWithFinanceCashRunwayV1,
  'finance-chart-of-accounts-v1': respondWithFinanceChartOfAccountsV1,
  'finance-board-layout-v1': (url, db) => respondWithFinanceBoardLayoutV1(db),
  'finance-budget-builder-v1': respondWithFinanceBudgetBuilderV1,
  'finance-planning-basis-v1': respondWithFinancePlanningBasisV1,
  'finance-budget-v1': respondWithFinanceBudgetV1,
  'finance-church-report-v1': respondWithFinanceChurchReportV1,
  'finance-church-report-trend-v1': (url, db) => respondWithFinanceChurchReportTrendV1(db),
  'finance-balance-sheet-v1': respondWithFinanceBalanceSheetV1,
  'finance-balance-sheet-trend-v1': (url, db) => respondWithFinanceBalanceSheetTrendV1(db, url),
  'finance-daycare-report-v1': respondWithFinanceDaycareReportV1,
  'finance-daycare-entries-v1': respondWithFinanceDaycareEntriesV1,
  'finance-property-valuation-v1': respondWithFinancePropertyValuationV1,
  'finance-property-policy-v1': respondWithFinancePropertyPolicyV1,
  'finance-property-debt-v1': respondWithFinancePropertyDebtV1,
  'finance-compensation-v1': (url, db) => respondWithFinanceCompensationV1(db),
  'finance-property-operating-v1': respondWithFinancePropertyOperatingV1,
  'finance-property-reserves-v1': respondWithFinancePropertyReservesV1,
  'finance-property-ledgers-v1': respondWithFinancePropertyLedgersV1,
  'finance-property-forecast-v1': respondWithFinancePropertyForecastV1,
};

export function localContractReadsEnabled(env) {
  return env.FINANCE_LOCAL_CONTRACT_READS === '1' && !!env.FINANCE_DB && !!env.CONNECT_SERVICE;
}

// Wraps the Connect service binding: accounting contracts are answered from FINANCE_DB,
// everything else goes to Connect exactly as before.
export function withLocalContractReads(env) {
  if (!localContractReadsEnabled(env)) return env;
  const connect = env.CONNECT_SERVICE;
  const db = env.FINANCE_DB;
  // The local write handlers ask the real Connect binding who is acting.
  const direct = { ...env, CONNECT_SERVICE: connect };
  return {
    ...env,
    CONNECT_SERVICE: {
      async fetch(request, init) {
        const req = request instanceof Request ? request : new Request(request, init);
        const url = new URL(req.url);
        const name = url.pathname.startsWith('/api/contracts/') ? url.pathname.slice('/api/contracts/'.length) : '';
        const read = req.method === 'GET' ? LOCAL_READS[name] : null;
        if (read) {
          try {
            const res = await read(url, db);
            if (res.ok) return res;
          } catch {
            // Fall through to Connect.
          }
        }
        const write = name ? localAccountingContract(name, req.method, env) : null;
        if (write) return write(req, direct);
        return connect.fetch(req);
      },
    },
  };
}
