# Return & Refund – Expected Business Flow

This document describes how returns and refunds work in the app and what you should see at each step.

---

## 1. Expected flow (business terms)

1. **Sale**  
   Customer buys items → a **sale transaction** is created (type `sale`), amount positive, stock reduced.

2. **Return request**  
   User opens **Sales** → **Order Details** for that sale → clicks **Return** → in the **Return modal** chooses type (Full / Partial / Exchange / Refund), reason, and for Partial selects which items to return → **Submit**.  
   A **return request** is created (table `returns`), status **pending**. No money or stock changes yet.

3. **Approve (admin)**  
   Admin opens **Returns** → finds the pending request → clicks **Approve**.  
   Status becomes **approved**. Still no money or stock changes.

4. **Process (admin)**  
   Admin clicks **Process** on the approved return.  
   - **Stock:** Returned items are restocked (stock increased, purchase_qty decreased).  
   - **Refund:** A **return transaction** is created (type `return`), with **negative** total amount (the refund).  
   - **Return record:** Status → **processed**, and **refund amount** is saved on the return record so the Returns page can show it.

5. **What you should see**
   - **Returns page:** The processed row shows the **Refund amount** in the “Refund Amount” column (and the list refreshes after Process).  
   - **Sales page:** The **return transaction** appears in the list like any other transaction: **Type = Return**, **Amount** negative (in red), and it’s included in Total Sales / Net Profit (so refunds reduce sales and profit).

---

## 2. Where refund amount comes from

- **Full return:** Refund = original sale’s total amount.  
- **Partial return:** Refund = sum of (price × quantity) for the returned line items only.  
- **Exchange / Refund type:** Refund = whatever was sent when creating the return (or computed the same way as above if we have items).

After Process, this value is stored on the **return record** (`refund_amount`) and returned in the Process API response so the Returns page can show it immediately and after refresh.

---

## 3. Where return orders appear (Sales page)

- **Return transactions** are normal rows in the **transactions** table with `transaction_type = 'return'` and **negative** `total_amount`.
- The **Sales Orders** page loads transactions from **GET /api/transactions** (with a limit, e.g. 500). That API returns **all** transaction types (sale and return); it does **not** filter out returns.
- So return transactions **do** appear on the Sales page:
  - **Type** column: “Return” (red badge).
  - **Amount** column: negative value (e.g. -320), shown in red.
- If you don’t see them:
  - **Refresh** the Sales page or switch to another page and back so the list refetches.
  - Check the **date filter** (Today / Week / Month etc.): the return’s date must be inside the selected range.
  - Ensure the backend is the one that processed the return (same base URL / environment).

---

## 4. If refund amount still doesn’t show on the Returns page

- After **Process**, the backend saves `refund_amount` on the return record and returns it in the response in snake_case (`refund_amount`).
- The Returns page:
  - Updates the list in memory with the Process response so the refund amount can show **immediately**.
  - Then calls **loadReturns()** to refetch the list from the server.
- If it still shows “-”:
  - Confirm the Process API returned **200** and a body with `return.refund_amount`.
  - Confirm **GET /api/returns** (after Process) returns that return with `refund_amount` set.
  - Check the browser network tab for **POST .../returns/:id/process** and **GET .../returns** to see the actual payloads.

---

## 5. If return orders still don’t show on the Sales page

- Confirm **GET /api/transactions** is used with a sufficient **limit** (e.g. 500) and no filter by `transaction_type`.
- Confirm the return transaction exists in the DB (e.g. in `transactions` table, `transaction_type = 'return'`, negative `total_amount`).
- Check the **date filter** on Sales: e.g. “Today” uses the browser’s local date; if the server is in another timezone, the return might fall on another day.
- Try **“All Time”** to see if the return appears there.

---

## 6. Quick checklist

| Step | Where | What you should see |
|------|--------|----------------------|
| Create return request | Order Details → Return modal → Submit | Returns page: new row, status Pending, Refund amount often “-” until processed |
| Approve | Returns → Approve | Status → Approved |
| Process | Returns → Process | Status → Processed; **Refund amount** shows the value; success message |
| After process | Returns page | Same row shows refund amount (from response + refetch) |
| After process | Sales page | New row: Type = Return, Amount = negative; refresh/focus may be needed to refetch |

This is the expected business flow; the code is intended to match it. If something still doesn’t match, the checklist and “what you should see” sections above can be used to narrow down whether the issue is in the API, the DB, or the UI (e.g. refetch or date filter).
