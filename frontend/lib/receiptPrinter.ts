import { RestaurantOrder } from "./api";

function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateReceiptHtml(order: RestaurantOrder): string {
  const currency = order.payment_currency || "USD";
  const rate = order.payment_exchange_rate || 83;
  const inrAmount =
    order.paid_amount ??
    (order.payment_amount_paise
      ? order.payment_amount_paise / 100
      : Math.round(order.total_amount * rate * 100) / 100);

  const formattedDate = new Date(order.paid_at || order.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const items = order.items || [];
  const itemsHtml = items.length > 0
    ? items
        .map((item) => {
          const lineTotal = (item.price * item.quantity).toFixed(2);
          return `
            <tr>
              <td class="col-item">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-desc">${item.quantity} &times; $${item.price.toFixed(2)}</span>
              </td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-price">$${item.price.toFixed(2)}</td>
              <td class="col-total">$${lineTotal}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="4" class="no-items">No items listed</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt - ${escapeHtml(order.order_id)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-bar {
      max-width: 380px;
      margin: 0 auto 12px;
      display: flex;
      gap: 8px;
    }
    .btn-action {
      flex: 1;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s ease;
    }
    .btn-print {
      background: #047857;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #065f46;
    }
    .btn-close {
      background: #e2e8f0;
      color: #334155;
      flex: 0 0 80px;
    }
    .btn-close:hover {
      background: #cbd5e1;
    }

    .receipt-container {
      width: 100%;
      max-width: 380px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 22px 18px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
    }

    .header {
      text-align: center;
      padding-bottom: 14px;
      border-bottom: 2px dashed #cbd5e1;
    }
    .restaurant-title {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .restaurant-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .restaurant-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
      line-height: 1.4;
    }
    .receipt-badge {
      display: inline-block;
      margin-top: 8px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .meta-section {
      padding: 12px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      line-height: 1.4;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
      max-width: 60%;
      word-break: break-all;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
    }
    .items-table th {
      text-align: left;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 4px;
    }
    .items-table td {
      padding: 7px 4px;
      border-bottom: 1px dotted #f1f5f9;
      vertical-align: top;
    }
    .col-item {
      text-align: left;
    }
    .item-name {
      display: block;
      font-weight: 700;
      color: #1e293b;
    }
    .item-desc {
      display: block;
      font-size: 10px;
      color: #64748b;
    }
    .col-qty {
      text-align: center;
      font-weight: 600;
      color: #475569;
      width: 32px;
    }
    .col-price {
      text-align: right;
      font-weight: 500;
      color: #64748b;
      width: 55px;
    }
    .col-total {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
      width: 65px;
    }
    .no-items {
      text-align: center;
      color: #94a3b8;
      padding: 12px;
    }

    .summary-section {
      padding: 12px 0;
      border-top: 1px dashed #cbd5e1;
      border-bottom: 2px dashed #cbd5e1;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-size: 12px;
    }
    .summary-row.total-row {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
    }
    .summary-row.inr-row {
      font-size: 14px;
      font-weight: 800;
      color: #047857;
      margin-top: 4px;
    }

    .stamp-wrap {
      margin-top: 16px;
      text-align: center;
    }
    .paid-stamp {
      display: inline-block;
      padding: 6px 18px;
      border: 2px solid #059669;
      border-radius: 8px;
      color: #059669;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: 2px;
      text-transform: uppercase;
      transform: rotate(-1.5deg);
    }

    .barcode-wrap {
      margin-top: 16px;
      text-align: center;
      padding-top: 12px;
      border-top: 1px dotted #cbd5e1;
    }
    .barcode {
      font-family: monospace;
      font-size: 20px;
      letter-spacing: 4px;
      color: #334155;
    }
    .barcode-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
    }

    .footer {
      text-align: center;
      margin-top: 14px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-bar {
        display: none !important;
      }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 4px;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn-action btn-print" onclick="window.print()">
      🖨️ Print Receipt / Save as PDF
    </button>
    <button class="btn-action btn-close" onclick="window.close()">
      Close
    </button>
  </div>

  <main class="receipt-container">
    <header class="header">
      <h1 class="restaurant-title">GourmetOS Haven</h1>
      <p class="restaurant-subtitle">Fine Dining &amp; Bistro</p>
      <div class="restaurant-meta">
        <div>108 Culinary Avenue, Food District</div>
        <div>GSTIN: 27AABCG1234F1Z8 &bull; FSSAI: 11523000000000</div>
        <div>Tel: +91 98765 43210 &bull; hello@gourmethaven.com</div>
      </div>
      <div class="receipt-badge">Official Payment Receipt</div>
    </header>

    <section class="meta-section">
      <div class="meta-row">
        <span class="meta-label">Order Number</span>
        <span class="meta-value">${escapeHtml(order.order_id)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Dining Table</span>
        <span class="meta-value">Table #${escapeHtml(String(order.table_number))}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Date &amp; Time</span>
        <span class="meta-value">${escapeHtml(formattedDate)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Customer Name</span>
        <span class="meta-value">${escapeHtml(order.customer_name || "Guest")}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Payment Method</span>
        <span class="meta-value">${escapeHtml(order.payment_method || "Online")}</span>
      </div>
      ${
        order.razorpay_payment_id
          ? `<div class="meta-row">
              <span class="meta-label">Transaction ID</span>
              <span class="meta-value">${escapeHtml(order.razorpay_payment_id)}</span>
            </div>`
          : ""
      }
      ${
        order.order_token
          ? `<div class="meta-row">
              <span class="meta-label">Order Token</span>
              <span class="meta-value">#${escapeHtml(order.order_token)}</span>
            </div>`
          : ""
      }
    </section>

    <table class="items-table">
      <thead>
        <tr>
          <th class="col-item">Item</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Price</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <section class="summary-section">
      <div class="summary-row">
        <span class="meta-label">Subtotal</span>
        <span class="meta-value">$${order.total_amount.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span class="meta-label">Taxes &amp; Service</span>
        <span class="meta-value">Included</span>
      </div>
      <div class="summary-row total-row">
        <span>Total Amount</span>
        <span>$${order.total_amount.toFixed(2)}</span>
      </div>
      ${
        order.payment_method === "Online" || order.payment_currency === "INR" || order.paid_amount
          ? `<div class="summary-row inr-row">
              <span>Paid in INR</span>
              <span>&#8377;${inrAmount.toFixed(2)} INR</span>
            </div>`
          : ""
      }
    </section>

    <div class="stamp-wrap">
      <div class="paid-stamp">&#10003; PAID IN FULL</div>
    </div>

    <div class="barcode-wrap">
      <div class="barcode">||| | ||||| || |||| |||</div>
      <div class="barcode-label">${escapeHtml(order.order_id)}</div>
    </div>

    <footer class="footer">
      <p>Thank you for dining with GourmetOS Haven!</p>
      <p style="margin-top: 2px;">We look forward to serving you again soon.</p>
    </footer>
  </main>

  <script>
    window.addEventListener("load", function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error("Print error:", e);
        }
      }, 250);
    });
  </script>
</body>
</html>`;
}

/**
 * Robust print function:
 * 1. Tries window.open first so the customer has a dedicated, professional receipt window.
 * 2. If popups are blocked by browser, creates a clean hidden iframe and prints directly,
 *    ensuring the receipt never fails or renders blank.
 */
export function printProfessionalReceipt(order: RestaurantOrder): void {
  if (typeof window === "undefined") return;

  const receiptHtml = generateReceiptHtml(order);

  try {
    const printWindow = window.open("", "_blank", "width=440,height=760");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      return;
    }
  } catch (err) {
    console.warn("Popup blocked or failed, falling back to invisible iframe printing:", err);
  }

  // Fallback: Invisible iframe printing
  try {
    const iframeId = "gourmetos-receipt-print-frame";
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe?.contentWindow?.print();
        setTimeout(() => iframe?.remove(), 2000);
      }, 300);
    }
  } catch (fallbackErr) {
    console.error("Failed to print receipt via iframe fallback:", fallbackErr);
    alert("Please allow pop-ups or check print permissions to view the receipt.");
  }
}
