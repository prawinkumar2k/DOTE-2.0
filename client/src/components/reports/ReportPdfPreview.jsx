import React, { useMemo } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import govtLogo from '../../assets/govt_logo.png';

export default function ReportPdfPreview({ title, backPath }) {
  const location = useLocation();
  const navigate = useNavigate();

  const reportData = location.state?.reportData;
  const hasReport = useMemo(() => Boolean(reportData?.rows?.length), [reportData]);
  const isDateWiseList = reportData?.reportType === 'date';
  const isDateCollectionList = reportData?.reportType === 'date_collection';
  const isStudentRowPdf = isDateWiseList || isDateCollectionList;
  const formatInr = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const handleBack = () => {
    navigate(backPath);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white text-black">
      <div className="print:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 mb-6 flex flex-wrap justify-between items-center gap-3 shadow-sm">
        <div>
          <h2 className="font-bold text-slate-800">Application Report Review</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Format Verification</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!hasReport}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      <div className="max-w-[21cm] mx-auto print:max-w-full print:m-0">
        {hasReport ? (
          <div className="report-sheet p-[1.2cm] border-2 border-black mb-8 print:mb-0 print:p-[10mm] bg-white page-break flex flex-col">
            <div className="flex items-center justify-center gap-4 mb-8">
              <img src={govtLogo} alt="Government logo" className="w-14 h-14 object-contain" />
              <div className="text-center space-y-2">
                <p className="font-bold text-[12px]">DIRECTORATE OF TECHNICAL EDUCATION, CHENNAI - 600025.</p>
                <p className="font-bold text-[12px]">Academic Year :  {academicYear}</p>
                <p className="font-bold text-[13px]">{reportData.heading || 'APPLICATION REPORT'}</p>
              </div>
            </div>

            {/* <p className="text-[12px] font-bold mb-3">College Code: {reportData.collegeCode || '—'}</p> */}

            <table className="w-full border-collapse text-[11px] mb-6">
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left w-16">Sl.No</th>
                  {isStudentRowPdf ? (
                    <>
                      <th className="border border-black p-1 text-left">Date</th>
                      <th className="border border-black p-1 text-left">Application Number</th>
                      <th className="border border-black p-1 text-left">Student Name</th>
                      <th className="border border-black p-1 text-left">Contact Number</th>
                      {isDateCollectionList && (
                        <th className="border border-black p-1 text-left">Collection</th>
                      )}
                    </>
                  ) : (
                    <>
                      <th className="border border-black p-1 text-left">{reportData.tableTitle || 'Category'}</th>
                      <th className="border border-black p-1 text-left w-28">Count</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isStudentRowPdf
                  ? reportData.rows.map((row, index) => (
                      <tr key={`${row.label}-${row.applicationNo}-${index}`}>
                        <td className="border border-black p-1">{index + 1}</td>
                        <td className="border border-black p-1">{row.label}</td>
                        <td className="border border-black p-1">{row.applicationNo}</td>
                        <td className="border border-black p-1">{row.studentName}</td>
                        <td className="border border-black p-1">{row.contact}</td>
                        {isDateCollectionList && (
                          <td className="border border-black p-1">{formatInr(row.count)}</td>
                        )}
                      </tr>
                    ))
                  : reportData.rows.map((row, index) => (
                      <tr key={`${row.label}-${index}`}>
                        <td className="border border-black p-1">{index + 1}</td>
                        <td className="border border-black p-1">{row.label}</td>
                        <td className="border border-black p-1">{row.count}</td>
                      </tr>
                    ))}
              </tbody>
            </table>


          </div>
        ) : (
          <div className="h-[920px] flex items-center justify-center text-slate-500 text-sm font-medium">
            Report preview is unavailable. Please go back and generate the report again.
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                background: white !important;
              }
              nav, aside, footer, .print\\:hidden {
                display: none !important;
              }
              main, .md\\:ml-64, .pt-16 {
                margin: 0 !important;
                padding: 0 !important;
                max-width: none !important;
              }
              .page-break {
                page-break-after: auto;
                box-shadow: none !important;
              }
              .report-sheet {
                width: 100% !important;
                min-height: 281mm !important;
                break-inside: avoid;
              }
            }
            .report-sheet {
              min-height: 281mm;
            }
          `,
        }}
      />
    </div>
  );
}
