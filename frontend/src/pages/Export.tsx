import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { useCompanyStore } from '../store/companyStore';
import { useAuthStore } from '../store/authStore';
import { Item, Transaction, CashFlowEntry, Category, SalesCustomer } from '../types';
import { formatCurrency, formatOrderId } from '../utils/formatters';
import './Export.css';

const PRINT_STYLES = `
  @media print { @page { size: A4; margin: 12mm; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #222; margin: 0; padding: 20px; }
  .doc-header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 12px; margin-bottom: 20px; }
  .doc-title { font-size: 18px; font-weight: 700; color: #1a365d; margin: 0 0 4px 0; }
  .doc-meta { font-size: 11px; color: #555; margin: 2px 0; }
  .doc-footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #1a365d; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { padding: 8px 10px; text-align: left; border: 1px solid #ddd; }
  th { background: #1a365d; color: #fff; font-weight: 600; }
  .text-right { text-align: right; }
  .totals-row { background: #f0f4f8; font-weight: 600; }
  .two-column-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .two-column-layout .column-table { width: 100%; }
`;

function openPrintWindow(title: string, html: string) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow pop-ups to open the export document.');
    return;
  }
  w.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title><style>${PRINT_STYLES}</style></head><body>${html}</body></html>`
  );
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 300);
}

export default function Export() {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [salesCustomers, setSalesCustomers] = useState<SalesCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [topBottomLimit, setTopBottomLimit] = useState(10);
  const [eodDate, setEodDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [categoryDateFrom, setCategoryDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [categoryDateTo, setCategoryDateTo] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const [invDate, setInvDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [invDateMode, setInvDateMode] = useState<'single' | 'range'>('single');
  const [invDateFrom, setInvDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [invDateTo, setInvDateTo] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [invHideCostPrice, setInvHideCostPrice] = useState(false);

  const [salesDateFrom, setSalesDateFrom] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [salesDateTo, setSalesDateTo] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [salesDateMode, setSalesDateMode] = useState<'single' | 'range'>('single');
  const [salesSingleDate, setSalesSingleDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [ieDateFrom, setIeDateFrom] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [ieDateTo, setIeDateTo] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [ieDateMode, setIeDateMode] = useState<'single' | 'range'>('range');

  const { company, loadCompany } = useCompanyStore();
  const { customer } = useAuthStore();
  const isAdmin = customer?.isAdmin ?? false;

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [itemsData, txData, catData, salesCustData] = await Promise.all([
          storageService.getItems(),
          storageService.getTransactions(),
          storageService.getCategories(),
          storageService.getSalesCustomers().catch(() => []),
        ]);
        if (!cancelled) {
          setItems(Array.isArray(itemsData) ? itemsData : (itemsData as any)?.items || []);
          setTransactions(Array.isArray(txData) ? txData : (txData as any)?.transactions || []);
          setCategories(Array.isArray(catData) ? catData : (catData as any)?.categories || []);
          setSalesCustomers(Array.isArray(salesCustData) ? salesCustData : []);
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const companyName = company?.name || 'Company';
  const headerHtml = (reportTitle: string, dateLabel?: string) => `
    <div class="doc-header">
      <div class="doc-title">${companyName}</div>
      <div class="doc-meta">${reportTitle}</div>
      <div class="doc-meta">Generated: ${now.toLocaleDateString('en-IN')} &nbsp;|&nbsp; ${now.toLocaleTimeString('en-IN')}${dateLabel ? ` &nbsp;|&nbsp; ${dateLabel}` : ''}</div>
    </div>`;

  const getSoldQtyByItemId = (dateFrom?: string, dateTo?: string): Record<string, number> => {
    const map: Record<string, number> = {};
    let filteredTx = transactions;
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filteredTx = transactions.filter((tx) => {
        const d = new Date(tx.created_at);
        return d >= start && d <= end;
      });
    }
    filteredTx.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const id = item.id;
          map[id] = (map[id] || 0) + qty;
        });
      } catch (_) {}
    });
    return map;
  };

  const handleExportItemNameMappingCode = () => {
    setExportLoading('item-name-mapping');
    const withMappingCode = items.filter((item) => (item.mapping_code ?? '').toString().trim() !== '');
    const sorted = [...withMappingCode].sort((a, b) => {
      const ac = (a.mapping_code ?? '').toString().trim();
      const bc = (b.mapping_code ?? '').toString().trim();
      if (ac === bc) return 0;
      return ac.localeCompare(bc, undefined, { numeric: true });
    });
    const mid = Math.ceil(sorted.length / 2);
    const leftItems = sorted.slice(0, mid);
    const rightItems = sorted.slice(mid);
    const makeTable = (list: Item[]) =>
      list.map((item) => `
        <tr>
          <td>${(item.mapping_code ?? '').toString() || '-'}</td>
          <td>${item.name}</td>
        </tr>`).join('');
    const leftRows = makeTable(leftItems);
    const rightRows = makeTable(rightItems);
    const emptyRow = '<tr><td>-</td><td>-</td></tr>';
    const body =
      sorted.length === 0
        ? '<p style="margin: 1rem 0;">No items with mapping code.</p>'
        : `
      <div class="two-column-layout">
        <table class="column-table">
          <thead>
            <tr><th>Mapping Code</th><th>Item Name</th></tr>
          </thead>
          <tbody>${leftRows || emptyRow}</tbody>
        </table>
        <table class="column-table">
          <thead>
            <tr><th>Mapping Code</th><th>Item Name</th></tr>
          </thead>
          <tbody>${rightRows || emptyRow}</tbody>
        </table>
      </div>`;
    const html = `
      ${headerHtml('Item Name & Mapping Code', 'Sorted by mapping code (ascending)')}
      ${body}
      <div class="doc-footer">
        Total items with mapping code: ${sorted.length}
      </div>`;
    openPrintWindow('Item Name & Mapping Code', html);
    setExportLoading(null);
  };

  const handleExportInventory = () => {
    setExportLoading('inventory');
    const useRange = invDateMode === 'range';
    const hideCostPrice = invHideCostPrice;
    const soldQtyMap = useRange
      ? getSoldQtyByItemId(invDateFrom, invDateTo)
      : getSoldQtyByItemId();
    let totalCurrentQty = 0;
    let totalSoldQty = 0;
    let totalCost = 0;
    let totalPrice = 0;

    const rows = items.map((item, idx) => {
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
      const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
      const c = isNaN(cost) ? 0 : cost;
      const p = isNaN(price) ? 0 : price;
      const sold = soldQtyMap[item.id] || 0;
      totalCurrentQty += item.stock;
      totalSoldQty += sold;
      totalCost += item.stock * c;
      totalPrice += item.stock * p;
      if (hideCostPrice) {
        return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${item.name}</td>
          <td>${item.code}</td>
          <td class="text-right">${item.stock}</td>
          <td class="text-right">${sold}</td>
        </tr>`;
      }
      return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${item.name}</td>
          <td>${item.code}</td>
          <td class="text-right">${item.stock}</td>
          <td class="text-right">${sold}</td>
          <td class="text-right">${formatCurrency(c)}</td>
          <td class="text-right">${formatCurrency(p)}</td>
        </tr>`;
    }).join('');

    const dateLabel = useRange
      ? `As on ${invDateTo} | Sold Qty Period: ${invDateFrom} to ${invDateTo}`
      : `As on ${invDate}`;
    const colCount = hideCostPrice ? 5 : 7;
    const thead = hideCostPrice
      ? `
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Item Name</th>
            <th>Item Code</th>
            <th class="text-right">Current Stock</th>
            <th class="text-right">${useRange ? `Sold Qty (${invDateFrom} to ${invDateTo})` : 'Sold Qty'}</th>
          </tr>
        </thead>`
      : `
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Item Name</th>
            <th>Item Code</th>
            <th class="text-right">Current Stock</th>
            <th class="text-right">${useRange ? `Sold Qty (${invDateFrom} to ${invDateTo})` : 'Sold Qty'}</th>
            <th class="text-right">Cost</th>
            <th class="text-right">Price</th>
          </tr>
        </thead>`;
    const tfoot = hideCostPrice
      ? `
        <tfoot>
          <tr class="totals-row">
            <td colspan="3" class="text-right">Total</td>
            <td class="text-right">${totalCurrentQty}</td>
            <td class="text-right">${totalSoldQty}</td>
          </tr>
        </tfoot>`
      : `
        <tfoot>
          <tr class="totals-row">
            <td colspan="3" class="text-right">Total</td>
            <td class="text-right">${totalCurrentQty}</td>
            <td class="text-right">${totalSoldQty}</td>
            <td class="text-right">${formatCurrency(totalCost)}</td>
            <td class="text-right">${formatCurrency(totalPrice)}</td>
          </tr>
        </tfoot>`;
    const footerText = hideCostPrice
      ? `Total Current Qty: ${totalCurrentQty} &nbsp;|&nbsp; Total Sold Qty: ${totalSoldQty}`
      : `Total Current Qty: ${totalCurrentQty} &nbsp;|&nbsp; Total Sold Qty: ${totalSoldQty} &nbsp;|&nbsp; Total Cost: ${formatCurrency(totalCost)} &nbsp;|&nbsp; Total Price: ${formatCurrency(totalPrice)}`;
    const html = `
      ${headerHtml('Inventory Details Report', dateLabel)}
      <table>
        ${thead}
        <tbody>${rows || `<tr><td colspan="${colCount}">No items</td></tr>`}</tbody>
        ${tfoot}
      </table>
      <div class="doc-footer">
        ${footerText}
      </div>`;
    openPrintWindow('Inventory Details', html);
    setExportLoading(null);
  };

  const getFilteredTransactionsForDates = (from: string, to: string): Transaction[] => {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return transactions.filter((tx) => {
      const d = new Date(tx.created_at);
      return d >= start && d <= end;
    });
  };

  const handleExportDailySales = () => {
    setExportLoading('sales');
    const from = salesDateMode === 'single' ? salesSingleDate : salesDateFrom;
    const to = salesDateMode === 'single' ? salesSingleDate : salesDateTo;
    const filtered = getFilteredTransactionsForDates(from, to);

    let totalOrders = 0;
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalProfit = 0;

    const rows = filtered.map((tx, idx) => {
      let subtotal = 0;
      let costSum = 0;
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const price = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          subtotal += (isNaN(price) ? 0 : price) * qty;
          costSum += (isNaN(cost) ? 0 : cost) * qty;
        });
      } catch (_) {}
      const totalAmount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      const discount = Math.max(0, subtotal - (isNaN(totalAmount as number) ? 0 : (totalAmount as number)));
      const profit = subtotal - costSum - discount;
      totalOrders += 1;
      totalSubtotal += subtotal;
      totalDiscount += discount;
      totalProfit += profit;
      return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${formatOrderId(tx.id)}</td>
          <td>${new Date(tx.created_at).toLocaleString('en-IN')}</td>
          <td class="text-right">${formatCurrency(discount)}</td>
          <td class="text-right">${formatCurrency(subtotal)}</td>
          <td class="text-right">${formatCurrency(profit)}</td>
          <td class="text-right">${formatCurrency(totalAmount)}</td>
        </tr>`;
    }).join('');

    const dateLabel = from === to ? `Date: ${from}` : `From ${from} to ${to}`;
    const html = `
      ${headerHtml('Daily Sales Report', dateLabel)}
      <table>
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Order ID</th>
            <th>Date & Time</th>
            <th class="text-right">Discount</th>
            <th class="text-right">Subtotal</th>
            <th class="text-right">Profit</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7">No orders in selected period</td></tr>'}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="3" class="text-right">Total (${totalOrders} orders)</td>
            <td class="text-right">${formatCurrency(totalDiscount)}</td>
            <td class="text-right">${formatCurrency(totalSubtotal)}</td>
            <td class="text-right">${formatCurrency(totalProfit)}</td>
            <td class="text-right">${formatCurrency(totalSubtotal - totalDiscount)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        Total Orders: ${totalOrders} &nbsp;|&nbsp; Total Subtotal: ${formatCurrency(totalSubtotal)} &nbsp;|&nbsp; Total Discount: ${formatCurrency(totalDiscount)} &nbsp;|&nbsp; Total Profit: ${formatCurrency(totalProfit)}
      </div>`;
    openPrintWindow('Daily Sales Report', html);
    setExportLoading(null);
  };

  const handleExportIncomeExpense = async () => {
    setExportLoading('income-expense');
    const from = ieDateMode === 'single' ? ieDateFrom : ieDateFrom;
    const to = ieDateMode === 'single' ? ieDateFrom : ieDateTo;
    const startDate = new Date(from).toISOString();
    const endDate = new Date(to + 'T23:59:59').toISOString();
    try {
      const entries = await storageService.getCashFlowEntries({ startDate, endDate });
      const incomeEntries = entries.filter((e: CashFlowEntry) => e.type === 'income');
      const expenseEntries = entries.filter((e: CashFlowEntry) => e.type === 'expense');
      let totalIncome = 0;
      let totalExpense = 0;

      const incomeRows = incomeEntries.map((e, i) => {
        const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : (e.amount || 0);
        totalIncome += isNaN(amt) ? 0 : amt;
        return `<tr><td class="text-right">${i + 1}</td><td>${new Date(e.entry_date).toLocaleDateString('en-IN')}</td><td>${e.category}</td><td>${e.description || '-'}</td><td class="text-right">${formatCurrency(amt)}</td></tr>`;
      }).join('');
      const expenseRows = expenseEntries.map((e, i) => {
        const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : (e.amount || 0);
        totalExpense += isNaN(amt) ? 0 : amt;
        return `<tr><td class="text-right">${i + 1}</td><td>${new Date(e.entry_date).toLocaleDateString('en-IN')}</td><td>${e.category}</td><td>${e.description || '-'}</td><td class="text-right">${formatCurrency(amt)}</td></tr>`;
      }).join('');

      const dateLabel = from === to ? `Date: ${from}` : `From ${from} to ${to}`;
      const html = `
        ${headerHtml('Income & Expense Report', dateLabel)}
        <p><strong>Income</strong></p>
        <table>
          <thead><tr><th class="text-right">S.No</th><th>Date</th><th>Category</th><th>Description</th><th class="text-right">Amount</th></tr></thead>
          <tbody>${incomeRows || '<tr><td colspan="5">No income entries</td></tr>'}</tbody>
          <tfoot><tr class="totals-row"><td colspan="4" class="text-right">Total Income</td><td class="text-right">${formatCurrency(totalIncome)}</td></tr></tfoot>
        </table>
        <p><strong>Expense</strong></p>
        <table>
          <thead><tr><th class="text-right">S.No</th><th>Date</th><th>Category</th><th>Description</th><th class="text-right">Amount</th></tr></thead>
          <tbody>${expenseRows || '<tr><td colspan="5">No expense entries</td></tr>'}</tbody>
          <tfoot><tr class="totals-row"><td colspan="4" class="text-right">Total Expense</td><td class="text-right">${formatCurrency(totalExpense)}</td></tr></tfoot>
        </table>
        <div class="doc-footer">
          Total Income: ${formatCurrency(totalIncome)} &nbsp;|&nbsp; Total Expense: ${formatCurrency(totalExpense)} &nbsp;|&nbsp; Net: ${formatCurrency(totalIncome - totalExpense)}
        </div>`;
      openPrintWindow('Income & Expense Report', html);
    } catch (e) {
      console.error(e);
      alert('Failed to load cash flow data.');
    }
    setExportLoading(null);
  };

  const handleExportSaleProfit = () => {
    setExportLoading('sale-profit');
    const dayMap: Record<string, { sales: number; discount: number; expense: number; otherIncome: number; profit: number }> = {};

    getFilteredTransactionsForDates(salesDateFrom, salesDateTo).forEach((tx) => {
      const key = tx.created_at.slice(0, 10);
      if (!dayMap[key]) dayMap[key] = { sales: 0, discount: 0, expense: 0, otherIncome: 0, profit: 0 };
      let subtotal = 0;
      let costSum = 0;
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const price = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          subtotal += (isNaN(price) ? 0 : price) * qty;
          costSum += (isNaN(cost) ? 0 : cost) * qty;
        });
      } catch (_) {}
      const totalAmount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      const discount = Math.max(0, subtotal - (isNaN(totalAmount as number) ? 0 : (totalAmount as number)));
      const profit = subtotal - costSum - discount;
      dayMap[key].sales += subtotal - discount;
      dayMap[key].discount += discount;
      dayMap[key].profit += profit;
    });

    (async () => {
      try {
        const startDate = new Date(salesDateFrom).toISOString();
        const endDate = new Date(salesDateTo + 'T23:59:59').toISOString();
        const entries = await storageService.getCashFlowEntries({ startDate, endDate });
        entries.forEach((e: CashFlowEntry) => {
          const key = e.entry_date.slice(0, 10);
          if (!dayMap[key]) return;
          const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : (e.amount || 0);
          const val = isNaN(amt) ? 0 : amt;
          if (e.type === 'expense') dayMap[key].expense += val;
          else dayMap[key].otherIncome += val;
        });
      } catch (_) {}

      const sortedDays = Object.keys(dayMap).sort();
      const rows = sortedDays.map((day, idx) => {
        const r = dayMap[day];
        const net = r.profit + r.otherIncome - r.expense;
        return `
          <tr>
            <td class="text-right">${idx + 1}</td>
            <td>${day}</td>
            <td class="text-right">${formatCurrency(r.sales)}</td>
            <td class="text-right">${formatCurrency(r.discount)}</td>
            <td class="text-right">${formatCurrency(r.expense)}</td>
            <td class="text-right">${formatCurrency(r.otherIncome)}</td>
            <td class="text-right">${formatCurrency(r.profit)}</td>
            <td class="text-right">${formatCurrency(net)}</td>
          </tr>`;
      }).join('');

      const totalSales = sortedDays.reduce((s, day) => s + dayMap[day].sales, 0);
      const totalDiscount = sortedDays.reduce((s, day) => s + dayMap[day].discount, 0);
      const totalExpense = sortedDays.reduce((s, day) => s + dayMap[day].expense, 0);
      const totalOtherIncome = sortedDays.reduce((s, day) => s + dayMap[day].otherIncome, 0);
      const totalProfit = sortedDays.reduce((s, day) => s + dayMap[day].profit, 0);
      const totalNet = totalProfit + totalOtherIncome - totalExpense;

      const dateLabel = `From ${salesDateFrom} to ${salesDateTo}`;
      const html = `
        ${headerHtml('Sales / Profit Report (Day-wise)', dateLabel)}
        <table>
          <thead>
            <tr>
              <th class="text-right">S.No</th>
              <th>Date</th>
              <th class="text-right">Sales (Subtotal)</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Expense</th>
              <th class="text-right">Other Income</th>
              <th class="text-right">Profit</th>
              <th class="text-right">Net (Profit + Income - Expense)</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8">No data</td></tr>'}</tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2" class="text-right">Total</td>
              <td class="text-right">${formatCurrency(totalSales)}</td>
              <td class="text-right">${formatCurrency(totalDiscount)}</td>
              <td class="text-right">${formatCurrency(totalExpense)}</td>
              <td class="text-right">${formatCurrency(totalOtherIncome)}</td>
              <td class="text-right">${formatCurrency(totalProfit)}</td>
              <td class="text-right">${formatCurrency(totalNet)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="doc-footer">
          Total Sales: ${formatCurrency(totalSales)} &nbsp;|&nbsp; Total Discount: ${formatCurrency(totalDiscount)} &nbsp;|&nbsp; Total Expense: ${formatCurrency(totalExpense)} &nbsp;|&nbsp; Total Other Income: ${formatCurrency(totalOtherIncome)} &nbsp;|&nbsp; Total Profit: ${formatCurrency(totalProfit)} &nbsp;|&nbsp; Net: ${formatCurrency(totalNet)}
        </div>`;
      openPrintWindow('Sales / Profit Report', html);
      setExportLoading(null);
    })();
  };

  const handleExportCategorySales = () => {
    setExportLoading('category-sales');
    const filtered = getFilteredTransactionsForDates(categoryDateFrom, categoryDateTo);
    const categoryMap = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
    const getCategoryName = (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';

    filtered.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const categoryId = item.category_id || '';
          const catName = getCategoryName(categoryId);
          const price = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          const revenue = (isNaN(price) ? 0 : price) * qty;
          const costSum = (isNaN(cost) ? 0 : cost) * qty;
          if (!categoryMap.has(catName)) {
            categoryMap.set(catName, { name: catName, qty: 0, revenue: 0, cost: 0 });
          }
          const r = categoryMap.get(catName)!;
          r.qty += qty;
          r.revenue += revenue;
          r.cost += costSum;
        });
      } catch (_) {}
    });

    const sorted = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);
    let totalQty = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    const rows = sorted.map((r, idx) => {
      totalQty += r.qty;
      totalRevenue += r.revenue;
      totalCost += r.cost;
      const profit = r.revenue - r.cost;
      return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${r.name}</td>
          <td class="text-right">${r.qty}</td>
          <td class="text-right">${formatCurrency(r.revenue)}</td>
          <td class="text-right">${formatCurrency(r.cost)}</td>
          <td class="text-right">${formatCurrency(profit)}</td>
        </tr>`;
    }).join('');

    const dateLabel = `From ${categoryDateFrom} to ${categoryDateTo}`;
    const html = `
      ${headerHtml('Category-wise Sales Report', dateLabel)}
      <table>
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Category</th>
            <th class="text-right">Qty Sold</th>
            <th class="text-right">Revenue</th>
            <th class="text-right">Cost</th>
            <th class="text-right">Profit</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6">No sales in period</td></tr>'}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="2" class="text-right">Total</td>
            <td class="text-right">${totalQty}</td>
            <td class="text-right">${formatCurrency(totalRevenue)}</td>
            <td class="text-right">${formatCurrency(totalCost)}</td>
            <td class="text-right">${formatCurrency(totalRevenue - totalCost)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        Total Qty: ${totalQty} &nbsp;|&nbsp; Total Revenue: ${formatCurrency(totalRevenue)} &nbsp;|&nbsp; Total Profit: ${formatCurrency(totalRevenue - totalCost)}
      </div>`;
    openPrintWindow('Category-wise Sales Report', html);
    setExportLoading(null);
  };

  const handleExportLowStock = () => {
    setExportLoading('low-stock');
    const lowItems = items.filter((i) => i.stock <= lowStockThreshold).sort((a, b) => a.stock - b.stock);
    let totalValue = 0;
    const rows = lowItems.map((item, idx) => {
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
      const c = isNaN(cost) ? 0 : cost;
      totalValue += item.stock * c;
      return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${item.name}</td>
          <td>${item.code}</td>
          <td class="text-right">${item.stock}</td>
          <td class="text-right">${lowStockThreshold}</td>
          <td class="text-right">${formatCurrency(c)}</td>
          <td class="text-right">${formatCurrency(item.stock * c)}</td>
        </tr>`;
    }).join('');

    const html = `
      ${headerHtml('Low Stock / Reorder Report', `Threshold: ${lowStockThreshold} units`)}
      <table>
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Item Name</th>
            <th>Item Code</th>
            <th class="text-right">Current Stock</th>
            <th class="text-right">Reorder At</th>
            <th class="text-right">Unit Cost</th>
            <th class="text-right">Stock Value</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7">No low stock items</td></tr>'}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="6" class="text-right">Total stock value (low items)</td>
            <td class="text-right">${formatCurrency(totalValue)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        ${lowItems.length} item(s) at or below ${lowStockThreshold} units. Total value: ${formatCurrency(totalValue)}
      </div>`;
    openPrintWindow('Low Stock Report', html);
    setExportLoading(null);
  };

  const handleExportItemWiseSales = () => {
    setExportLoading('item-wise');
    const filtered = getFilteredTransactionsForDates(categoryDateFrom, categoryDateTo);
    const getCategoryName = (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';
    const itemMap = new Map<string, { name: string; code: string; category: string; qty: number; revenue: number; cost: number }>();

    filtered.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const price = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          const revenue = (isNaN(price) ? 0 : price) * qty;
          const costSum = (isNaN(cost) ? 0 : cost) * qty;
          const id = item.id;
          if (!itemMap.has(id)) {
            itemMap.set(id, {
              name: item.name,
              code: item.code,
              category: getCategoryName(item.category_id || ''),
              qty: 0,
              revenue: 0,
              cost: 0,
            });
          }
          const r = itemMap.get(id)!;
          r.qty += qty;
          r.revenue += revenue;
          r.cost += costSum;
        });
      } catch (_) {}
    });

    const sorted = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
    let totalQty = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    const rows = sorted.map((r, idx) => {
      totalQty += r.qty;
      totalRevenue += r.revenue;
      totalCost += r.cost;
      return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${r.name}</td>
          <td>${r.code}</td>
          <td>${r.category}</td>
          <td class="text-right">${r.qty}</td>
          <td class="text-right">${formatCurrency(r.revenue)}</td>
          <td class="text-right">${formatCurrency(r.cost)}</td>
          <td class="text-right">${formatCurrency(r.revenue - r.cost)}</td>
        </tr>`;
    }).join('');

    const dateLabel = `From ${categoryDateFrom} to ${categoryDateTo}`;
    const html = `
      ${headerHtml('Item-wise Sales Report', dateLabel)}
      <table>
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Item Name</th>
            <th>Item Code</th>
            <th>Category</th>
            <th class="text-right">Qty Sold</th>
            <th class="text-right">Revenue</th>
            <th class="text-right">Cost</th>
            <th class="text-right">Profit</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8">No sales in period</td></tr>'}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="4" class="text-right">Total</td>
            <td class="text-right">${totalQty}</td>
            <td class="text-right">${formatCurrency(totalRevenue)}</td>
            <td class="text-right">${formatCurrency(totalCost)}</td>
            <td class="text-right">${formatCurrency(totalRevenue - totalCost)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        Total Qty: ${totalQty} &nbsp;|&nbsp; Total Revenue: ${formatCurrency(totalRevenue)} &nbsp;|&nbsp; Total Profit: ${formatCurrency(totalRevenue - totalCost)}
      </div>`;
    openPrintWindow('Item-wise Sales Report', html);
    setExportLoading(null);
  };

  const handleExportPaymentMethod = () => {
    setExportLoading('payment-method');
    const filtered = getFilteredTransactionsForDates(salesDateFrom, salesDateTo);
    const pm: Record<string, { amount: number; count: number }> = { cash: { amount: 0, count: 0 }, card: { amount: 0, count: 0 }, upi: { amount: 0, count: 0 } };
    filtered.forEach((tx) => {
      const method = tx.payment_method || 'cash';
      if (!pm[method]) pm[method] = { amount: 0, count: 0 };
      const amt = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      pm[method].amount += isNaN(amt as number) ? 0 : (amt as number);
      pm[method].count += 1;
    });
    const methods = ['cash', 'card', 'upi'] as const;
    const rows = methods.map((m) => `
      <tr>
        <td>${m.charAt(0).toUpperCase() + m.slice(1)}</td>
        <td class="text-right">${pm[m]?.count ?? 0}</td>
        <td class="text-right">${formatCurrency(pm[m]?.amount ?? 0)}</td>
      </tr>`).join('');
    const totalAmount = methods.reduce((s, m) => s + (pm[m]?.amount ?? 0), 0);
    const totalCount = methods.reduce((s, m) => s + (pm[m]?.count ?? 0), 0);
    const dateLabel = `From ${salesDateFrom} to ${salesDateTo}`;
    const html = `
      ${headerHtml('Payment Method Summary', dateLabel)}
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th class="text-right">No. of Orders</th>
            <th class="text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td>Total</td>
            <td class="text-right">${totalCount}</td>
            <td class="text-right">${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        Total Orders: ${totalCount} &nbsp;|&nbsp; Total Amount: ${formatCurrency(totalAmount)}
      </div>`;
    openPrintWindow('Payment Method Summary', html);
    setExportLoading(null);
  };

  const handleExportTopBottom = () => {
    setExportLoading('top-bottom');
    const filtered = getFilteredTransactionsForDates(salesDateFrom, salesDateTo);
    const itemMap = new Map<string, { name: string; code: string; qty: number; revenue: number; cost: number }>();
    filtered.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const price = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          const id = item.id;
          if (!itemMap.has(id)) {
            itemMap.set(id, { name: item.name, code: item.code, qty: 0, revenue: 0, cost: 0 });
          }
          const r = itemMap.get(id)!;
          r.qty += qty;
          r.revenue += (isNaN(price) ? 0 : price) * qty;
          r.cost += (isNaN(cost) ? 0 : cost) * qty;
        });
      } catch (_) {}
    });
    const sorted = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
    const n = Math.max(1, Math.min(50, topBottomLimit));
    const top = sorted.slice(0, n);
    const bottom = sorted.slice(-n).reverse();
    const topRows = top.map((r, idx) => `
      <tr>
        <td class="text-right">${idx + 1}</td>
        <td>${r.name}</td>
        <td>${r.code}</td>
        <td class="text-right">${r.qty}</td>
        <td class="text-right">${formatCurrency(r.revenue)}</td>
        <td class="text-right">${formatCurrency(r.revenue - r.cost)}</td>
      </tr>`).join('');
    const bottomRows = bottom.map((r, idx) => `
      <tr>
        <td class="text-right">${idx + 1}</td>
        <td>${r.name}</td>
        <td>${r.code}</td>
        <td class="text-right">${r.qty}</td>
        <td class="text-right">${formatCurrency(r.revenue)}</td>
        <td class="text-right">${formatCurrency(r.revenue - r.cost)}</td>
      </tr>`).join('');
    const dateLabel = `From ${salesDateFrom} to ${salesDateTo}`;
    const html = `
      ${headerHtml('Top / Bottom Selling Items', dateLabel)}
      <p><strong>Top ${n} by revenue</strong></p>
      <table>
        <thead>
          <tr>
            <th class="text-right">Rank</th>
            <th>Item Name</th>
            <th>Code</th>
            <th class="text-right">Qty Sold</th>
            <th class="text-right">Revenue</th>
            <th class="text-right">Profit</th>
          </tr>
        </thead>
        <tbody>${topRows || '<tr><td colspan="6">No data</td></tr>'}</tbody>
      </table>
      <p><strong>Bottom ${n} by revenue</strong></p>
      <table>
        <thead>
          <tr>
            <th class="text-right">Rank</th>
            <th>Item Name</th>
            <th>Code</th>
            <th class="text-right">Qty Sold</th>
            <th class="text-right">Revenue</th>
            <th class="text-right">Profit</th>
          </tr>
        </thead>
        <tbody>${bottomRows || '<tr><td colspan="6">No data</td></tr>'}</tbody>
      </table>`;
    openPrintWindow('Top / Bottom Selling Items', html);
    setExportLoading(null);
  };

  const handleExportEndOfDay = async () => {
    setExportLoading('eod');
    const filtered = getFilteredTransactionsForDates(eodDate, eodDate);
    let salesTotal = 0;
    let discountTotal = 0;
    let profitTotal = 0;
    filtered.forEach((tx) => {
      const amt = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      salesTotal += isNaN(amt as number) ? 0 : (amt as number);
      let subtotal = 0;
      let costSum = 0;
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const price = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          subtotal += (isNaN(price) ? 0 : price) * qty;
          costSum += (isNaN(cost) ? 0 : cost) * qty;
        });
      } catch (_) {}
      const totalAmount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      discountTotal += Math.max(0, subtotal - (isNaN(totalAmount as number) ? 0 : (totalAmount as number)));
      profitTotal += subtotal - costSum - Math.max(0, subtotal - (isNaN(totalAmount as number) ? 0 : (totalAmount as number)));
    });
    let expenseTotal = 0;
    let otherIncomeTotal = 0;
    try {
      const start = new Date(eodDate).toISOString();
      const end = new Date(eodDate + 'T23:59:59').toISOString();
      const entries = await storageService.getCashFlowEntries({ startDate: start, endDate: end });
      entries.forEach((e: CashFlowEntry) => {
        const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : (e.amount || 0);
        const val = isNaN(amt) ? 0 : amt;
        if (e.type === 'expense') expenseTotal += val;
        else otherIncomeTotal += val;
      });
    } catch (_) {}
    const net = profitTotal + otherIncomeTotal - expenseTotal;
    const html = `
      ${headerHtml('End of Day Summary', `Date: ${eodDate}`)}
      <table>
        <thead><tr><th>Summary</th><th class="text-right">Amount</th></tr></thead>
        <tbody>
          <tr><td>No. of Orders</td><td class="text-right">${filtered.length}</td></tr>
          <tr><td>Sales (Total)</td><td class="text-right">${formatCurrency(salesTotal)}</td></tr>
          <tr><td>Total Discount</td><td class="text-right">${formatCurrency(discountTotal)}</td></tr>
          <tr><td>Profit (Sales)</td><td class="text-right">${formatCurrency(profitTotal)}</td></tr>
          <tr><td>Other Income</td><td class="text-right">${formatCurrency(otherIncomeTotal)}</td></tr>
          <tr><td>Expenses</td><td class="text-right">${formatCurrency(expenseTotal)}</td></tr>
          <tr class="totals-row"><td>Net (Profit + Other Income - Expenses)</td><td class="text-right">${formatCurrency(net)}</td></tr>
        </tbody>
      </table>
      <div class="doc-footer">
        Day: ${eodDate} &nbsp;|&nbsp; Orders: ${filtered.length} &nbsp;|&nbsp; Sales: ${formatCurrency(salesTotal)} &nbsp;|&nbsp; Net: ${formatCurrency(net)}
      </div>`;
    openPrintWindow('End of Day Summary', html);
    setExportLoading(null);
  };

  const handleExportPL = async () => {
    setExportLoading('pl');
    const filtered = getFilteredTransactionsForDates(salesDateFrom, salesDateTo);
    let salesRevenue = 0;
    let cogs = 0;
    filtered.forEach((tx) => {
      const amt = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      salesRevenue += isNaN(amt as number) ? 0 : (amt as number);
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const qty = cartItem.quantity || 1;
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          cogs += (isNaN(cost) ? 0 : cost) * qty;
        });
      } catch (_) {}
    });
    let expenses = 0;
    let otherIncome = 0;
    try {
      const start = new Date(salesDateFrom).toISOString();
      const end = new Date(salesDateTo + 'T23:59:59').toISOString();
      const entries = await storageService.getCashFlowEntries({ startDate: start, endDate: end });
      entries.forEach((e: CashFlowEntry) => {
        const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : (e.amount || 0);
        const val = isNaN(amt) ? 0 : amt;
        if (e.type === 'expense') expenses += val;
        else otherIncome += val;
      });
    } catch (_) {}
    const grossProfit = salesRevenue - cogs;
    const netProfit = grossProfit + otherIncome - expenses;
    const dateLabel = `From ${salesDateFrom} to ${salesDateTo}`;
    const html = `
      ${headerHtml('Profit & Loss Statement', dateLabel)}
      <table>
        <thead><tr><th>Particulars</th><th class="text-right">Amount</th></tr></thead>
        <tbody>
          <tr><td>Sales (Revenue)</td><td class="text-right">${formatCurrency(salesRevenue)}</td></tr>
          <tr><td>Cost of Goods Sold (COGS)</td><td class="text-right">${formatCurrency(cogs)}</td></tr>
          <tr class="totals-row"><td>Gross Profit</td><td class="text-right">${formatCurrency(grossProfit)}</td></tr>
          <tr><td>Other Income</td><td class="text-right">${formatCurrency(otherIncome)}</td></tr>
          <tr><td>Expenses</td><td class="text-right">${formatCurrency(expenses)}</td></tr>
          <tr class="totals-row"><td>Net Profit / (Loss)</td><td class="text-right">${formatCurrency(netProfit)}</td></tr>
        </tbody>
      </table>
      <div class="doc-footer">
        Period: ${dateLabel} &nbsp;|&nbsp; Net: ${formatCurrency(netProfit)}
      </div>`;
    openPrintWindow('Profit & Loss Statement', html);
    setExportLoading(null);
  };

  const handleExportCustomerWise = () => {
    setExportLoading('customer-wise');
    const filtered = getFilteredTransactionsForDates(salesDateFrom, salesDateTo);
    const customerMap = new Map<string, { name: string; orders: number; revenue: number }>();
    const getName = (id: string | undefined) => {
      if (!id) return 'Walk-in';
      const c = salesCustomers.find((x) => x.id === id);
      return c ? c.name : `Customer (${id.slice(0, 8)})`;
    };
    filtered.forEach((tx) => {
      const custId = tx.sales_customer_id ?? '';
      const name = getName(tx.sales_customer_id);
      if (!customerMap.has(custId)) customerMap.set(custId, { name, orders: 0, revenue: 0 });
      const r = customerMap.get(custId)!;
      r.orders += 1;
      const amt = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      r.revenue += isNaN(amt as number) ? 0 : (amt as number);
    });
    const sorted = Array.from(customerMap.values()).sort((a, b) => b.revenue - a.revenue);
    let totalOrders = 0;
    let totalRevenue = 0;
    const rows = sorted.map((r, idx) => {
      totalOrders += r.orders;
      totalRevenue += r.revenue;
      return `
        <tr>
          <td class="text-right">${idx + 1}</td>
          <td>${r.name}</td>
          <td class="text-right">${r.orders}</td>
          <td class="text-right">${formatCurrency(r.revenue)}</td>
        </tr>`;
    }).join('');
    const dateLabel = `From ${salesDateFrom} to ${salesDateTo}`;
    const html = `
      ${headerHtml('Customer-wise Sales Report', dateLabel)}
      <table>
        <thead>
          <tr>
            <th class="text-right">S.No</th>
            <th>Customer</th>
            <th class="text-right">Orders</th>
            <th class="text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4">No data</td></tr>'}</tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="2" class="text-right">Total</td>
            <td class="text-right">${totalOrders}</td>
            <td class="text-right">${formatCurrency(totalRevenue)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        Total Orders: ${totalOrders} &nbsp;|&nbsp; Total Revenue: ${formatCurrency(totalRevenue)}
      </div>`;
    openPrintWindow('Customer-wise Sales Report', html);
    setExportLoading(null);
  };

  const handleExportDb = async () => {
    setExportLoading('export-db');
    try {
      await storageService.exportDb();
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'Export DB failed.');
    }
    setExportLoading(null);
  };

  if (loading) {
    return (
      <div className="export-page">
        <div className="export-loading">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="export-page">
      <div className="export-header">
        <h1>Export</h1>
        <p className="export-subtitle">Generate and print professional reports. Use date filters and open the print dialog to save as PDF.</p>
      </div>

      <div className="export-cards">
        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">📦</span>
            <h2>1. Inventory Details</h2>
          </div>
          <p className="export-card-desc">Item list with current stock, sold qty (all-time or by date range), cost, and price. Footer with totals.</p>
          <div className="export-filters">
            <div className="export-radio-group">
              <label><input type="radio" checked={invDateMode === 'single'} onChange={() => setInvDateMode('single')} /> As on date</label>
              <label><input type="radio" checked={invDateMode === 'range'} onChange={() => setInvDateMode('range')} /> Sold qty by date range</label>
            </div>
            {invDateMode === 'single' ? (
              <input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
            ) : (
              <>
                <label>From</label>
                <input type="date" value={invDateFrom} onChange={(e) => setInvDateFrom(e.target.value)} />
                <label>To</label>
                <input type="date" value={invDateTo} onChange={(e) => setInvDateTo(e.target.value)} />
              </>
            )}
            <div className="export-radio-group" style={{ marginTop: '8px' }}>
              <label><input type="radio" checked={!invHideCostPrice} onChange={() => setInvHideCostPrice(false)} /> Show cost & price</label>
              <label><input type="radio" checked={invHideCostPrice} onChange={() => setInvHideCostPrice(true)} /> Hide cost & price</label>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportInventory}
            disabled={!!exportLoading}
          >
            {exportLoading === 'inventory' ? 'Generating...' : 'Export Inventory'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">🔢</span>
            <h2>2. Item Name & Mapping Code</h2>
          </div>
          <p className="export-card-desc">Item list with mapping code and item name, sorted by mapping code (ascending). Use for quick reference or integration.</p>
          <button
            className="btn btn-primary"
            onClick={handleExportItemNameMappingCode}
            disabled={!!exportLoading}
          >
            {exportLoading === 'item-name-mapping' ? 'Generating...' : 'Export Item Name & Mapping Code'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">📋</span>
            <h2>3. Daily Sales Report</h2>
          </div>
          <p className="export-card-desc">Orders with Order ID, discount, subtotal, profit. Single date or date range.</p>
          <div className="export-filters">
            <div className="export-radio-group">
              <label><input type="radio" checked={salesDateMode === 'single'} onChange={() => setSalesDateMode('single')} /> Single date</label>
              <label><input type="radio" checked={salesDateMode === 'range'} onChange={() => setSalesDateMode('range')} /> Date range</label>
            </div>
            {salesDateMode === 'single' ? (
              <input type="date" value={salesSingleDate} onChange={(e) => setSalesSingleDate(e.target.value)} />
            ) : (
              <>
                <label>From</label>
                <input type="date" value={salesDateFrom} onChange={(e) => setSalesDateFrom(e.target.value)} />
                <label>To</label>
                <input type="date" value={salesDateTo} onChange={(e) => setSalesDateTo(e.target.value)} />
              </>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportDailySales}
            disabled={!!exportLoading}
          >
            {exportLoading === 'sales' ? 'Generating...' : 'Export Daily Sales'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">💰</span>
            <h2>4. Income & Expense Report</h2>
          </div>
          <p className="export-card-desc">Cash flow entries by date. Single date or between dates.</p>
          <div className="export-filters">
            <div className="export-radio-group">
              <label><input type="radio" checked={ieDateMode === 'single'} onChange={() => setIeDateMode('single')} /> Single date</label>
              <label><input type="radio" checked={ieDateMode === 'range'} onChange={() => setIeDateMode('range')} /> Date range</label>
            </div>
            {ieDateMode === 'single' ? (
              <input type="date" value={ieDateFrom} onChange={(e) => setIeDateFrom(e.target.value)} />
            ) : (
              <>
                <label>From</label>
                <input type="date" value={ieDateFrom} onChange={(e) => setIeDateFrom(e.target.value)} />
                <label>To</label>
                <input type="date" value={ieDateTo} onChange={(e) => setIeDateTo(e.target.value)} />
              </>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportIncomeExpense}
            disabled={!!exportLoading}
          >
            {exportLoading === 'income-expense' ? 'Generating...' : 'Export Income & Expense'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">📊</span>
            <h2>5. Sales / Profit Report</h2>
          </div>
          <p className="export-card-desc">Day-wise sales subtotal, discount, expense, other income, profit/loss.</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={salesDateFrom} onChange={(e) => setSalesDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={salesDateTo} onChange={(e) => setSalesDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportSaleProfit}
            disabled={!!exportLoading}
          >
            {exportLoading === 'sale-profit' ? 'Generating...' : 'Export Sale / Profit'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">📁</span>
            <h2>6. Category-wise Sales</h2>
          </div>
          <p className="export-card-desc">Sales aggregated by category for a date range: qty sold, revenue, cost, profit.</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={categoryDateFrom} onChange={(e) => setCategoryDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={categoryDateTo} onChange={(e) => setCategoryDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportCategorySales}
            disabled={!!exportLoading}
          >
            {exportLoading === 'category-sales' ? 'Generating...' : 'Export Category Sales'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">⚠️</span>
            <h2>7. Low Stock / Reorder Report</h2>
          </div>
          <p className="export-card-desc">Items at or below threshold for reorder planning. Set threshold and export.</p>
          <div className="export-filters">
            <label>Stock ≤</label>
            <input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{ width: 72 }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportLowStock}
            disabled={!!exportLoading}
          >
            {exportLoading === 'low-stock' ? 'Generating...' : 'Export Low Stock'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">📄</span>
            <h2>8. Item-wise Sales</h2>
          </div>
          <p className="export-card-desc">Which items sold how many, revenue and profit in a period. Includes category.</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={categoryDateFrom} onChange={(e) => setCategoryDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={categoryDateTo} onChange={(e) => setCategoryDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportItemWiseSales}
            disabled={!!exportLoading}
          >
            {exportLoading === 'item-wise' ? 'Generating...' : 'Export Item-wise Sales'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">💳</span>
            <h2>9. Payment Method Summary</h2>
          </div>
          <p className="export-card-desc">Cash vs Card vs UPI: order count and total amount for a date range.</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={salesDateFrom} onChange={(e) => setSalesDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={salesDateTo} onChange={(e) => setSalesDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportPaymentMethod}
            disabled={!!exportLoading}
          >
            {exportLoading === 'payment-method' ? 'Generating...' : 'Export Payment Summary'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">🏆</span>
            <h2>10. Top / Bottom Selling Items</h2>
          </div>
          <p className="export-card-desc">Best and worst performers by revenue. Set how many to show (e.g. 10).</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={salesDateFrom} onChange={(e) => setSalesDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={salesDateTo} onChange={(e) => setSalesDateTo(e.target.value)} />
            <label>Top/Bottom</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topBottomLimit}
              onChange={(e) => setTopBottomLimit(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 10)))}
              style={{ width: 56 }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportTopBottom}
            disabled={!!exportLoading}
          >
            {exportLoading === 'top-bottom' ? 'Generating...' : 'Export Top / Bottom'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">🌙</span>
            <h2>11. End of Day Summary</h2>
          </div>
          <p className="export-card-desc">Single-day closing: orders, sales, discount, profit, expenses, other income, net.</p>
          <div className="export-filters">
            <label>Date</label>
            <input type="date" value={eodDate} onChange={(e) => setEodDate(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportEndOfDay}
            disabled={!!exportLoading}
          >
            {exportLoading === 'eod' ? 'Generating...' : 'Export End of Day'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">📈</span>
            <h2>12. Profit & Loss Statement</h2>
          </div>
          <p className="export-card-desc">Sales, COGS, gross profit, other income, expenses, net profit/loss for a period.</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={salesDateFrom} onChange={(e) => setSalesDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={salesDateTo} onChange={(e) => setSalesDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportPL}
            disabled={!!exportLoading}
          >
            {exportLoading === 'pl' ? 'Generating...' : 'Export P&L Statement'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <span className="export-card-icon">👥</span>
            <h2>13. Customer-wise Sales</h2>
          </div>
          <p className="export-card-desc">Sales by customer (sales customers). Walk-in for orders without a customer.</p>
          <div className="export-filters">
            <label>From</label>
            <input type="date" value={salesDateFrom} onChange={(e) => setSalesDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={salesDateTo} onChange={(e) => setSalesDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportCustomerWise}
            disabled={!!exportLoading}
          >
            {exportLoading === 'customer-wise' ? 'Generating...' : 'Export Customer-wise'}
          </button>
        </div>

        {isAdmin && (
          <div className="export-card export-card-db">
            <div className="export-card-header">
              <span className="export-card-icon">🗄️</span>
              <h2>Export Database</h2>
            </div>
            <p className="export-card-desc">Download full database as a compressed (.json.gz) backup. Saved on server under db-exports/YYYY-MM-DD/ for manual cleanup.</p>
            <button
              className="btn btn-primary"
              onClick={handleExportDb}
              disabled={!!exportLoading}
            >
              {exportLoading === 'export-db' ? 'Exporting...' : 'Export DB'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
