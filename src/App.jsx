import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard, FileText, Database, PieChart,
  History, Search, Eye, Trash2, Send, X,
  FilePlus, Printer, UploadCloud, Edit3,
  CheckCircle2, ShieldCheck, TrendingUp, LogOut, AlertCircle
} from 'lucide-react';

/* ================== CONFIG ================== */
const supabaseUrl = 'https://lqczctceamyvzdgtnfdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxY3pjdGNlYW15dnpkZ3RuZmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzYyMDgsImV4cCI6MjA5MzMxMjIwOH0.G7WVQV6OjAHLP1ecGCjKfcOml-XECQXrAOPDOWR-Muc'; // ⚠️ pindahkan ke .env untuk production
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================== MAIN APP ================== */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [archives, setArchives] = useState([]);
  const [filteredArchives, setFilteredArchives] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stafList, setStafList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisposisiOpen, setIsDisposisiOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Surat Masuk',
    date: '',
    drive_link: '',
    classification: '',
    status: 'Aktif'
  });

  const availableCats = [
    'Surat Masuk', 'Surat Keluar', 'Akademik',
    'Kepegawaian', 'Keuangan', 'Legalitas Sekolah', 'Lainnya'
  ];

  /* ================== FETCH ================== */
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: arc } = await supabase.from('nfbs_archives').select('*');
      const { data: cat } = await supabase.from('nfbs_jenis').select('*');
      const { data: stf } = await supabase.from('nfbs_staf').select('*');
      const { data: logs } = await supabase.from('nfbs_logs').select('*').limit(10);

      setArchives(arc || []);
      setCategories(cat || []);
      setStafList(stf || []);
      setActivityLogs(logs || []);
    } catch (err) {
      showNotif('Gagal mengambil data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ================== FILTER ================== */
  useEffect(() => {
    let result = archives;
    if (searchTerm) {
      result = result.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredArchives(result);
  }, [searchTerm, archives]);

  /* ================== NOTIF ================== */
  const showNotif = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  };

  /* ================== LOG ================== */
  const addLog = async (action, target) => {
    await supabase.from('nfbs_logs').insert([{ action_name: action, target_doc: target }]);
  };

  /* ================== UPLOAD ================== */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = Date.now() + "_" + file.name;

    const { error } = await supabase.storage
      .from('nfbs_bucket')
      .upload(fileName, file);

    if (error) return showNotif('Upload gagal', 'error');

    const { data } = supabase.storage
      .from('nfbs_bucket')
      .getPublicUrl(fileName);

    setFormData({ ...formData, drive_link: data.publicUrl });
    showNotif('File berhasil diupload');
  };

  /* ================== SAVE ================== */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date) {
      return showNotif('Field wajib belum lengkap', 'error');
    }

    const action = editingId
      ? supabase.from('nfbs_archives').update(formData).eq('id', editingId)
      : supabase.from('nfbs_archives').insert([formData]);

    const { error } = await action;

    if (error) return showNotif('Gagal menyimpan', 'error');

    showNotif('Data berhasil disimpan');
    addLog(editingId ? 'EDIT' : 'TAMBAH', formData.title);

    setIsModalOpen(false);
    setEditingId(null);
    fetchData();
  };

  /* ================== DELETE ================== */
  const handleDelete = async (id, title) => {
    if (!window.confirm('Yakin hapus data?')) return;

    await supabase.from('nfbs_archives').delete().eq('id', id);
    addLog('HAPUS', title);
    fetchData();
  };

  /* ================== UI ================== */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl">
        Loading E-Arsip NFBS...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">

      {/* NOTIFICATION */}
      {notif && (
        <div className={`fixed top-5 right-5 px-6 py-3 rounded-xl shadow-lg text-white 
          ${notif.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {notif.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <ShieldCheck /> E-ARSIP
        </h1>

        {['dashboard','archives','master','reports','logs'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className="block w-full text-left py-2 px-3 rounded hover:bg-slate-700">
            {tab.toUpperCase()}
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 overflow-auto">

        {/* SEARCH */}
        <div className="mb-4 flex justify-between">
          <input
            placeholder="Cari arsip..."
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            className="border p-2 rounded w-72"
          />

          <button
            onClick={()=>{setIsModalOpen(true); setEditingId(null);}}
            className="bg-blue-600 text-white px-4 py-2 rounded">
            + Tambah
          </button>
        </div>

        {/* TABLE */}
        {activeTab === 'archives' && (
          <table className="w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-slate-200 text-sm">
                <th className="p-3">Judul</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredArchives.map(a => (
                <tr key={a.id} className="border-t text-sm">
                  <td className="p-3">{a.title}</td>
                  <td>{a.status}</td>
                  <td>{a.date}</td>
                  <td className="flex gap-2 p-2">
                    <button onClick={()=>window.open(a.drive_link)}>
                      <Eye size={16}/>
                    </button>
                    <button onClick={()=>{setEditingId(a.id); setFormData(a); setIsModalOpen(true);}}>
                      <Edit3 size={16}/>
                    </button>
                    <button onClick={()=>handleDelete(a.id,a.title)}>
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px]">

            <h2 className="text-lg font-bold mb-4">
              {editingId ? 'Edit Arsip' : 'Tambah Arsip'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3">
              <input
                placeholder="Judul"
                value={formData.title}
                onChange={(e)=>setFormData({...formData,title:e.target.value})}
                className="w-full border p-2 rounded"
              />

              <input
                type="date"
                value={formData.date}
                onChange={(e)=>setFormData({...formData,date:e.target.value})}
                className="w-full border p-2 rounded"
              />

              <input type="file" onChange={handleFileUpload} />

              <button className="w-full bg-blue-600 text-white py-2 rounded">
                Simpan
              </button>
            </form>

            <button onClick={()=>setIsModalOpen(false)} className="mt-3 text-red-500">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}