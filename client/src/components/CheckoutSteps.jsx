const labels = ['Cart Review', 'Delivery/Pickup', 'Payment'];

const CheckoutSteps = ({ step }) => {
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-3">
      {labels.map((label, index) => {
        const stepNum = index + 1;
        const isActive = step === stepNum;
        const isCompleted = step > stepNum;
        return (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${isActive ? 'border-amber-500 bg-amber-50 text-amber-700' : isCompleted ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}
          >
            {isCompleted ? (
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            ) : (
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{stepNum}</span>
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutSteps;
