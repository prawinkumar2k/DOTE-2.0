import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Building, Database, GraduationCap, FileText, ClipboardList, FileSpreadsheet, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PasswordChangeModal from './PasswordChangeModal';

const MainLayout = ({ children, role = 'guest' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const handleLogout = async () => {
    try { await axios.post('/api/auth/logout', {}, { withCredentials: true }); } catch { }
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 shadow-sm">
        {/* Full-width row so profile + Logout stay pinned to the viewport top-right */}
        <div className="mx-auto flex h-full w-full max-w-[100vw] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 pr-2">
            <img src="/src/assets/govt_logo.png" alt="Logo" className="h-8 w-auto shrink-0" />
            <span className="truncate text-sm font-bold tracking-tight text-blue-950 sm:text-lg md:text-xl">
              DIRECTORATE OF TECHNICAL EDUCATION - Admission Portal
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            {role === 'guest' ? (
              <div className="hidden items-center gap-4 md:flex">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600">
                  Login
                </Link>
                <Link
                  to="/student-register"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  New Registration
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPwdModalOpen(true)}
                    className="inline-flex max-w-[min(48vw,12rem)] cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-2.5 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/60 sm:max-w-[16rem] sm:gap-2 sm:py-2 sm:pl-3 sm:pr-4 md:max-w-[20rem]"
                    title="Change login password — click"
                  >
                    <User size={18} className="shrink-0 text-blue-600" strokeWidth={2} />
                    <span className="truncate text-[11px] font-bold text-blue-950 sm:text-sm">
                      {user.name || (role === 'student' ? 'Student' : role)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-rose-50 py-1.5 pl-2 pr-2.5 text-[11px] font-bold text-red-600 shadow-sm hover:bg-rose-100 sm:gap-2 sm:py-2 sm:pl-3 sm:pr-4 sm:text-sm"
                  >
                    <LogOut size={18} strokeWidth={2} className="shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>

                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-50"
                    aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                  >
                    {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-16">
        {/* Fixed Sidebar */}
        {role !== 'guest' && (
          <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div className="fixed inset-0 bg-blue-950/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-50 border-r border-slate-200 transition-transform duration-200 ease-in-out overflow-y-auto
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
              <div className="p-4 space-y-1">
                <div className="px-4 py-3 text-[10px] font-bold text-blue-950 uppercase tracking-widest border-b border-slate-200 mb-2">Main Menu</div>
                {role !== 'student' && <SidebarItem to={`/${role}/dashboard`} icon={<Settings size={18} />} label="Dashboard" />}
                {role === 'admin' && (
                  <>
                    <SidebarItem to="/admin/colleges" icon={<Building size={18} />} label="Manage Colleges" />
                    <SidebarItem to="/admin/student-applications" icon={<ClipboardList size={18} />} label="Student Applications" />
                    <SidebarItem to="/admin/master-data" icon={<Database size={18} />} label="Master Data" />
                    <SidebarItem to="/admin/reports" icon={<FileSpreadsheet size={18} />} label="Reports" />
                  </>
                )}
                {role === 'student' && (
                  <>
                    <SidebarItem to="/student/apply" icon={<GraduationCap size={18} />} label="Fill Application" />
                    <SidebarItem to="/student/my-application" icon={<FileText size={18} />} label="View Application" />
                  </>
                )}
                {role === 'college' && (
                  <>
                    <SidebarItem to="/college/applications" icon={<ClipboardList size={18} />} label="Applications" />
                    <SidebarItem to="/college/reports" icon={<BarChart3 size={18} />} label="Reports" />
                  </>
                )}
              </div>
            </aside>
          </>
        )}

        {/* Scrollable Content Column */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${role !== 'guest' ? 'md:ml-64' : ''}`}>
          <main className="flex-1 p-2 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="w-full">
              {children}
            </div>
          </main>

          <footer className="bg-slate-50 border-t border-slate-200 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 Directorate of Technical Education</p>
              <p className="text-slate-500 text-xs font-medium mt-2">Government of Tamil Nadu • Admission Portal</p>
            </div>
          </footer>
        </div>
      </div>

      <PasswordChangeModal
        open={pwdModalOpen && role !== 'guest'}
        onClose={() => setPwdModalOpen(false)}
        role={role}
      />
    </div>
  );
};

const SidebarItem = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded transition-all font-semibold text-sm ${isActive
        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm'
        : 'text-slate-600 hover:bg-gray-100 hover:text-blue-600 border-l-4 border-transparent'
        }`}
    >
      <span className={`${isActive ? 'text-blue-600' : 'text-slate-600'}`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default MainLayout;
