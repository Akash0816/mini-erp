# Mini ERP Manufacturing (prototype)
React + TypeScript + MUI + React Router + Recharts. Data lives in localStorage (`mini-erp-db-v1`); **Reset demo** restores the seed.
## Run
    npm install && npm run dev
## Structure
`src/store.tsx` = entities + all stock/finance rules (`ops`) behind one atomic `act()` (swap for REST calls later); `src/ui.tsx` = shared components; `src/pages.tsx` = 13 modules; `src/App.tsx` = shell, routes, role switcher.
## Rules implemented
Drafts/PO approval/bills never touch stock · GRN adds accepted qty only, partial receipts, over-receipt needs override · invoices deduct stock once on Confirm and validate availability · transfers keep total stock · audits adjust only after approval, once · payments cannot exceed balance · every change is atomic (errors change nothing).
## Limitations
Single-user local state (no real-time sync), reserved stock always 0, sales returns/cancel-reversal, credit-limit checks, batch numbers, charts limited to purchase vs sales totals, no per-module unit tests.
## Suggested Spring Boot endpoints
`/api/auth/login` · `/api/{items,customers,vendors,users}` (CRUD) · `/api/purchase-orders` (+`/{id}/submit|approve|reject`) · `/api/direct-purchases` · `/api/grns` · `/api/warehouses` · `/api/stock?warehouse=&item=` · `/api/stock/transfers` · `/api/stock/movements` · `/api/stock-audits` (+`/{id}/submit|approve|reject`) · `/api/purchase-bills` (+`/{id}/payments`) · `/api/sales-invoices` (+`/{id}/confirm|payments`) · `/api/reports/{name}` · `/api/roles/{role}/permissions`. Enforce authorization and idempotency keys server-side.
"# mini-erp" 
