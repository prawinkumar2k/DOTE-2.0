import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateUtils';

export const generateApplicationPDF = (data, applicationNo) => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 41, 59); // blue-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECTORATE OF TECHNICAL EDUCATION', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Admission Portal - Application 2026', 105, 32, { align: 'center' });

    // Application Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Application No: ${applicationNo}`, 20, 55);
    doc.text(`Date of Submission: ${formatDate(new Date())}`, 140, 55);
    doc.line(20, 60, 190, 60);

    // Section 1: Personal Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. PERSONAL INFORMATION', 20, 70);
    
    const personalData = [
      ['Full Name', data.fullName || '-'],
      ['Date of Birth', formatDate(data.dob) || '-'],
      ['Gender', data.gender || '-'],
      ['Community', data.community || '-'],
      ['Aadhaar No', data.aadhaar || '-'],
      ['Mobile No', data.mobile || '-'],
      ['Email Address', data.email || '-']
    ];

    autoTable(doc, {
      startY: 75,
      head: [['Field', 'Value']],
      body: personalData,
      theme: 'striped',
      headStyles: { fillStyle: [30, 41, 59] },
      margin: { left: 20, right: 20 }
    });

    const parentData = [
      ['Father Name', data.fatherName || '-'],
      ['Mother Name', data.motherName || '-'],
      ['Annual Income', `Rs. ${data.annualIncome || '0'}`]
    ];

    let currentY = doc.lastAutoTable.finalY + 15;
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Parent Information', 'Details']],
      body: parentData,
      theme: 'grid',
      headStyles: { fillStyle: [30, 41, 59] },
      margin: { left: 20, right: 20 }
    });

    // Section 3: Academic & Choices
    currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. ACADEMIC & PREFERENCES', 20, currentY);

    const academicData = [
      ['Qualifying Exam', data.qualifyingType?.toUpperCase() || '-'],
      ['Medium', data.mediumOfInstruction || '-'],
      ['School Dist.', data.lastInstituteDistrict || '-'],
      ['College Choices', (data.preferences || []).length > 0 ? (data.preferences || []).join(', ') : 'Not Selected']
    ];

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Academic Details', 'Selection']],
      body: academicData,
      theme: 'striped',
      headStyles: { fillStyle: [30, 41, 59] },
      margin: { left: 20, right: 20 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('This is a computer-generated document. No signature required.', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 190, 285);
    }

    doc.save(`Application_${applicationNo}.pdf`);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Error generating PDF: ' + err.message);
  }
};