// 1. IMPOR & KONFIGURASI
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, Database, PieChart, History, Plus, Search, Eye, Trash2, 
  Send, FilePlus, Printer, Download, UploadCloud, Edit3, ShieldCheck, 
  CheckCircle2, TrendingUp, Layers, Activity, AlertCircle, LogOut, Flame, 
  BarChart3, ShieldAlert // Gunakan ShieldAlert sebagai pengganti UserShield
} from 'lucide-react';

const supabaseUrl = 'https://lqczctceamyvzdgtnfdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxY3pjdGNlYW15dnpkZ3RuZmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzYyMDgsImV4cCI6MjA5MzMxMjIwOH0.G7WVQV6OjAHLP1ecGCjKfcOml-XECQXrAOPDOWR-Muc';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  // 2. STATE & LOGIKA BACKEND
  const [userRole, setUserRole] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [archives, setArchives] = useState([]);
  const [filteredArchives, setFilteredArchives] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stafList, setStafList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisposisiOpen, setIsDisposisiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('Semua');

  const [newStaf, setNewStaf] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');

  const [formData, setFormData] = useState({
    title: '', category: 'Surat Masuk', date: '', drive_link: '', classification: '', status: 'Aktif'
  });

  const availableCats = ['Surat Masuk', 'Surat Keluar', 'Akademik', 'Kepegawaian', 'Keuangan', 'Legalitas Sekolah', 'Lainnya'];
  const statusOptions = ['Aktif', 'Inaktif', 'Dimusnahkan', 'Dipinjamkan'];

  // Fungsi Fetching Data
  const fetchData = async () => {
    const { data: arc } = await supabase.from('nfbs_archives').select('*').order('created_at', { ascending: false });
    const { data: cat } = await supabase.from('nfbs_jenis').select('*').order('code', { ascending: true });
    const { data: stf } = await supabase.from('nfbs_staf').select('*').order('nama_jabatan');
    const { data: logs } = await supabase.from('nfbs_logs').select('*').order('created_at', { ascending: false }).limit(20);
    setArchives(arc || []); setCategories(cat || []); setStafList(stf || []); setActivityLogs(logs || []);
  };

  useEffect(() => { if (userRole) fetchData(); }, [userRole]);

  useEffect(() => {
    let result = archives || [];
    if (searchTerm) result = result.filter(a => a.title?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterCat !== 'Semua') result = result.filter(a => a.category === filterCat);
    setFilteredArchives(result);
  }, [searchTerm, filterCat, archives]);

  // Handlers
  const createLog = async (action, docTitle, detail) => {
    await supabase.from('nfbs_logs').insert([{ action_name: action, target_doc: docTitle || 'N/A', details: `Role: ${userRole} | ${detail}` }]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('nfbs_bucket').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('nfbs_bucket').getPublicUrl(fileName);
      setFormData({ ...formData, drive_link: data.publicUrl });
    }
    setIsUploading(false);
  };

  const handleSaveArchive = async (e) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const action = isEdit ? supabase.from('nfbs_archives').update(formData).eq('id', editingId) : supabase.from('nfbs_archives').insert([formData]);
    const { error } = await action;
    if (!error) {
      createLog(isEdit ? 'Update' : 'Tambah', formData.title, formData.category);
      setIsModalOpen(false); setEditingId(null);
      setFormData({ title: '', category: 'Surat Masuk', date: '', drive_link: '', classification: '', status: 'Aktif' });
      fetchData();
    }
  };

  const saveStafAction = async (e) => {
    e.preventDefault();
    if(!newStaf) return;
    const { error } = await supabase.from('nfbs_staf').insert([{ nama_jabatan: newStaf }]);
    if (!error) { createLog('Tambah Master', 'Staf', newStaf); setNewStaf(''); fetchData(); }
  };

  const saveJenisAction = async (e) => {
    e.preventDefault();
    if(!newCatCode || !newCatLabel) return;
    const { error } = await supabase.from('nfbs_jenis').insert([{ code: newCatCode, label: newCatLabel }]);
    if (!error) { createLog('Tambah Master', 'Klasifikasi', newCatCode); setNewCatCode(''); setNewCatLabel(''); fetchData(); }
  };

  const deleteItem = async (table, id, title) => {
    if(window.confirm(`Hapus ${title}?`)) {
      await supabase.from(table).delete().eq('id', id);
      createLog('Hapus', title, table);
      fetchData();
    }
  };

  // --- Tambahkan ini di Bagian 2 (Logika Backend) ---
 const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: regFullName,
          role: regRole
        }
      }
    });

    if (error) throw error;

    // Tambahkan notifikasi sukses di sini
    alert("Akun Berhasil Didaftarkan! Silakan gunakan email dan password tersebut untuk masuk.");
    
    // Reset form dan kembali ke tampilan login
    setShowRegister(false);
    setRegEmail('');
    setRegPassword('');
    setRegFullName('');
  } catch (error) {
    alert("Gagal mendaftar: " + error.message);
  } finally {
    setLoading(false);
  }
};

  // 3. LOGIN PAGE
  if (!userRole) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 italic font-bold uppercase tracking-tighter">
        <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-12">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3"><ShieldCheck size={40} className="text-white" /></div>
          <h1 className="text-2xl font-black text-center mb-10 text-slate-900">E-ARSIP NFBSL</h1>
          <div className="space-y-3">
            {['admin', 'staf', 'pimpinan'].map(role => (
              <button key={role} onClick={() => setUserRole(role)} className="w-full flex items-center gap-4 p-5 bg-slate-50 border rounded-2xl hover:bg-slate-900 hover:text-white transition-all uppercase font-black">
                <ShieldAlert size={20} /> <span>{role} Access</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden text-left italic uppercase font-bold tracking-tighter">
      {/* 4. NAVIGASI & KERANGKA UTAMA */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
          .no-print { display: none !important; }
          .print-container { width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <aside className="w-72 bg-slate-950 text-white flex flex-col no-print shrink-0 uppercase italic font-black">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-blue-600/20"><ShieldCheck size={28} /></div>
            <h1 className="text-lg font-black leading-none">E-ARSIP <span className="text-blue-500">PRO</span></h1>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'dashboard' ? 'bg-blue-600' : 'text-slate-500 hover:text-white'}`}><LayoutDashboard size={20}/> DASHBOARD</button>
            <button onClick={() => setActiveTab('archives')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'archives' ? 'bg-blue-600' : 'text-slate-500 hover:text-white'}`}><Layers size={20}/> REPOSITORY</button>
            {userRole === 'admin' && <button onClick={() => setActiveTab('master')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'master' ? 'bg-blue-600' : 'text-slate-500 hover:text-white'}`}><Database size={20}/> DATA MASTER</button>}
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'reports' ? 'bg-blue-600' : 'text-slate-500 hover:text-white'}`}><Printer size={20}/> REKAPITULASI</button>
            <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'logs' ? 'bg-blue-600' : 'text-slate-500 hover:text-white'}`}><Activity size={20}/> AUDIT TRAIL</button>
          </nav>
        </div>
        <button onClick={() => setUserRole(null)} className="m-8 p-4 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase"><LogOut size={16}/> KELUAR</button>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-12 no-print shrink-0">
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="CARI DOKUMEN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[450px] pl-12 pr-6 py-3.5 bg-slate-100 rounded-2xl outline-none text-sm font-black italic tracking-widest uppercase" /></div>
          {['admin', 'staf'].includes(userRole) && <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">+ TAMBAH</button>}
        </header>

        <section className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {activeTab === 'dashboard' && <DashboardOverview archives={archives} availableCats={availableCats} />}
          {activeTab === 'archives' && <RepositoryTable data={filteredArchives} userRole={userRole} onEdit={(arc) => {setEditingId(arc.id); setFormData(arc); setIsModalOpen(true);}} onDelete={(arc) => deleteItem('nfbs_archives', arc.id, arc.title)} onDisposisi={(arc) => {setSelectedArchive(arc); setIsDisposisiOpen(true);}} />}
          {activeTab === 'master' && userRole === 'admin' && (
            <MasterDataManagement stafList={stafList} categories={categories} newStaf={newStaf} setNewStaf={setNewStaf} newCatCode={newCatCode} setNewCatCode={setNewCatCode} newCatLabel={newCatLabel} setNewCatLabel={setNewCatLabel} onSaveStaf={saveStafAction} onSaveJenis={saveJenisAction} onDelete={deleteItem} />
          )}
          {activeTab === 'reports' && <PrintReport archives={archives} />}
          {activeTab === 'logs' && <AuditTrail logs={activityLogs} />}
        </section>
      </main>

      {/* 10. MODAL SECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 z-50 text-left font-black italic uppercase">
          <div className="bg-white w-full max-w-2xl rounded-[56px] p-14 shadow-2xl">
            <h2 className="text-2xl font-black mb-10 italic border-l-[10px] border-blue-600 pl-6 uppercase tracking-tighter">{editingId ? 'UPDATE ARSIP' : 'ARSIP BARU'}</h2>
            <form onSubmit={handleSaveArchive} className="space-y-6">
              <input required placeholder="JUDUL DOKUMEN..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-5 bg-slate-100 border rounded-2xl outline-none font-black" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-5 bg-slate-100 border rounded-2xl outline-none font-black italic uppercase">{availableCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select required value={formData.classification} onChange={e => setFormData({...formData, classification: e.target.value})} className="w-full p-5 bg-slate-100 border rounded-2xl outline-none font-black italic uppercase"><option value="">Pilih Klasifikasi...</option>{categories.map(c => <option key={c.id} value={`${c.code}-${c.label}`}>{c.code}-{c.label}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-5 bg-slate-100 border rounded-2xl outline-none font-black" />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-5 bg-slate-100 border rounded-2xl outline-none font-black italic uppercase">{statusOptions.map(st => <option key={st} value={st}>{st}</option>)}</select>
              </div>
              <div className="p-10 border-4 border-dashed border-slate-200 rounded-[32px] bg-slate-50 text-center font-black italic uppercase group hover:bg-blue-50/50 transition-colors">
                <input type="file" onChange={handleFileUpload} className="hidden" id="file-up" />
                <label htmlFor="file-up" className="cursor-pointer font-black italic uppercase">
                  <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-all ${formData.drive_link ? 'bg-emerald-600 text-white' : 'bg-white text-blue-600 shadow-xl group-hover:scale-110'}`}>{isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-4 border-t-transparent border-current" /> : <UploadCloud size={32}/>}</div>
                  <p className="text-sm text-slate-700 tracking-widest">{formData.drive_link ? "ARSIP DISINKRONKAN" : "KLIK PILIH FILE"}</p>
                </label>
              </div>
              <button type="submit" disabled={isUploading} className="w-full p-6 bg-slate-900 text-white rounded-[32px] font-black tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all uppercase italic">PROSES DATABASE</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 text-xs font-black mt-4 text-center tracking-widest hover:text-slate-900 transition-colors">BATALKAN</button>
            </form>
          </div>
        </div>
      )}

      {isDisposisiOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 text-left font-black italic uppercase">
          <div className="bg-white w-[450px] rounded-[48px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="bg-amber-500 p-8 text-white text-center"><Send size={48} className="mx-auto mb-4"/><h3 className="text-2xl font-black italic tracking-tighter uppercase">Lembar Disposisi</h3></div>
            <div className="p-12 space-y-6">
              <p className="text-sm text-center text-slate-500 italic uppercase">"{selectedArchive?.title}"</p>
              <select id="staf-select" className="w-full p-5 bg-slate-100 border rounded-2xl outline-none font-black italic uppercase">
                {stafList.map(s => <option key={s.id} value={s.nama_jabatan}>{s.nama_jabatan}</option>)}
              </select>
              <button onClick={() => {createLog('Disposisi', selectedArchive.title, `Ke: ${document.getElementById('staf-select').value}`); alert('Instruksi Disposisi Terkirim'); setIsDisposisiOpen(false);}} className="w-full py-5 bg-amber-500 text-white rounded-[24px] font-black shadow-2xl hover:bg-amber-600 transition-all">KIRIM INSTRUKSI</button>
              <button onClick={() => setIsDisposisiOpen(false)} className="w-full text-slate-400 text-xs mt-2 text-center">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. KOMPONEN DASHBOARD MODERN DENGAN WARNA DINAMIS
const DashboardOverview = ({ archives, availableCats }) => {
  // Definisi warna per kategori (Tailwind Gradients)
  const catColors = {
    'Surat Masuk': 'from-blue-600 to-blue-400',
    'Surat Keluar': 'from-emerald-600 to-emerald-400',
    'Akademik': 'from-amber-500 to-orange-400',
    'Kepegawaian': 'from-purple-600 to-purple-400',
    'Keuangan': 'from-rose-600 to-rose-400',
    'Legalitas Sekolah': 'from-cyan-600 to-cyan-400',
    'Lainnya': 'from-slate-600 to-slate-400'
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left">
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'TOTAL', key: 'all', color: 'slate', icon: BarChart3, count: archives.length },
          { label: 'AKTIF', key: 'Aktif', color: 'emerald', icon: CheckCircle2, count: archives.filter(a => a.status === 'Aktif').length },
          { label: 'PINJAM', key: 'Dipinjamkan', color: 'amber', icon: History, count: archives.filter(a => a.status === 'Dipinjamkan').length },
          { label: 'INAKTIF', key: 'Inaktif', color: 'slate', icon: AlertCircle, count: archives.filter(a => a.status === 'Inaktif').length },
          { label: 'MUSNAH', key: 'Dimusnahkan', color: 'red', icon: Flame, count: archives.filter(a => a.status === 'Dimusnahkan').length }
        ].map(item => (
          <div key={item.label} className="bg-white p-6 rounded-[28px] border shadow-sm group hover:border-blue-600 transition-all">
            <div className={`p-2 bg-${item.color}-50 text-${item.color}-600 rounded-xl mb-4 group-hover:scale-110 transition-transform w-fit`}><item.icon size={20} /></div>
            <p className="text-slate-400 text-[9px] font-black tracking-widest uppercase italic">{item.label}</p>
            <h3 className="text-3xl font-black mt-2 text-slate-800 italic">{item.count}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-12 rounded-[48px] shadow-xl border">
        <div className="flex justify-between items-center mb-16">
          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest italic flex items-center gap-3"><TrendingUp className="text-blue-600" size={20} /> ANALISIS DATA PER KATEGORI</h4>
          <div className="flex gap-4 text-[8px] font-black italic text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> REALTIME</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> VALIDATED</span>
          </div>
        </div>

        <div className="flex items-end justify-between h-80 px-8 gap-8">
          {availableCats.map(cat => {
            const count = archives.filter(a => a.category === cat).length;
            const pct = archives.length > 0 ? (count / archives.length) * 100 : 0;
            // Ambil warna dari list, jika tidak ada pakai warna default slate
            const currentGradient = catColors[cat] || 'from-slate-500 to-slate-300';

            return (
              <div key={cat} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                {/* TOOLTIP JUMLAH */}
                {count > 0 && (
                  <div className="absolute -top-10 bg-slate-900 text-white text-[9px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-black shadow-lg z-10">
                    {count} DOKUMEN
                  </div>
                )}
                
                {/* BAR GRAFIK BERWARNA */}
                <div className="w-full bg-slate-50 rounded-2xl relative h-full flex items-end overflow-hidden border border-slate-100 group-hover:border-blue-200 transition-all">
                  <div 
                    className={`w-full bg-gradient-to-t ${currentGradient} shadow-xl transition-all duration-1000 ease-out group-hover:brightness-110`} 
                    style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} 
                  />
                </div>
                
                {/* LABEL BAWAH */}
                <span className="text-[9px] font-black text-slate-400 mt-6 uppercase text-center leading-tight tracking-widest italic group-hover:text-slate-900 transition-colors">
                  {cat.split(' ').map((word, i) => <div key={i}>{word}</div>)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 7. REPOSITORY
const RepositoryTable = ({ data, userRole, onEdit, onDelete, onDisposisi }) => (
  <div className="bg-white rounded-[40px] shadow-xl border overflow-hidden animate-in fade-in">
    <table className="w-full text-left uppercase italic font-black">
      <thead className="bg-slate-50/50 border-b">
        <tr><th className="px-10 py-6 text-[10px] text-slate-400 tracking-widest uppercase">DOKUMEN</th><th className="px-10 py-6 text-[10px] text-slate-400 text-center tracking-widest uppercase">STATUS</th><th className="px-10 py-6 text-[10px] text-slate-400 text-right tracking-widest uppercase">AKSI</th></tr>
      </thead>
      <tbody className="divide-y text-xs">
        {data.map(arc => (
          <tr key={arc.id} className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-10 py-7">
              <div className="text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase italic">{arc.title}</div>
              <div className="flex gap-2 mt-2 font-black italic"><span className="bg-slate-100 px-3 py-1 rounded-full">{arc.category}</span><span className="text-blue-500 bg-blue-50 px-3 py-1 rounded-full italic">{arc.classification}</span></div>
            </td>
            <td className="px-10 py-7 text-center">
              <span className={`px-4 py-1.5 rounded-full text-[9px] tracking-widest uppercase ${arc.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : arc.status === 'Dimusnahkan' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{arc.status}</span>
            </td>
            <td className="px-10 py-7 text-right">
              <div className="flex justify-end gap-3">
                {['admin', 'staf'].includes(userRole) && <button onClick={() => onDisposisi(arc)} className="p-3 border shadow-sm text-amber-600 rounded-2xl hover:bg-amber-600 transition-all"><Send size={16}/></button>}
                {['admin', 'staf'].includes(userRole) && <button onClick={() => onEdit(arc)} className="p-3 border shadow-sm text-blue-600 rounded-2xl hover:bg-blue-600 transition-all"><Edit3 size={16}/></button>}
                <button onClick={() => window.open(arc.drive_link, '_blank')} className="p-3 border shadow-sm text-slate-600 rounded-2xl hover:bg-slate-900 transition-all"><Download size={16}/></button>
                {userRole === 'admin' && <button onClick={() => onDelete('nfbs_archives', arc.id, arc.title)} className="p-3 border shadow-sm text-red-600 rounded-2xl hover:bg-red-600 transition-all"><Trash2 size={16}/></button>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// 8. KOMPONEN REKAPITULASI (OFFICIAL PRINT) - VERSI FIX
const PrintReport = ({ archives }) => (
  <div className="bg-white pt-4 pb-12 px-12 rounded-[48px] border shadow-sm print-container italic font-black uppercase tracking-tighter text-left animate-in fade-in">
    
    {/* TOMBOL CETAK (Akan hilang otomatis saat proses cetak) */}
    <div className="flex justify-between items-center mb-10 no-print border-b pb-6">
      <div>
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">REKAPITULASI DATA</h3>
        <p className="text-slate-400 text-xs font-black mt-1 uppercase tracking-widest italic">FORMAT OTOMATIS A4 PORTRAIT</p>
      </div>
      <button 
        onClick={() => window.print()} 
        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-blue-600 flex items-center gap-3 uppercase tracking-widest transition-all"
      >
        <Printer size={20}/> CETAK LAPORAN SEKARANG
      </button>
    </div>

    {/* KOP SURAT (Hanya muncul saat dicetak) */}
    <div className="text-center mb-10 border-b-[6px] border-slate-950 pb-8 hidden print:block">
      <h1 className="text-3xl font-black italic uppercase text-center tracking-tighter">NURUL FIKRI BOARDING SCHOOL LEMBANG</h1>
      <p className="text-[11px] font-black uppercase tracking-[0.4em] mt-3 text-center italic opacity-70">LAPORAN INVENTARIS DOKUMEN ADMINISTRASI SEKOLAH</p>
    </div>

    {/* TABEL DATA */}
    <table className="w-full border-collapse mb-16 text-xs text-left font-black uppercase italic">
      <thead>
        <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-black border-b-2 border-black font-black">
          <th className="p-4 border text-center">NO</th>
          <th className="p-4 border text-left">JUDUL DOKUMEN</th>
          <th className="p-4 border text-center">KATEGORI</th>
          <th className="p-4 border text-center">TANGGAL</th>
        </tr>
      </thead>
      <tbody>
        {archives.map((a, i) => (
          <tr key={a.id} className="border-b print:leading-tight">
            <td className="p-4 border text-center">{i + 1}</td>
            <td className="p-4 border text-slate-800">{a.title}</td>
            <td className="p-4 border text-center text-slate-500">{a.category}</td>
            <td className="p-4 border text-center font-mono opacity-60">{a.date}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* TANDA TANGAN SEJAJAR */}
    <div className="mt-20 w-full px-12 flex justify-between items-end italic font-black uppercase tracking-tighter text-left">
      <div className="text-center">
        <p className="text-sm mb-4 invisible text-center">SPACER</p>
        <p className="text-sm font-black mb-32 text-center uppercase tracking-tighter">MENGETAHUI, PIMPINAN</p>
        <div className="w-72 border-b-4 border-slate-950 mx-auto"></div>
        <p className="text-xs mt-4 opacity-60 text-center tracking-widest">PIMPINAN UNIT / DEPARTEMEN</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-black mb-4 opacity-70 text-center tracking-widest font-black italic">LEMBANG, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p>
        <p className="text-sm font-black mb-32 text-center uppercase tracking-tighter">PENGELOLA ARSIP,</p>
        <div className="w-72 border-b-4 border-slate-950 mx-auto"></div>
        <p className="text-xs mt-4 opacity-60 text-center tracking-widest">ADMIN E-ARSIP NFBSL</p>
      </div>
    </div>
  </div>
);

// 9. AUDIT TRAIL
const AuditTrail = ({ logs }) => (
  <div className="bg-white p-12 rounded-[48px] shadow-xl border text-left font-black italic uppercase animate-in fade-in">
    <h3 className="font-black text-2xl mb-12 flex items-center gap-4 uppercase italic tracking-tighter"><Activity size={32} className="text-blue-600"/> AUDIT TRAIL SISTEM</h3>
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log.id} className="flex items-center gap-8 p-8 bg-slate-50 rounded-[32px] border-l-[10px] border-blue-600 text-left transition-all hover:bg-slate-100">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600"><CheckCircle2 size={24}/></div>
          <div className="flex-1 text-left font-black italic uppercase"><div className="flex justify-between text-[10px] mb-2 uppercase italic tracking-widest font-black"><span className="text-blue-600">{log.action_name}</span><span className="text-slate-400">{new Date(log.created_at).toLocaleString('id-ID')}</span></div><p className="text-sm text-slate-800 tracking-tighter mb-1 font-black italic">TARGET: {log.target_doc}</p><p className="text-[10px] text-slate-400 italic font-black uppercase tracking-widest italic">{log.details}</p></div>
        </div>
      ))}
    </div>
  </div>
);

// 11. KOMPONEN DATA MASTER (VERSI FIX ERROR)
const MasterDataManagement = ({ stafList, categories, onSaveStaf, onSaveJenis, onDelete, onRegister, newStaf, setNewStaf, newCatCode, setNewCatCode, newCatLabel, setNewCatLabel }) => (
  <div className="space-y-10 animate-in fade-in duration-500 text-left font-black italic uppercase tracking-tighter">
    
    {/* REGISTRASI AKSES PENGGUNA */}
    <div className="bg-white p-10 rounded-[40px] border shadow-sm">
      <h3 className="mb-8 flex items-center gap-3 text-slate-900">
        <ShieldAlert size={20} className="text-blue-600" /> {/* Ikon sudah diperbaiki */}
        REGISTRASI AKSES PENGGUNA (STAF/PIMPINAN)
      </h3>
      <form onSubmit={onRegister} className="grid grid-cols-4 gap-4">
        <input name="email" type="email" required className="p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-600" placeholder="EMAIL USER..." />
        <input name="password" type="password" required className="p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-600" placeholder="PASSWORD..." />
        <select name="role" className="p-4 bg-slate-50 border rounded-2xl outline-none font-black italic">
          <option value="staf">STAF OPERASIONAL</option>
          <option value="pimpinan">PIMPINAN UNIT</option>
          <option value="admin">ADMINISTRATOR</option>
        </select>
        <button type="submit" className="bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-blue-600 transition-all uppercase italic">
          DAFTARKAN AKUN
        </button>
      </form>
    </div>

    {/* BARIS BAWAH: STAF & KLASIFIKASI */}
    <div className="grid grid-cols-2 gap-10">
      <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
        <h3 className="mb-8 flex items-center gap-3 text-blue-600 uppercase italic font-black"><Plus size={20} /> STAF DISPOSISI</h3>
        <form onSubmit={onSaveStaf} className="flex gap-2 mb-8">
          <input value={newStaf} onChange={e => setNewStaf(e.target.value)} className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="JABATAN BARU..." />
          <button className="bg-blue-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest">SIMPAN</button>
        </form>
        <div className="space-y-2">
          {stafList.map(s => (
            <div key={s.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group font-black italic uppercase text-xs">
              <span>{s.nama_jabatan}</span>
              <button onClick={() => onDelete('nfbs_staf', s.id, s.nama_jabatan)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
        <h3 className="mb-8 flex items-center gap-3 text-emerald-600 uppercase italic font-black"><FilePlus size={20} /> KLASIFIKASI MASTER</h3>
        <form onSubmit={onSaveJenis} className="grid grid-cols-3 gap-2 mb-8 italic font-black uppercase">
          <input value={newCatCode} onChange={e => setNewCatCode(e.target.value)} className="p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="KODE" />
          <input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} className="p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="LABEL" />
          <button className="bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest italic">SIMPAN</button>
        </form>
        <div className="space-y-2">
          {categories.map(c => (
            <div key={c.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group italic uppercase font-black text-xs">
              <div><span className="text-emerald-600 mr-4 font-black">{c.code}</span>{c.label}</div>
              <button onClick={() => onDelete('nfbs_jenis', c.id, c.label)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);