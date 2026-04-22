import { useState, useEffect, useMemo, useCallback, useId, createElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Smartphone,
  Building2,
  Wallet,
  CreditCard,
  Loader,
  ArrowLeft,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Printer,
  FileBadge,
  BadgeIndianRupee,
} from 'lucide-react';

/** Same rule as ApplicationForm — these communities submit from step 9 without visiting this page. */
const STATUTORY_NO_FEE_COMMUNITIES = ['SC', 'SCA', 'ST'];

const MERCHANT_LABEL = 'DOTE — Tamil Nadu Admission';
const GATEWAY_STYLE = 'Secure payment (simulated — CCAvenue-style UI; connect API later)';

const PAYMENT_MODES = [
  { id: 'debit_card', label: 'Debit Card', sub: 'All major banks', Icon: CreditCard },
  { id: 'credit_card', label: 'Credit Card', sub: 'Visa · RuPay · Mastercard', Icon: CreditCard },
  { id: 'wallet', label: 'Wallet', sub: 'PhonePe · Paytm · Others', Icon: Wallet },
  { id: 'netbanking', label: 'Net Banking', sub: '58+ banks', Icon: Building2 },
  { id: 'upi', label: 'UPI', sub: 'Google Pay · BHIM · any UPI app', Icon: Smartphone },
];

const WALLETS = ['PhonePe', 'Paytm', 'Amazon Pay', 'Mobikwik', 'JioMoney'];
const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Indian Bank',
  'Canara Bank',
  'Punjab National Bank',
];

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(n) || 0)));
}

function buildTrackingId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${t}${r}`;
}

/** Light client-side validation so the flow feels real; no real PCI data. */
function validateMethodFields(method, fields) {
  const num = (s) => String(s || '').replace(/\s/g, '');
  if (method === 'debit_card' || method === 'credit_card') {
    if (num(fields.cardNumber || '').replace(/\D/g, '').length < 16)
      return 'Enter a valid 16-digit card number.';
    if (!/^\d{2}\/\d{2}$/.test((fields.expiry || '').trim())) return 'Enter expiry as MM/YY.';
    if (num(fields.cvv || '').length < 3) return 'Enter CVV.';
    if (!(fields.nameOnCard || '').trim()) return 'Enter name on card.';
  }
  if (method === 'wallet' && !(fields.wallet || '').trim()) return 'Select a wallet.';
  if (method === 'netbanking' && !(fields.bank || '').trim()) return 'Select your bank.';
  if (method === 'upi') {
    const upi = (fields.upiId || '').trim();
    if (!upi.includes('@')) return 'Enter a valid UPI ID (e.g. name@upi).';
  }
  return null;
}

function PaymentReceiptBlock({
  orderId,
  trackingId,
  bankRef,
  amountLabel,
  fullName,
  community,
  applicationNo,
  paymentModeLabel,
  onPrint,
}) {
  return (
    <div className="print-shadow rounded-2xl border border-slate-200 bg-white overflow-hidden print:border-0 print:shadow-none">
      <div className="bg-gradient-to-r from-[#0a4d68] to-[#088395] px-6 py-4 text-white flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-100/90">
            Payment successful
          </p>
          <p className="text-lg font-black tracking-tight">Transaction receipt</p>
        </div>
        <CheckCircle2 className="shrink-0 text-emerald-300" size={40} strokeWidth={2} />
      </div>
      <div className="p-6 md:p-8 space-y-5 text-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</p>
            <p className="font-mono font-bold text-slate-900 break-all">{orderId}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tracking ID</p>
            <p className="font-mono font-bold text-slate-900 break-all">{trackingId}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bank reference</p>
            <p className="font-mono font-bold text-slate-900">{bankRef}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid on</p>
            <p className="font-bold text-slate-900">
              {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 mb-2">
            Application number (generated after successful payment)
          </p>
          <p className="text-2xl md:text-3xl font-black tracking-wider text-emerald-950">{applicationNo}</p>
          <p className="text-xs text-emerald-900/80 mt-2">
            {fullName}
            {community ? (
              <>
                {' '}
                · Community <span className="font-bold">{community}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-between items-end border-t border-slate-100 pt-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount paid</p>
            <p className="text-2xl font-black text-slate-900">{amountLabel}</p>
            <p className="text-xs text-slate-500 mt-1">
              Via <span className="font-semibold text-slate-700">{paymentModeLabel}</span> (simulated)
            </p>
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 print:hidden"
          >
            <Printer size={16} />
            Print receipt
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Simulated hosted checkout styled like a generic Indian PG (CCAvenue-class layout).
 * Server submit runs only after the user completes the simulated payment successfully.
 */
const StudentPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const receiptPrintId = useId();

  const state = location.state || {};
  const amountInr = Math.max(0, Math.round(Number(state.amountInr) || 0));
  const fullName = state.fullName || 'Applicant';
  const community = state.community || '';

  const [phase, setPhase] = useState('pay'); // pay | processing | success
  const [checking, setChecking] = useState(true);

  const [method, setMethod] = useState('upi');
  const [fields, setFields] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
    wallet: '',
    bank: '',
    upiId: '',
  });

  const [paying, setPaying] = useState(false);

  const [orderId] = useState(() => `ORD${Date.now().toString(36).toUpperCase()}`);
  const [trackingId, setTrackingId] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [applicationNo, setApplicationNo] = useState('');

  const feeLabel = useMemo(() => formatInr(amountInr), [amountInr]);

  const communityUpper = community.trim().toUpperCase();
  const isStatutoryFree = STATUTORY_NO_FEE_COMMUNITIES.includes(communityUpper);

  const updateField = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('/api/student/me', { withCredentials: true });
        if (cancelled) return;
        if (res.data?.isSubmitted) {
          toast.info('Your application is already submitted.');
          navigate('/student/my-application', { replace: true });
          return;
        }
        if (isStatutoryFree) {
          toast.info('No payment is required for your community. Confirm submission from step 9 of the application.');
          navigate('/student/apply', { replace: true });
          return;
        }
        if (amountInr <= 0) {
          toast.error('Invalid payment session. Use Confirm submission on the application review step.');
          navigate('/student/apply', { replace: true });
          return;
        }
      } catch {
        navigate('/login', { replace: true });
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountInr, navigate, isStatutoryFree]);

  const paymentModeLabel = useMemo(() => {
    const m = PAYMENT_MODES.find((x) => x.id === method);
    return m ? m.label : method;
  }, [method]);

  const handleSimulatedPay = async () => {
    const err = validateMethodFields(method, fields);
    if (err) {
      toast.error(err);
      return;
    }

    setPaying(true);
    setPhase('processing');

    const track = buildTrackingId();
    const bRef = `BNK${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    setTrackingId(track);
    setBankRef(bRef);

    await new Promise((r) => setTimeout(r, 2200));

    const paymentId = `CCA_SIM_${method.toUpperCase()}_${Date.now()}`;

    try {
      const res = await axios.post(
        '/api/student/submit',
        { paymentId },
        { withCredentials: true }
      );
      if (res.data.success) {
        setApplicationNo(res.data.applicationNo);
        setPhase('success');
        toast.success(`Payment successful. Application ${res.data.applicationNo} registered.`);
      } else {
        setPhase('pay');
        toast.error(res.data.message || 'Could not complete submission.');
      }
    } catch (err) {
      setPhase('pay');
      toast.error(err.response?.data?.message || 'Payment or submission failed.');
    } finally {
      setPaying(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const goToApplication = () => {
    navigate('/student/my-application', { replace: true });
  };

  if (checking) {
    return (
      <MainLayout role="student">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
          <Loader className="animate-spin text-[#088395]" size={36} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Connecting to secure checkout…</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="student">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 print:py-4">
        <Link
          to="/student/apply"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#0a4d68] hover:text-[#088395] mb-6 print:hidden"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to application
        </Link>

        {/* Gateway-style top bar */}
        <div className="rounded-t-2xl bg-gradient-to-r from-[#063251] via-[#0a4d68] to-[#088395] px-5 py-4 md:px-8 flex flex-wrap items-center justify-between gap-4 text-white print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Lock size={22} className="text-teal-200" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-100/90 truncate">
                {GATEWAY_STYLE}
              </p>
              <p className="text-lg md:text-xl font-black tracking-tight truncate">{MERCHANT_LABEL}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-100/95">
            <ShieldCheck size={18} />
            <span>256-bit SSL · PCI DSS ready</span>
          </div>
        </div>

        <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-[#f4f8fb] shadow-xl overflow-hidden print:border print:shadow-none print:bg-white">
          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <Loader className="animate-spin text-[#088395] mb-6" size={48} />
              <p className="text-lg font-black text-slate-800 mb-2">Processing your payment…</p>
              <p className="text-sm text-slate-500 max-w-md">
                Please do not refresh. Redirecting to the bank / UPI app is simulated for this demo.
              </p>
            </div>
          )}

          {phase === 'pay' && (
            <div className="grid lg:grid-cols-12 gap-0 lg:divide-x divide-slate-200">
              {/* Order summary */}
              <aside className="lg:col-span-4 p-6 md:p-8 bg-white border-b lg:border-b-0 border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  Payable details
                </p>
                <div className="rounded-2xl bg-slate-900 text-white p-5 mb-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                    <BadgeIndianRupee className="text-teal-400 shrink-0" size={22} />
                  </div>
                  <p className="text-3xl font-black tracking-tight mb-2">{feeLabel}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Application processing fee as per{' '}
                    <span className="text-slate-200 font-semibold">fees master</span> for your community.
                  </p>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Order ID</dt>
                    <dd className="font-mono font-bold text-slate-800 text-right break-all">{orderId}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Applicant</dt>
                    <dd className="font-bold text-slate-800 text-right">{fullName}</dd>
                  </div>
                  {community ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Community</dt>
                      <dd className="font-bold text-slate-800 text-right">{community}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-950 leading-relaxed">
                  <strong>Demo mode:</strong> No real charge. After API integration, this screen will POST to your
                  server / CCAvenue initiate URL instead of completing locally.
                </div>
              </aside>

              {/* Payment instrument */}
              <section className="lg:col-span-8 p-6 md:p-8 bg-[#fafcfd]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  Choose payment option
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 mb-8">
                  {PAYMENT_MODES.map(({ id, label, sub, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMethod(id)}
                      className={`flex flex-col items-start text-left p-3 rounded-xl border-2 transition-all min-h-[88px] ${
                        method === id
                          ? 'border-[#088395] bg-teal-50/90 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {createElement(Icon, {
                        size: 22,
                        className: method === id ? 'text-[#0a4d68]' : 'text-slate-400',
                        strokeWidth: 2,
                      })}
                      <span className="text-xs font-black text-slate-900 mt-2 leading-tight">{label}</span>
                      <span className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">{sub}</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">
                    {paymentModeLabel} details
                  </p>

                  {(method === 'debit_card' || method === 'credit_card') && (
                    <div className="grid gap-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Card number
                        </span>
                        <input
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono outline-none focus:border-[#088395] focus:ring-2 focus:ring-teal-100"
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          autoComplete="off"
                          value={fields.cardNumber}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const parts = v.match(/.{1,4}/g) || [];
                            updateField('cardNumber', parts.join(' '));
                          }}
                        />
                      </label>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Valid thru (MM/YY)
                          </span>
                          <input
                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono outline-none focus:border-[#088395]"
                            placeholder="MM/YY"
                            value={fields.expiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                              updateField('expiry', v);
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CVV</span>
                          <input
                            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono outline-none focus:border-[#088395]"
                            placeholder="•••"
                            type="password"
                            maxLength={4}
                            value={fields.cvv}
                            onChange={(e) =>
                              updateField('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))
                            }
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Name on card
                        </span>
                        <input
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#088395]"
                          placeholder="As printed on card"
                          value={fields.nameOnCard}
                          onChange={(e) => updateField('nameOnCard', e.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  {method === 'wallet' && (
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Select wallet
                      </span>
                      <select
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#088395] bg-white"
                        value={fields.wallet}
                        onChange={(e) => updateField('wallet', e.target.value)}
                      >
                        <option value="">Choose wallet</option>
                        {WALLETS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {method === 'netbanking' && (
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Select bank
                      </span>
                      <select
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#088395] bg-white"
                        value={fields.bank}
                        onChange={(e) => updateField('bank', e.target.value)}
                      >
                        <option value="">Choose your bank</option>
                        {BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {method === 'upi' && (
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        UPI ID
                      </span>
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#088395]"
                        placeholder="yourname@paytm"
                        value={fields.upiId}
                        onChange={(e) => updateField('upiId', e.target.value.trim())}
                      />
                      <p className="mt-2 text-[11px] text-slate-500">
                        You will approve the request in your UPI app (simulated here).
                      </p>
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSimulatedPay}
                  disabled={paying}
                  className="mt-8 w-full py-4 rounded-xl font-black uppercase tracking-[0.12em] text-xs bg-gradient-to-r from-[#0a4d68] to-[#088395] text-white hover:brightness-105 border border-teal-700/30 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-all active:scale-[0.995]"
                >
                  {paying ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Please wait…
                    </>
                  ) : (
                    <>Pay {feeLabel}</>
                  )}
                </button>
              </section>
            </div>
          )}

          {phase === 'success' && (
            <div className="p-6 md:p-10 space-y-8" id={receiptPrintId}>
              <PaymentReceiptBlock
                orderId={orderId}
                trackingId={trackingId}
                bankRef={bankRef}
                amountLabel={feeLabel}
                fullName={fullName}
                community={community}
                applicationNo={applicationNo}
                paymentModeLabel={paymentModeLabel}
                onPrint={printReceipt}
              />

              <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                <button
                  type="button"
                  onClick={goToApplication}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-xl font-black uppercase tracking-[0.12em] text-xs bg-[#0a4d68] text-white hover:bg-[#063251] shadow-lg transition-all"
                >
                  <FileBadge size={18} />
                  View application · PDF / print
                </button>
                <button
                  type="button"
                  onClick={printReceipt}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black uppercase tracking-[0.12em] text-xs border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                >
                  <Printer size={18} />
                  Print receipt only
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-500 print:hidden">
                Use <strong>View application</strong> to open your submitted form, official report, and browser print
                to PDF — same path as applicants who paid no fee (SC / SCA / ST).
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-400 print:hidden">
          Facilitated through a payment-gateway-style UI inspired by common Indian PG layouts (e.g.{' '}
          <a
            href="https://www.ccavenue.com/"
            target="_blank"
            rel="noreferrer"
            className="text-[#088395] font-semibold hover:underline"
          >
            CCAvenue
          </a>
          ). Replace with live merchant + API once credentials are available.
        </p>
      </div>
    </MainLayout>
  );
};

export default StudentPayment;
