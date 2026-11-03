// @ts-nocheck
import * as XLSX from 'xlsx';
import * as AccountingCalcService from './AccountingCalcService.js';

function sheetFromRows(name, rows, columns) {
  const data = [
    columns.map((c) => c.header),
    ...rows.map((row) => columns.map((c) => {
      const value = typeof c.value === 'function' ? c.value(row) : row[c.value];
      return value == null ? '' : value;
    })),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

export async function buildExportWorkbook(filters = {}) {
  const [cost, collection, profit, cashBook, aging, inventory, ledger, summary] =
    await Promise.all([
      AccountingCalcService.getCostPerCar(filters),
      AccountingCalcService.getCollectionPerCar(filters),
      AccountingCalcService.getCarProfit(filters),
      AccountingCalcService.getCashBook(filters),
      AccountingCalcService.getReceivableAging(filters),
      AccountingCalcService.getInventoryValuation(),
      AccountingCalcService.getCustomerLedger(filters),
      AccountingCalcService.getSummary(filters),
    ]);

  const wb = XLSX.utils.book_new();

  const summaryRows = [
    { metric: 'Total balance', value: summary.data.total_balance },
    { metric: 'Collected', value: summary.data.collection?.collected },
    { metric: 'Due', value: summary.data.collection?.due },
    { metric: 'Car costs', value: summary.data.cost?.total_cost },
    { metric: 'Expenses', value: summary.data.expenses?.total_expenses },
    { metric: 'Supplier payments', value: summary.data.supplier_payments?.total },
    { metric: 'Gross profit', value: summary.data.profit?.gross_profit },
    { metric: 'Net after expenses', value: summary.data.profit?.net_after_expenses },
  ];
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('Summary', summaryRows, [
      { header: 'Metric', value: 'metric' },
      { header: 'Value', value: 'value' },
    ]),
    'Summary'
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('CostPerCar', cost.data.rows, [
      { header: 'Car ID', value: 'car_id' },
      { header: 'Chassis', value: 'chassis_no_full' },
      { header: 'Make', value: 'make' },
      { header: 'Model', value: 'model' },
      { header: 'LC', value: 'lc_number' },
      { header: 'Purchase cost', value: 'purchase_cost' },
      { header: 'Extra cost', value: 'extra_cost' },
      { header: 'Total cost', value: 'total_cost' },
    ]),
    'CostPerCar'
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('Collection', collection.data.rows, [
      { header: 'Payment ID', value: 'payment_history_id' },
      { header: 'Customer', value: 'customer_name' },
      { header: 'Chassis', value: 'chassis_no_full' },
      { header: 'Sale', value: 'sale_amount' },
      { header: 'Collected', value: 'collected' },
      { header: 'Due', value: 'due' },
    ]),
    'Collection'
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('Profit', profit.data.rows, [
      { header: 'Car ID', value: 'car_id' },
      { header: 'Chassis', value: 'chassis_no_full' },
      { header: 'Total cost', value: 'total_cost' },
      { header: 'Sale', value: 'sale_amount' },
      { header: 'Profit', value: 'gross_profit' },
      { header: 'Margin %', value: 'margin_percent' },
    ]),
    'Profit'
  );

  const cashRows = [];
  for (const day of cashBook.data.days || []) {
    for (const entry of day.entries || []) {
      cashRows.push({
        date: day.date,
        account: entry.account_name,
        type: entry.type,
        amount: entry.amount,
        reference: entry.reference,
        source_type: entry.source_type,
      });
    }
  }
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('CashBook', cashRows, [
      { header: 'Date', value: 'date' },
      { header: 'Account', value: 'account' },
      { header: 'Type', value: 'type' },
      { header: 'Amount', value: 'amount' },
      { header: 'Reference', value: 'reference' },
      { header: 'Source', value: 'source_type' },
    ]),
    'CashBook'
  );

  const agingRows = [];
  for (const key of ['current', 'days_31_60', 'days_61_plus']) {
    for (const row of aging.data.buckets?.[key]?.rows || []) {
      agingRows.push(row);
    }
  }
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('Aging', agingRows, [
      { header: 'Customer', value: 'customer_name' },
      { header: 'Chassis', value: 'chassis_no_full' },
      { header: 'Due', value: 'due' },
      { header: 'Days', value: 'days_overdue' },
      { header: 'Bucket', value: 'aging_bucket' },
    ]),
    'Aging'
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('Inventory', inventory.data.rows, [
      { header: 'Car ID', value: 'car_id' },
      { header: 'Chassis', value: 'chassis_no_full' },
      { header: 'Status', value: 'car_status' },
      { header: 'Purchase', value: 'purchase_cost' },
      { header: 'Extra', value: 'extra_cost' },
      { header: 'Value', value: 'total_cost' },
    ]),
    'Inventory'
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows('CustomerLedger', ledger.data.rows, [
      { header: 'Customer', value: 'customer_name' },
      { header: 'Contact', value: 'contact_number' },
      { header: 'Sale', value: 'sale_amount' },
      { header: 'Collected', value: 'collected' },
      { header: 'Due', value: 'due' },
    ]),
    'CustomerLedger'
  );

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `accounting-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { buffer, filename, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
}

export default { buildExportWorkbook };
