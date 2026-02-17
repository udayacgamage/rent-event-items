const labels = ['Cart Review', 'Delivery/Pickup', 'Payment'];

const CheckoutSteps = ({ step }) => {
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-3">
      {labels.map((label, index) => {
        const isActive = step === index + 1;
        return (
          <div
            key={label}
            className={`rounded-lg border px-3 py-2 text-sm ${isActive ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`}
          >
            Step {index + 1}: {label}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutSteps;
