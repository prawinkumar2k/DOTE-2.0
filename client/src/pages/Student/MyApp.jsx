import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ApplicationReport from '../../components/ApplicationReport';
import { FileText, CheckCircle, Download, Clock, MapPin, Phone, Mail, User } from 'lucide-react';
import axios from 'axios';

const MyApp = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('report'); // 'overview' or 'report'
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    setLoading(true);
    // Fetch user data
    axios.get('/api/student/me', { withCredentials: true })
      .then(res => { if (res.data.success) setData(res.data); })
      .catch(() => {})
      .finally(() => {
         // Also fetch colleges
         axios.get('/api/master/colleges')
           .then(res => { if (Array.isArray(res.data)) setColleges(res.data); })
           .catch(() => {})
           .finally(() => setLoading(false));
      });
  }, []);

  const s = data?.student;
  const m = data?.marks;

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify({ student: s, marks: m }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `application_${s?.application_no || 'draft'}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <MainLayout role="student"><div className="flex items-center justify-center h-64 text-slate-400">Loading application...</div></MainLayout>;

  if (!s) return <MainLayout role="student"><div className="flex items-center justify-center h-64 text-slate-500">No application data found.</div></MainLayout>;


  // Show professional report if in report mode
  if (viewMode === 'report') {
    return (
      <MainLayout role="student">
        <div className="space-y-6">
          <div id="report-container">
            <ApplicationReport data={data} colleges={colleges} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Original overview mode
  const subjects = m ? [
    { name: m.hsc_subject1, obtained: m.hsc_subject1_obtained_mark, max: m.hsc_subject1_max_mark },
    { name: m.hsc_subject2, obtained: m.hsc_subject2_obtained_mark, max: m.hsc_subject2_max_mark },
    { name: m.hsc_subject3, obtained: m.hsc_subject3_obtained_mark, max: m.hsc_subject3_max_mark },
    { name: m.hsc_subject4, obtained: m.hsc_subject4_obtained_mark, max: m.hsc_subject4_max_mark },
    { name: m.hsc_subject5, obtained: m.hsc_subject5_obtained_mark, max: m.hsc_subject5_max_mark },
    { name: m.hsc_subject6, obtained: m.hsc_subject6_obtained_mark, max: m.hsc_subject6_max_mark },
  ].filter(sub => sub.name) : [];

  const pct = Math.round(((data?.completedSteps || 0) / 9) * 100);

  return (
    <MainLayout role="student">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Application Overview</h1>
            <p className="text-slate-500">View your submitted details and current status</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setViewMode('report')} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
              <FileText size={18} /> Official Report
            </button>
            <button onClick={handleDownloadJSON} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
              <Download size={18} /> Download JSON
            </button>
            <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
              <Download size={18} /> Print PDF
            </button>
          </div>
        </div>

        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-1 text-white shadow-xl">
          <div className="bg-[#1e1e1e]/20 backdrop-blur-sm rounded-[22px] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">{pct}%</div>
              <div>
                <h2 className="text-2xl font-bold">{s.application_no ? 'Application Submitted' : 'Application In Progress'}</h2>
                <p className="text-blue-100 italic">{s.application_no ? `Application No: ${s.application_no}` : 'Complete all steps and submit'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 px-6 py-4 rounded-2xl border border-white/10">
              <CheckCircle size={32} className="text-emerald-400" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Current Phase</p>
                <p className="text-xl font-bold">{s.application_no ? 'Under Review' : 'Form Filling'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Section title="Personal Information" icon={<User size={20} />}>
              <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
                <DetailItem label="Full Name" value={s.student_name} />
                <DetailItem label="Date of Birth" value={s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : '—'} />
                <DetailItem label="Gender" value={s.gender} />
                <DetailItem label="Aadhaar" value={s.aadhar ? `XXXX-XXXX-${String(s.aadhar).slice(-4)}` : '—'} />
                <DetailItem label="Community" value={s.community} />
                <DetailItem label="Religion" value={s.religion} />
                <DetailItem label="Caste" value={s.caste} />
                <DetailItem label="Father's Name" value={s.father_name} />
                <DetailItem label="Mother's Name" value={s.mother_name} />
                <DetailItem label="Annual Income" value={s.parent_annual_income ? `₹${Number(s.parent_annual_income).toLocaleString('en-IN')}` : '—'} />
              </div>
            </Section>

            {subjects.length > 0 && (
              <Section title="Academic Performance (HSC)" icon={<FileText size={20} />}>
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/50">
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-3">Subject</th>
                        <th className="px-6 py-3">Obtained</th>
                        <th className="px-6 py-3">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map((sub, i) => (
                        <tr key={i} className="text-sm">
                          <td className="px-6 py-4 font-bold text-slate-700">{sub.name}</td>
                          <td className="px-6 py-4 font-bold text-blue-600">{sub.obtained || '—'}</td>
                          <td className="px-6 py-4">{sub.max || '—'}</td>
                        </tr>
                      ))}
                      {m?.hsc_percentage && (
                        <tr className="text-sm bg-blue-50">
                          <td className="px-6 py-4 font-bold text-slate-800">Overall</td>
                          <td className="px-6 py-4 font-bold text-blue-700">{m.hsc_percentage}%</td>
                          <td className="px-6 py-4 font-bold text-slate-500">Cutoff: {m.hsc_cutoff || '—'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {s.college_choices && (
              <Section title="College Preferences" icon={<FileText size={20} />}>
                <div className="space-y-2">
                  {(JSON.parse(s.college_choices) || []).filter(Boolean).map((code, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="font-semibold text-slate-700">College Code: {code}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-8">
            <Section title="Contact Info" icon={<Phone size={20} />}>
              <div className="space-y-4">
                <div className="flex items-center gap-4"><Mail className="text-blue-500" size={18} /><span className="text-sm text-slate-600">{s.email || '—'}</span></div>
                <div className="flex items-center gap-4"><Phone className="text-emerald-500" size={18} /><span className="text-sm text-slate-600">{s.mobile || '—'}</span></div>
                <div className="flex items-start gap-4"><MapPin className="text-rose-500 shrink-0 mt-0.5" size={18} /><span className="text-sm text-slate-600">{s.communication_address || '—'}</span></div>
              </div>
            </Section>

            <Section title="Special Category" icon={<Clock size={20} />}>
              <div className="space-y-2">
                <Badge label="Differently Abled" active={s.differently_abled === 'yes'} />
                <Badge label="Ex-Serviceman's Ward" active={s.ex_servicemen === 'yes'} />
                <Badge label="Sports Person" active={s.eminent_sports === 'yes'} />
                <Badge label="Govt School Student" active={s.school_type === 'govt'} />
              </div>
            </Section>

            <Section title="Documents" icon={<FileText size={20} />}>
              <div className="space-y-2">
                <DocStatus label="Photo" path={s.photo} />
                <DocStatus label="Transfer Cert" path={s.transfer_certificate} />
                <DocStatus label="Marksheet" path={s.marksheet_certificate} />
                <DocStatus label="Community Cert" path={s.community_certificate} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">{icon}</div>
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-semibold text-slate-800">{value || '—'}</p>
  </div>
);

const Badge = ({ label, active }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${active ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-300'}`} />
    {label}
  </div>
);

const DocStatus = ({ label, path }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${path ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
    <span className="font-semibold">{label}</span>
    <span className="text-xs">{path ? '✓ Uploaded' : 'Pending'}</span>
  </div>
);

export default MyApp;
