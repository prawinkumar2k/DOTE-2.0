import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { 
  Plus, Layers, MapPin, X, AlertCircle, AlertTriangle, IndianRupee
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../../components/DataTable';
import { getActionColumn } from '../../utils/tableHelpers';

const MasterData = () => {
  const [activeTab, setActiveTab] = useState('districts');
  const [districts, setDistricts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [religions, setReligions] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', state: 'Tamil Nadu' });
  const [feeForm, setFeeForm] = useState({ community: '', fees: '' });
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/master-data', { withCredentials: true });
      if (response.data.success) {
        setDistricts(response.data.districts);
        setCommunities(response.data.communities);
        setReligions(response.data.religions || []);
        setFees(Array.isArray(response.data.fees) ? response.data.fees : []);
      }
    } catch (err) {
      toast.error('Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (activeTab === 'fees') {
      if (!feeForm.community.trim()) return toast.error('Community is required');
      if (feeForm.fees === '' || feeForm.fees === null) return toast.error('Fees amount is required');
      const amt = Number(feeForm.fees);
      if (!Number.isFinite(amt) || amt < 0) return toast.error('Fees must be a non-negative number');
      setSubmitting(true);
      try {
        if (editingFeeId) {
          const response = await axios.put(
            `/api/admin/master-data/fees/${editingFeeId}`,
            { community: feeForm.community.trim(), fees: amt },
            { withCredentials: true }
          );
          if (response.data.success) {
            toast.success(response.data.message || 'Fee updated');
            setShowAddModal(false);
            setEditingFeeId(null);
            setFeeForm({ community: '', fees: '' });
            fetchData();
          }
        } else {
          const response = await axios.post(
            '/api/admin/master-data',
            { type: 'fees', community: feeForm.community.trim(), fees: amt },
            { withCredentials: true }
          );
          if (response.data.success) {
            toast.success(response.data.message || 'Fee added');
            setShowAddModal(false);
            setFeeForm({ community: '', fees: '' });
            fetchData();
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to save fee');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!newEntry.name.trim()) return toast.error('Name is required');
    
    setSubmitting(true);
    try {
      const response = await axios.post('/api/admin/master-data', {
        type: activeTab,
        name: newEntry.name,
        state: activeTab === 'districts' ? newEntry.state : null
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowAddModal(false);
        setNewEntry({ name: '', state: 'Tamil Nadu' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    toast(({ closeToast }) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2.5 text-slate-800">
          <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Remove Entry?</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">"{name}"</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={closeToast} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={async () => {
              closeToast();
              try {
                const response = await axios.delete(`/api/admin/master-data/${activeTab}/${id}`, { withCredentials: true });
                if (response.data.success) {
                  toast.success(response.data.message);
                  fetchData();
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete entry');
              }
            }} 
            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-md shadow-rose-100 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    ), { position: "top-right", autoClose: false, closeOnClick: false, draggable: false });
  };

  const openAddFeeModal = () => {
    setEditingFeeId(null);
    setFeeForm({ community: '', fees: '' });
    setShowAddModal(true);
  };

  const openEditFeeModal = (row) => {
    setEditingFeeId(row.id);
    setFeeForm({ community: row.community || '', fees: String(row.fees ?? '') });
    setShowAddModal(true);
  };

  const categories = [
    { id: 'districts', title: 'Districts', icon: <MapPin size={18} />, count: districts.length },
    { id: 'communities', title: 'Communities', icon: <Layers size={18} />, count: communities.length },
    { id: 'religions', title: 'Religions', icon: <AlertCircle size={18} />, count: religions.length },
    { id: 'fees', title: 'Fees master', icon: <IndianRupee size={18} />, count: fees.length },
  ];

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'districts': return districts;
      case 'communities': return communities;
      case 'religions': return religions;
      case 'fees': return fees;
      default: return [];
    }
  }, [activeTab, districts, communities, religions, fees]);

  const columns = useMemo(() => {
    const baseColumns = [];
    
    if (activeTab === 'districts') {
      baseColumns.push(
        { header: "District Name", accessor: "district_name", sortable: true, filterable: true },
        { header: "State", accessor: "state_name", sortable: true, filterable: true }
      );
    } else if (activeTab === 'communities') {
      baseColumns.push({ header: "Community Name", accessor: "community_name", sortable: true, filterable: true });
    } else if (activeTab === 'religions') {
      baseColumns.push({ header: "Religion Name", accessor: "religion_name", sortable: true, filterable: true });
    } else if (activeTab === 'fees') {
      baseColumns.push(
        { header: "Community", accessor: "community", sortable: true, filterable: true },
        { 
          header: "Fees", 
          accessor: "fees", 
          sortable: true, 
          filterable: true,
          render: (val) => <span className="font-bold text-blue-700">₹{Number(val || 0).toLocaleString()}</span>
        }
      );
    }

    baseColumns.push(getActionColumn({
      onEdit: activeTab === 'fees' ? openEditFeeModal : null,
      onDelete: (row) => handleDelete(row.id, 
        activeTab === 'districts' ? row.district_name : 
        activeTab === 'communities' ? row.community_name : 
        activeTab === 'religions' ? row.religion_name : 
        `${row.community} (₹${row.fees})`
      )
    }));

    return baseColumns;
  }, [activeTab]);

  return (
    <MainLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Master Data Management</h1>
            <p className="text-slate-500">Maintain districts, communities, and per-community application fees</p>
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'fees') openAddFeeModal();
              else {
                setNewEntry({ name: '', state: 'Tamil Nadu' });
                setShowAddModal(true);
              }
            }}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-blue-100"
          >
            <Plus size={18} />{' '}
            {activeTab === 'districts' ? 'Add District' : activeTab === 'communities' ? 'Add Community' : activeTab === 'religions' ? 'Add Religion' : 'Add Fee'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-72 space-y-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                  activeTab === cat.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${activeTab === cat.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                    {cat.icon}
                  </div>
                  <span className="font-bold tracking-tight">{cat.title}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${activeTab === cat.id ? 'bg-white/30' : 'bg-slate-100 text-slate-400'}`}>
                  {cat.count}
                </div>
              </button>
            ))}
            
            <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 hidden lg:block">
              <div className="flex items-center gap-3 text-blue-600 mb-3">
                <AlertCircle size={18} />
                <span className="font-bold text-sm uppercase tracking-wider">Quick Note</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Districts and communities drive dropdowns on the student form. Fees master sets the application amount by community name.
              </p>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1">
            <DataTable
              rowKey="id"
              columns={columns}
              data={currentData}
              isLoading={loading}
              className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
              emptyMessage={`No ${activeTab} found.`}
              showSelection={false}
            />
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => { setShowAddModal(false); setEditingFeeId(null); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
              <div className="px-10 pt-10 pb-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 text-blue-600">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      {activeTab === 'districts' ? (
                        <MapPin size={24} />
                      ) : activeTab === 'communities' ? (
                        <Layers size={24} />
                      ) : (
                        <IndianRupee size={24} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {activeTab === 'fees'
                          ? editingFeeId
                            ? 'Edit application fee'
                            : 'Add application fee'
                          : `Add ${activeTab === 'districts' ? 'District' : activeTab === 'communities' ? 'Community' : 'Religion'}`}
                      </h2>
                      <p className="text-sm font-medium text-slate-400">
                        {activeTab === 'fees'
                          ? 'Match community name exactly as on the application form.'
                          : 'Create a new lookup entry'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setEditingFeeId(null); }}
                    className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddEntry} className="space-y-6">
                  {activeTab === 'fees' ? (
                    <>
                      <datalist id="community-fee-options">
                        {communities.map((c) => (
                          <option key={c.id} value={c.community_name} />
                        ))}
                      </datalist>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                          Community (as in application form)
                        </label>
                        <input
                          autoFocus
                          type="text"
                          list="community-fee-options"
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all outline-none"
                          placeholder="e.g. MBC, SC, OC"
                          value={feeForm.community}
                          onChange={(e) => setFeeForm((p) => ({ ...p, community: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                          Application fee (INR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all outline-none"
                          placeholder="0"
                          value={feeForm.fees}
                          onChange={(e) => setFeeForm((p) => ({ ...p, fees: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                          {activeTab === 'districts' ? 'District Name' : activeTab === 'communities' ? 'Community Name' : 'Religion Name'}
                        </label>
                        <input 
                          autoFocus
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all outline-none"
                          placeholder={`Enter name here...`}
                          value={newEntry.name}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      {activeTab === 'districts' && (
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">State Reference</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-2 border-transparent focus:border-blue-600/10 focus:bg-white transition-all outline-none"
                            value={newEntry.state}
                            onChange={(e) => setNewEntry(prev => ({ ...prev, state: e.target.value }))}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => { setShowAddModal(false); setEditingFeeId(null); }}
                      className="flex-1 py-4 font-black text-slate-400 tracking-widest uppercase text-xs hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-[1.5] py-4 bg-blue-600 text-white font-black tracking-widest uppercase text-xs rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                      {submitting
                        ? 'Saving...'
                        : activeTab === 'fees'
                          ? editingFeeId
                            ? 'Update fee'
                            : 'Add fee'
                          : 'Create Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default MasterData;
