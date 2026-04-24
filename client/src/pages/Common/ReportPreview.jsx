import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ReportPdfPreview from '../../components/reports/ReportPdfPreview';
import { useLocation } from 'react-router-dom';

const ReportPreview = ({ role }) => {
  const location = useLocation();
  const reportHeading = location.state?.reportData?.heading || 'APPLICATION REPORT';
  const backPath = role === 'admin' ? '/admin/reports' : '/college/reports';

  return (
    <MainLayout role={role}>
      <ReportPdfPreview title={`${reportHeading} preview`} backPath={backPath} />
    </MainLayout>
  );
};

export default ReportPreview;
