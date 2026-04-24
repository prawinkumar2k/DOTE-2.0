import React from 'react';
import { FileText } from 'lucide-react';
import govtLogo from '../assets/govt_logo.png';
import { formatDate } from '../utils/dateUtils';

const ApplicationReport = ({ data, colleges = [], headerActions = null }) => {
  const s = data?.student;
  const m = data?.marks;

  if (!s) return null;

  const handlePrint = () => {
    window.print();
  };

  // Parsing educational history from comma-separated strings
  const parseEduHistory = () => {
    if (!s.standard_studied) return [];
    const standards = s.standard_studied.split(',');
    const schools = (s.standard_school_name || '').split(',');
    const years = (s.standard_yop || '').split(',');
    const districts = (s.standard_district || '').split(',');
    const states = (s.standard_state || '').split(',');

    return standards.map((std, i) => ({
      standard: std,
      school: schools[i] || '',
      year: years[i] || '',
      district: districts[i] || '',
      state: states[i] || ''
    }));
  };

  const eduHistory = parseEduHistory();

  // Determine active qualification type
  const getQualifyingType = () => {
    if (m?.hsc === 'Yes' || m?.hsc === 'yes') return 'hsc';
    if (m?.sslc === 'Yes' || m?.sslc === 'yes') return 'sslc';
    if (m?.iti === 'Yes' || m?.iti === 'yes') return 'iti';
    return 'hsc'; // Default
  };

  const qType = getQualifyingType();
  const qPrefix = qType.toLowerCase();

  const getMarksData = () => {
    const subjects = [];
    for (let i = 1; i <= 6; i++) {
      if (m?.[`${qPrefix}_subject${i}`]) {
        subjects.push({
          name: m[`${qPrefix}_subject${i}`],
          obtained: m[`${qPrefix}_subject${i}_obtained_mark`],
          max: m[`${qPrefix}_subject${i}_max_mark`] || '100'
        });
      }
    }
    return subjects;
  };

  const marks = getMarksData();
  const preferences = s.college_choices ? JSON.parse(s.college_choices).filter(Boolean) : [];

  return (
    <div className="w-full min-h-screen bg-white text-black font-serif selection:bg-blue-100">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden sticky top-16 z-30 bg-white border-b border-slate-200 px-8 py-4 mb-8 flex justify-between items-center shadow-md no-serif">
        <div>
          <h2 className="font-bold text-slate-800">Application Report Review</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Format Verification</p>
        </div>
        <div className="flex gap-4">
          {headerActions}
           <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 border-none cursor-pointer shadow-lg shadow-blue-200"
          >
            <FileText size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div className="max-w-[21cm] mx-auto print:max-w-full print:m-0">
        
        {/* PAGE 1: BASIC DETAILS */}
        <div className="p-[1.5cm] border border-slate-100 mb-8 print:mb-0 print:border-none print:p-0 page-break bg-white relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
            <img src={govtLogo} alt="Govt Logo" className="w-24 h-24 object-contain" />
            <div className="text-center flex-1">
              <h1 className="text-[20px] font-bold uppercase leading-tight">
                APPLICATION FORM FOR ADMISSION TO GOVERNMENT<br />
                POLYTECHNIC COLLEGE 2025
              </h1>
            </div>
            <div className="w-24"></div> {/* Spacer for symmetry */}
          </div>

          <div className="text-right mb-6">
            <p className="font-bold text-sm tracking-tight">APPLICATION NO : {s.application_no || '--'}</p>
          </div>

          <div className="flex gap-4 relative">
            {/* Details Table */}
            <div className="flex-1 space-y-2.5">
              <DataRow label="Candidate Name" value={s.student_name} />
              <DataRow label="Father's/Guardian's Name" value={s.father_name} />
              <DataRow label="Mother Name" value={s.mother_name} />
              <DataRow label="Mother Tongue" value={s.mother_tongue} />
              <DataRow label="Parent/Guardian Occupation" value={s.parent_occupation} />
              <DataRow label="Parent/Guardian Annual Income" value={s.parent_annual_income ? `LESS THAN ${s.parent_annual_income}` : ''} />
              <DataRow label="Date of Birth" value={formatDate(s.dob)} />
              <DataRow label="Age" value={s.age} />
              <DataRow label="Gender" value={s.gender} />
              <DataRow label="Citizenship" value={s.citizenship} />
              <DataRow label="Nativity" value={s.nativity} />
              <DataRow label="Civic Native" value={s.civic_native} />
              <DataRow label="Religion" value={s.religion} />
              <DataRow label="Community" value={s.community} />
              <DataRow label="Caste" value={s.caste} />
              <DataRow label="Communication Address" value={s.communication_address} />
              <DataRow label="Permanent Address" value={s.permanent_address || s.communication_address} />
              <DataRow label="Mobile No" value={s.mobile} />
              <DataRow label="Alternative Mobile No" value={s.alt_mobile} />
              <DataRow label="Email ID" value={s.email} />
              <DataRow label="Aadhar Number" value={s.aadhar} />
              <DataRow label="Are you Government School Student" value={s.school_type === 'govt' ? 'YES' : 'NO'} />
            </div>

            {/* Photo Box */}
            <div className="absolute right-0 top-0 w-[3.5cm] h-[4.5cm] border border-black p-0.5 bg-white">
              <div className="w-full h-full border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                {s.photo ? (
                  <img src={s.photo} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center uppercase p-4">Affix Your Recent Passport Size Photo Here</span>
                )}
              </div>
            </div>
          </div>

          {/* SPECIAL RESERVATION */}
          <div className="mt-8">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr>
                  <th colSpan="3" className="border border-black p-1.5 text-left uppercase font-bold bg-white">SPECIAL RESERVATION</th>
                </tr>
                <tr className="bg-white italic font-normal">
                  <td className="border border-black p-1.5 w-1/3">Differently Abled</td>
                  <td className="border border-black p-1.5 w-1/3">Eminent Sports Person</td>
                  <td className="border border-black p-1.5 w-1/3">Ex-Servicemen</td>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold">
                  <td className="border border-black p-1.5 uppercase">{s.differently_abled || 'NO'}</td>
                  <td className="border border-black p-1.5 uppercase">{s.eminent_sports || 'NO'}</td>
                  <td className="border border-black p-1.5 uppercase">{s.ex_servicemen || 'NO'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGE 2: TABLES */}
        <div className="p-[1.5cm] border border-slate-100 mb-8 print:mb-0 print:border-none print:p-0 page-break bg-white">
          {/* Header (Repeated for every page to match official look) */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
            <img src={govtLogo} alt="Govt Logo" className="w-20 h-20 object-contain" />
            <div className="text-center flex-1">
              <h1 className="text-[18px] font-bold uppercase leading-tight">
                APPLICATION FORM FOR ADMISSION TO GOVERNMENT<br />
                POLYTECHNIC COLLEGE 2025
              </h1>
            </div>
          </div>

          {/* CIVIC INFORMATION */}
          <div className="mt-4">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr><th colSpan="3" className="border border-black p-1.5 text-left uppercase font-bold">CIVIC INFORMATION</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5"><span className="italic">Mother Tongue</span><br /><span className="font-bold uppercase">{s.mother_tongue || '-'}</span></td>
                  <td className="border border-black p-1.5"><span className="italic">Medium Of Instruction</span><br /><span className="font-bold uppercase">{s.medium_of_instruction || '-'}</span></td>
                  <td className="border border-black p-1.5"><span className="italic">Parent Occupation</span><br /><span className="font-bold uppercase">{s.parent_occupation || '-'}</span></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5"><span className="italic">Civic Native</span><br /><span className="font-bold uppercase">{s.civic_native || '-'}</span></td>
                  <td className="border border-black p-1.5"><span className="italic">Civic School</span><br /><span className="font-bold uppercase">{s.civic_school_type || '-'}</span></td>
                  <td className="border border-black p-1.5"><span className="italic">Nativity</span><br /><span className="font-bold uppercase">{s.nativity || '-'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DETAILS OF INSTITUTE LAST STUDIED */}
          <div className="mt-6">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr><th colSpan="2" className="border border-black p-1.5 text-left uppercase font-bold">DETAILS OF INSTITUTE LAST STUDIED</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 w-1/2"><span className="italic">Name of the Institute</span><br /><span className="font-bold uppercase">{s.last_institution_name || '-'}</span></td>
                  <td className="border border-black p-1.5 w-1/2"><span className="italic">District</span><br /><span className="font-bold uppercase">{s.last_institution_district || '-'}</span></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5"><span className="italic">Register No.</span><br /><span className="font-bold uppercase">{s.last_institution_register_no || '-'}</span></td>
                  <td className="border border-black p-1.5"><span className="italic">Board</span><br /><span className="font-bold uppercase">{s.last_institution_board || '-'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* STUDY DETAILS */}
          <div className="mt-6">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr><th colSpan="5" className="border border-black p-1.5 text-left uppercase font-bold">STUDY DETAILS</th></tr>
                <tr className="font-bold">
                  <td className="border border-black p-1.5 w-24">STANDARD</td>
                  <td className="border border-black p-1.5">SCHOOL NAME</td>
                  <td className="border border-black p-1.5 w-28">YEAR OF PASSING</td>
                  <td className="border border-black p-1.5 w-32">DISTRICT</td>
                  <td className="border border-black p-1.5 w-24">STATE</td>
                </tr>
              </thead>
              <tbody>
                {eduHistory.map((edu, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1.5">{edu.standard}</td>
                    <td className="border border-black p-1.5 uppercase">{edu.school}</td>
                    <td className="border border-black p-1.5">{edu.year}</td>
                    <td className="border border-black p-1.5 uppercase">{edu.district}</td>
                    <td className="border border-black p-1.5 uppercase">{edu.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MARKS OBTAINED */}
          <div className="mt-6">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr><th colSpan="3" className="border border-black p-1.5 text-left uppercase font-bold">MARKS OBTAINED IN QUALIFYING EXAMINATION</th></tr>
                <tr className="font-bold text-center">
                  <td className="border border-black p-1.5 text-left">SUBJECT</td>
                  <td className="border border-black p-1.5 w-40">MARKS OBTAINED</td>
                  <td className="border border-black p-1.5 w-40">MAXIMUM MARKS</td>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1.5 uppercase">{mark.name}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{mark.obtained}</td>
                    <td className="border border-black p-1.5 text-center">{mark.max}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="border border-black p-1.5 uppercase">Grand Total</td>
                  <td className="border border-black p-1.5 text-center">{m?.[`${qPrefix}_total_obtained_mark`] || '0'}</td>
                  <td className="border border-black p-1.5 text-center">{m?.[`${qPrefix}_total_mark`] || '0'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* COLLEGE DETAILS */}
          <div className="mt-6">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr><th colSpan="2" className="border border-black p-1.5 text-left uppercase font-bold">COLLEGE DETAILS</th></tr>
                <tr className="font-bold uppercase text-[11px]">
                  <td className="border border-black p-1.5 w-20">CHOICES</td>
                  <td className="border border-black p-1.5">COLLEGE SELECTED</td>
                </tr>
              </thead>
              <tbody>
                {preferences.length > 0 ? preferences.map((code, idx) => {
                  const col = colleges.find(c => c.ins_code === code);
                  return (
                    <tr key={idx}>
                      <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-black p-1.5 uppercase">{code} - {col?.ins_name || 'N/A'}, {col?.ins_city || ''}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="2" className="border border-black p-1.5 text-center italic py-4">No choices selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGE 3: ADDL INFO */}
        <div className="p-[1.5cm] border border-slate-100 mb-8 print:mb-0 print:border-none print:p-0 page-break bg-white">
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
            <img src={govtLogo} alt="Govt Logo" className="w-20 h-20 object-contain" />
            <div className="text-center flex-1">
              <h1 className="text-[18px] font-bold uppercase leading-tight">
                APPLICATION FORM FOR ADMISSION TO GOVERNMENT<br />
                POLYTECHNIC COLLEGE 2025
              </h1>
            </div>
          </div>

          <div className="space-y-6 text-[14px]">
            <div className="flex gap-12">
              <span className="w-64">Hostel Facility Needed</span>
              <span className="font-bold shrink-0 pr-4">:</span>
              <span className="font-bold uppercase">{s.hostel_choice || 'no'}</span>
            </div>
            <div className="flex gap-12">
              <span className="w-64">Women's Only</span>
              <span className="font-bold shrink-0 pr-4">:</span>
              <span className="font-bold uppercase">{s.womens_choice || 'no'}</span>
            </div>
          </div>
        </div>
        {/* PAGE 5: PAYMENT RECEIPT */}
        <div className="p-[1.5cm] border border-slate-100 mb-8 print:mb-0 print:border-none print:p-0 page-break bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
            <img src={govtLogo} alt="Govt Logo" className="w-24 h-24 object-contain" />
            <div className="text-center flex-1">
              <h1 className="text-[20px] font-bold uppercase leading-tight">
                APPLICATION FORM FOR ADMISSION TO GOVERNMENT<br />
                POLYTECHNIC COLLEGE 2025
              </h1>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full border-collapse border border-black text-[13px]">
              <thead>
                <tr><th colSpan="2" className="border border-black p-3 text-left uppercase font-bold bg-white text-[14px]">PAYMENT RECEIPT</th></tr>
              </thead>
              <tbody className="font-bold">
                <tr>
                  <td className="border border-black p-3 w-1/2 uppercase font-normal text-slate-700">APPLICATION NO</td>
                  <td className="border border-black p-3 uppercase">{s.application_no || '--'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 uppercase font-normal text-slate-700">CANDIDATE NAME</td>
                  <td className="border border-black p-3 uppercase font-bold">{s.student_name}</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 uppercase font-normal text-slate-700">PAYMENT REQ.ID</td>
                  <td className="border border-black p-3 uppercase font-bold">--</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 uppercase font-normal text-slate-700">TRANSACTION ID</td>
                  <td className="border border-black p-3 uppercase font-bold">--</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 uppercase font-normal text-slate-700">TRANSACTION TIME</td>
                  <td className="border border-black p-3 uppercase font-bold">--</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 uppercase font-normal text-slate-700">TRANSACTION AMOUNT</td>
                  <td className="border border-black p-3 uppercase font-bold text-lg">₹ 0.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-[11px] leading-relaxed text-slate-600 italic">
            The validity of this receipt is subject to realization of the amount in the POLYTECHNIC CENTRE Account. This is a computer 
            generated receipt and requires no signature. All kinds of refunds will be processed only by The Office of Secretary, 
            POLYTECHNIC CENTRE, after notification in the POLYTECHNIC CENTRE portal.
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          nav, aside, footer, .print\\:hidden {
            display: none !important;
          }
          .pt-16 {
            padding-top: 0 !important;
          }
          .md\\:ml-64 {
            margin-left: 0 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          .page-break {
            page-break-after: always;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            /* Ensure the page box includes padding */
            box-sizing: border-box !important;
            min-height: auto !important;
          }
          .page-break:last-child {
            page-break-after: auto !important;
          }
        }
        .font-serif {
          font-family: "Times New Roman", Times, serif;
        }
        .no-serif {
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
        table th, table td {
          border-color: black !important;
        }
        * {
          box-sizing: border-box;
        }
      ` }} />
    </div>
  );
};

const DataRow = ({ label, value }) => (
  <div className="flex gap-4 text-[12.5px] leading-snug items-start">
    <span className="w-60 uppercase font-normal shrink-0 text-slate-700">{label}</span>
    <span className="font-bold shrink-0 w-2 text-center">:</span>
    <span className="font-bold uppercase flex-1 whitespace-pre-wrap">{value || '--'}</span>
  </div>
);

export default ApplicationReport;
