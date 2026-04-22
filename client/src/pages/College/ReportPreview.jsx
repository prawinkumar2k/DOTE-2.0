import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ReportPdfPreview from '../../components/reports/ReportPdfPreview';
import { useLocation } from 'react-router-dom';

const CollegeReportPreview = () => {
  const location = useLocation();
  const reportHeading = location.state?.reportData?.heading || 'APPLICATION REPORT';

  return (
    <MainLayout role="college">
      <ReportPdfPreview title={`${reportHeading} preview`} backPath="/college/reports" />
    </MainLayout>
  );
};

export default CollegeReportPreview;
