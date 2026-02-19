import { useRef } from 'react';

const InvoiceModal = ({ booking, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Invoice ${booking.orderId}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
            .brand { font-size: 28px; font-weight: 700; color: #f59e0b; }
            .invoice-title { font-size: 22px; font-weight: 600; text-align: right; }
            .meta { margin-bottom: 24px; }
            .meta p { margin: 2px 0; font-size: 14px; color: #475569; }
            .meta strong { color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .totals { text-align: right; }
            .totals p { margin: 4px 0; font-size: 14px; }
            .totals .grand { font-size: 18px; font-weight: 700; color: #f59e0b; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const rentalDays = Math.max(
    1,
    Math.ceil((new Date(booking.returnDate) - new Date(booking.eventDate)) / (1000 * 60 * 60 * 24))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Invoice</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Print / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable area */}
        <div ref={printRef} className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-2xl font-bold text-amber-500">Occasia</p>
              <p className="text-xs text-slate-400">Event Rental Services</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-slate-900">INVOICE</p>
              <p className="text-sm text-slate-500">#{booking.orderId}</p>
              <p className="text-xs text-slate-400">{new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer & Event Info */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Bill To</p>
              <p className="font-medium text-slate-900">{booking.customerName}</p>
              <p className="text-slate-600">{booking.customerEmail}</p>
              <p className="text-slate-600">{booking.customerPhone}</p>
              {booking.address && <p className="text-slate-600">{booking.address}</p>}
            </div>
            <div className="text-right">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Event Details</p>
              <p className="text-slate-600">Event: {new Date(booking.eventDate).toLocaleDateString()}</p>
              <p className="text-slate-600">Return: {new Date(booking.returnDate).toLocaleDateString()}</p>
              <p className="text-slate-600">Duration: {rentalDays} day{rentalDays > 1 ? 's' : ''}</p>
              <p className="text-slate-600 capitalize">Delivery: {booking.deliveryPreference}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="mb-6 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="py-2 px-3 text-left text-xs font-semibold uppercase text-slate-500">Item</th>
                <th className="py-2 px-3 text-right text-xs font-semibold uppercase text-slate-500">Unit Price</th>
                <th className="py-2 px-3 text-right text-xs font-semibold uppercase text-slate-500">Qty</th>
                <th className="py-2 px-3 text-right text-xs font-semibold uppercase text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {booking.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-800">{item.name}</td>
                  <td className="py-2 px-3 text-right text-slate-600">Rs. {item.unitPrice?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-800">Rs. {(item.unitPrice * item.quantity)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800">Rs. {booking.subtotal?.toLocaleString()}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {booking.promoCode && `(${booking.promoCode})`}</span>
                  <span>−Rs. {booking.discountAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-amber-600">
                <span>Total</span>
                <span>Rs. {booking.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Payment</span>
                <span className="capitalize">{booking.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            <p>Thank you for choosing Occasia! We hope your event is a success.</p>
            <p className="mt-1">For questions, contact support@occasia.lk</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
