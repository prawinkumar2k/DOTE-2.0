import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import ApplicationReport from '../../components/ApplicationReport';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const StudentApplicationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [reportRes, collegeRes] = await Promise.all([
          axios.get(`/api/admin/student-applications/${id}/report`, { withCredentials: true }),
          axios.get('/api/master/colleges'),
        ]);

        if (reportRes.data?.success) {
          setReportData(reportRes.data);
        } else {
          setReportData(null);
        }

        if (Array.isArray(collegeRes.data)) {
          setColleges(collegeRes.data);
        } else {
          setColleges([]);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load application report');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <MainLayout role="admin">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading application report...</div>
      </MainLayout>
    );
  }

  if (!reportData?.student) {
    return (
      <MainLayout role="admin">
        <div className="flex items-center justify-center h-64 text-slate-500">Application report not available.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="admin">
      <ApplicationReport
        data={reportData}
        colleges={colleges}
        headerActions={
          <button
            type="button"
            onClick={() => navigate('/admin/student-applications')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        }
      />
    </MainLayout>
  );
};

export default StudentApplicationReport;
