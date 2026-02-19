import { useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const statusColor = {
  confirmed: '#22c55e',
  cancelled: '#ef4444',
  returned: '#94a3b8'
};

const BookingCalendar = ({ bookings }) => {
  const events = useMemo(() => {
    return bookings.map((b) => ({
      from: new Date(b.eventDate),
      to: new Date(b.returnDate),
      status: b.bookingStatus,
      orderId: b.orderId,
      items: b.items.map((i) => i.name).join(', ')
    }));
  }, [bookings]);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const match = events.find((e) => d >= new Date(e.from.toDateString()) && d <= new Date(e.to.toDateString()));
    if (!match) return null;
    if (match.status === 'confirmed') return 'calendar-confirmed';
    if (match.status === 'cancelled') return 'calendar-cancelled';
    return 'calendar-returned';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const matches = events.filter((e) => d >= new Date(e.from.toDateString()) && d <= new Date(e.to.toDateString()));
    if (matches.length === 0) return null;
    return (
      <div className="mt-0.5 flex justify-center gap-0.5">
        {matches.slice(0, 3).map((m, i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor[m.status] || '#94a3b8' }}
            title={`${m.orderId}: ${m.items}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Calendar tileClassName={tileClassName} tileContent={tileContent} />
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-slate-400" />
          <span>Returned</span>
        </div>
      </div>

      {/* Upcoming list below calendar */}
      <div className="space-y-2">
        {events
          .filter((e) => e.status === 'confirmed' && e.from >= new Date())
          .sort((a, b) => a.from - b.from)
          .slice(0, 5)
          .map((ev, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {ev.from.getDate()}
                <br />
                {ev.from.toLocaleString('default', { month: 'short' })}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{ev.orderId}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ev.items}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default BookingCalendar;
