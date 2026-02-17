const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 text-sm text-slate-600 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <h3 className="font-semibold text-slate-900">Contact</h3>
          <p>+1 (800) 555-0115</p>
          <p>bookings@eventgoods.com</p>
          <p>42 Celebration Ave, Austin, TX</p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Company</h3>
          <p>Terms and Conditions</p>
          <p>Privacy Policy</p>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Social</h3>
          <p>Instagram · Facebook · X</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
