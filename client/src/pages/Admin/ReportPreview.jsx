import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ReportPdfPreview from '../../components/reports/ReportPdfPreview';

const AdminReportPreview = () => {
  return (
    <MainLayout role="admin">
      <ReportPdfPreview title="Application report preview" backPath="/admin/reports" />
    </MainLayout>
  );
};

export default AdminReportPreview;
