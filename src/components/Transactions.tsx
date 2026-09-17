import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  Search,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { updateTransactionDB, deleteTransactionDB, fetchAllTransactions } from '../utils/api';

interface TransactionsProps {
  transactions?: any[];
  setTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
}

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function Transactions({ transactions: propsTransactions, setTransactions: propsSetTransactions }: TransactionsProps = {}) {
  const { t, language } = useThemeLanguage();
  const [localTransactions, setLocalTransactions] = useState<any[]>([]);
  
  const transactions = propsTransactions !== undefined ? propsTransactions : localTransactions;
  const setTransactions = propsSetTransactions !== undefined ? propsSetTransactions : setLocalTransactions;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [filterBulan, setFilterBulan] = useState(getCurrentMonthKey); 
  
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState('semua');
  const [filterTab, setFilterTab] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  
  const [menuTerbuka, setMenuTerbuka] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transaksiDiedit, setTransaksiDiedit] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  const [editNominal, setEditNominal] = useState('');
  const [editCatatan, setEditCatatan] = useState('');
  const [editKategori, setEditKategori] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editJenis, setEditJenis] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');

  const kategoriPengeluaran = [
    { id: "Kebutuhan Pokok", icon: "🛒" },
    { id: "Transportasi", icon: "🚗" },
    { id: "Hiburan", icon: "🎬" },
    { id: "Makan & Minum", icon: "🍜" },
    { id: "Kesehatan", icon: "💊" },
    { id: "Pendidikan", icon: "📚" },
    { id: "Tagihan", icon: "📄" },
    { id: "Belanja", icon: "👕" },
    { id: "Lainnya", icon: "📦" }
  ];

  const kategoriPemasukan = [
    { id: "Gaji & Upah", icon: "💰" },
    { id: "Bonus & THR", icon: "🎉" },
    { id: "Hasil Usaha", icon: "🏪" },
    { id: "Investasi", icon: "📈" },
    { id: "Pemberian", icon: "🎁" },
    { id: "Lainnya", icon: "📦" }
  ];

  const kategoriAktif = editJenis === "pengeluaran" ? kategoriPengeluaran : kategoriPemasukan;

  useEffect(() => {
    if (propsTransactions === undefined) {
      const saved = localStorage.getItem('transactions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(t => {
              if (!t || typeof t !== 'object') return false;
              const isDummyId = [1, 2, 3, 4, 5].includes(Number(t.id));
              return !isDummyId;
            });
            setLocalTransactions(cleaned);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [propsTransactions]);

  useEffect(() => {
    if (isEditModalOpen || isMonthDropdownOpen || isFilterModalOpen || transactionToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isEditModalOpen, isMonthDropdownOpen, isFilterModalOpen, transactionToDelete]);

  useEffect(() => {
    if (!transactionToDelete) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeletingTransaction) {
        setTransactionToDelete(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [transactionToDelete, isDeletingTransaction]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      if(t && t.tanggal) {
        const parts = t.tanggal.split('-');
        if (parts.length >= 2) {
          months.add(`${parts[0]}-${parts[1]}`);
        }
      }
    });
    return Array.from(months).sort().reverse(); 
  }, [transactions]);

  const handleOpenEdit = (t: any) => {
    setTransaksiDiedit(t);
    setEditNominal(Number(t.nominal).toLocaleString('id-ID'));
    setEditCatatan(t.catatan || '');
    setEditKategori(t.kategori || '');
    setEditTanggal(t.tanggal || new Date().toISOString().split('T')[0]);
    setEditJenis(t.jenis || 'pengeluaran');
    setIsEditModalOpen(true);
    setMenuTerbuka(null);
  };

  const handleSimpanEdit = () => {
    if (!transaksiDiedit) return;
    const cleanNominal = Number(editNominal.replace(/\D/g, ""));
    if (isNaN(cleanNominal) || cleanNominal <= 0) {
      toast.error(t("Masukkan nominal yang valid!", "Please enter a valid amount!"));
      return;
    }

    const targetItem = transactions.find(t => t.id === transaksiDiedit.id);
    const updatedPayload = {
      ...targetItem,
      nominal: cleanNominal,
      catatan: editCatatan || editKategori,
      kategori: editKategori,
      tanggal: editTanggal,
      jenis: editJenis,
      icon: kategoriAktif.find(k => k.id === editKategori)?.icon || "🧾"
    };

    const updated = transactions.map(t => t.id === transaksiDiedit.id ? updatedPayload : t);
    setTransactions(updated);
    setIsEditModalOpen(false);
    setTransaksiDiedit(null);

    const user_email = localStorage.getItem("userEmail") || "";
    updateTransactionDB(transaksiDiedit.id, updatedPayload, user_email).catch(err => console.error(err));
  };

  const executeHardDelete = async (transaction: any) => {
    try {
      const targetId = transaction?.id || transaction?._id || transaction?.uuid;
      if (!targetId) return;
      setMenuTerbuka(null);

      try {
        if (typeof deleteTransactionDB === 'function') {
          const user_email = localStorage.getItem("userEmail") || "";
          await deleteTransactionDB(targetId, user_email);
        }
      } catch (err) { console.error("Gagal hapus DB:", err); }

      if (typeof setTransactions === 'function') {
        setTransactions((prev: any[]) => prev.filter(item => item && String(item.id || item._id) !== String(targetId)));
      }
    } catch (error) { console.error(error); }
  };

  const platformNativeEditFunction = (transaction: any) => {
    if (!transaction) return;
    handleOpenEdit(transaction);
  };

  const platformNativeDeleteFunction = (id: any, e?: React.MouseEvent) => {
    if (!id) return;
    if (e) {
      e.stopPropagation(); 
    }
    const matchedTx = transactions.find(t => t && String(t.id || t._id) === String(id));
    setMenuTerbuka(null);
    setTransactionToDelete(matchedTx || { id });
  };

  const closeDeleteConfirmation = () => {
    if (!isDeletingTransaction) {
      setTransactionToDelete(null);
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete || isDeletingTransaction) return;

    setIsDeletingTransaction(true);
    try {
      await executeHardDelete(transactionToDelete);
      setTransactionToDelete(null);
      toast.success(t('Transaksi berhasil dihapus.', 'Transaction deleted successfully.'));
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const formatTanggalIndo = (tglStr: string) => {
    if (!tglStr) return '-';
    try {
      const dateParts = tglStr.split('-');
      if (dateParts.length === 3) {
        const blnNameIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const blnNameEng = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const blnName = language === 'id' ? blnNameIndo : blnNameEng;
        const monthIndex = parseInt(dateParts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) return `${parseInt(dateParts[2], 10)} ${blnName[monthIndex]} ${dateParts[0]}`;
      }
      return tglStr;
    } catch { return tglStr; }
  };

  const getMonthName = (monthString: string) => {
    if (monthString === 'semua') return t('Semua Waktu', 'All Time');
    if (monthString === getCurrentMonthKey()) return t('Bulan Ini', 'This Month');
    const [y, m] = monthString.split('-');
    const blnName = language === 'id' 
      ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${blnName[parseInt(m)-1]} ${y}`;
  };

  const filteredTransactions = (transactions || []).filter(t => {
    if (!t) return false;
    const searchLower = (searchTerm || '').toLowerCase().trim();
    const notesLower = String(t.catatan || t.description || '').toLowerCase();
    const catLower = String(t.kategori || t.category || '').toLowerCase();

    if (searchLower && !notesLower.includes(searchLower) && !catLower.includes(searchLower)) return false;

    if (filterBulan !== 'semua' && t.tanggal) {
      const [year, month] = t.tanggal.split('-');
      if (`${year}-${month}` !== filterBulan) return false;
    }

    if (filterJenis === 'semua' || filterJenis === 'all') return true;

    const txJenis = String(t.jenis || t.type || '').toLowerCase();
    if (filterJenis === 'pengeluaran' || filterJenis === 'expense') return txJenis === 'pengeluaran' || txJenis === 'expense';
    if (filterJenis === 'pemasukan' || filterJenis === 'income') return txJenis === 'pemasukan' || txJenis === 'income';

    let reqJenis = null;
    let targetCategory = filterJenis;

    if (filterJenis.startsWith('exp:')) { reqJenis = 'pengeluaran'; targetCategory = filterJenis.slice(4); } 
    else if (filterJenis.startsWith('inc:')) { reqJenis = 'pemasukan'; targetCategory = filterJenis.slice(4); }

    if (reqJenis) {
      const matchesJenis = (reqJenis === 'pengeluaran' && (txJenis === 'pengeluaran' || txJenis === 'expense')) ||
                           (reqJenis === 'pemasukan' && (txJenis === 'pemasukan' || txJenis === 'income'));
      if (!matchesJenis) return false;
    }

    return catLower === targetCategory.toLowerCase().trim() || catLower.includes(targetCategory.toLowerCase().trim());
  });

  const getFilterLabel = (val: string) => {
    if (val === 'semua' || val === 'all') return t('Semua Kategori', 'All Categories');
    if (val === 'pengeluaran') return t('Pengeluaran', 'Expenses');
    if (val === 'pemasukan') return t('Pemasukan', 'Income');
    if (val.startsWith('exp:')) return t(val.slice(4), val.slice(4));
    if (val.startsWith('inc:')) return t(val.slice(4), val.slice(4));
    return val;
  };

  const totalPengeluaran = filteredTransactions.filter(t => t && t.jenis === 'pengeluaran').reduce((sum, t) => sum + (Number(String(t.nominal).replace(/\D/g, "")) || 0), 0);
  const totalPemasukan = filteredTransactions.filter(t => t && t.jenis === 'pemasukan').reduce((sum, t) => sum + (Number(String(t.nominal).replace(/\D/g, "")) || 0), 0);
  const totalFormat = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleDownloadCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error(t("Tidak ada data untuk diunduh.", "No data available to download."));
      return;
    }
    const isId = language === 'id';
    const csvRows = [isId ? "Tanggal,Deskripsi,Kategori,Tipe,Nominal (Rp)" : "Date,Description,Category,Type,Nominal (Rp)"];
    filteredTransactions.forEach(tx => {
      const deskripsi = (tx.catatan || tx.kategori || "Transaksi").replace(/,/g, " ");
      const tipe = tx.jenis === 'pemasukan' ? (isId ? 'Pemasukan' : 'Income') : (isId ? 'Pengeluaran' : 'Expense');
      csvRows.push(`${formatTanggalIndo(tx.tanggal)},${deskripsi},${tx.kategori || ""},${tipe},${tx.nominal || 0}`);
    });
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_MOODUIT_${filterBulan}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="w-full max-w-full px-4 pt-5 sm:pt-6 md:pt-8 mx-auto box-border overflow-x-hidden flex flex-col gap-4 pb-24 relative riwayat-kunci-mati">
      <style>
        {`
          .riwayat-kunci-mati { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; box-sizing: border-box !important; }
          @media (max-width: 768px) {
            .riwayat-teks-wrap { white-space: normal !important; word-wrap: break-word !important; width: 100% !important; display: block !important; }
            .riwayat-search-container { flex-direction: column !important; width: 100% !important; }
            .riwayat-search-container > * { width: 100% !important; }
            .filter-bulan-select { width: 0 !important; min-width: 0 !important; flex: 1 1 0% !important; }
          }
        `}
      </style>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="fw-800 text-[#112F58] dark:text-white font-bold text-2xl mb-1">{t('Riwayat Transaksi', 'Transaction History')}</h4>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0 riwayat-teks-wrap">{t('Seluruh alur debit & kredit yang tersimpan pada aplikasi MOODUIT Anda.', 'All debit & credit flows stored in your MOODUIT application.')}</p>
        </div>
      </div>

      <div className="d-flex flex-column flex-sm-row gap-3 mb-2 riwayat-search-container">
        
        <div className="position-relative flex-grow-1">
          <span className="position-absolute translate-middle-y text-muted" style={{ top: '50%', left: '16px' }}>
            <Search size={18} className="text-gray-400" />
          </span>
          <input 
            type="text" 
            placeholder={t('Cari transaksi...', 'Search transactions...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-xl py-3 px-12 focus:border-[#112F58] dark:focus:border-slate-500 focus:outline-none transition-all placeholder-gray-400 text-sm font-semibold shadow-sm"
          />
        </div>
        
        <div className="history-filter-actions d-flex gap-2 w-full sm:w-auto relative">
          <div className="relative flex-1 sm:flex-none filter-bulan-select">
            <button
              type="button"
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="w-full h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold shadow-sm cursor-pointer outline-none transition-colors hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-sm flex items-center justify-center gap-2"
            >
              <Calendar size={16} className="text-slate-400" />
              {getMonthName(filterBulan)}
            </button>

            <AnimatePresence>
              {isMonthDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMonthDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-full min-w-[160px] sm:min-w-[180px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[99999] overflow-hidden py-2"
                  >
                    <div
                      onClick={() => { setFilterBulan('semua'); setIsMonthDropdownOpen(false); }}
                      className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${filterBulan === 'semua' ? 'bg-[#112F58] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-[#112F58] hover:text-white'}`}
                    >
                      {t('Semua Waktu', 'All Time')}
                    </div>
                    {availableMonths.map(m => (
                      <div
                        key={m}
                        onClick={() => { setFilterBulan(m); setIsMonthDropdownOpen(false); }}
                        className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${filterBulan === m ? 'bg-[#112F58] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-[#112F58] hover:text-white'}`}
                      >
                        {getMonthName(m)}
                      </div>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => { 
              setTempFilter(filterJenis); 
              if (filterJenis === 'pemasukan' || filterJenis.startsWith('inc:')) {
                setFilterTab('pemasukan');
              } else {
                setFilterTab('pengeluaran');
              }
              setIsFilterModalOpen(true); 
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Filter size={16} />
            {t('Filter', 'Filter')}
            {filterJenis !== 'semua' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1"></span>}
          </button>
        </div>
      </div>

      {filterJenis !== 'semua' && (
        <div className="d-flex align-items-center gap-2 mb-3 bg-[#112F58] border border-[#112F58] rounded-xl px-3.5 py-2 w-fit shadow-md">
          <span className="text-xs text-white/70 font-semibold">{t('Filter:', 'Filter:')}</span>
          <span className="text-xs font-extrabold text-white">{getFilterLabel(filterJenis)}</span>
          <button 
            onClick={() => setFilterJenis('semua')} 
            className="p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white border-0 bg-transparent cursor-pointer transition-all flex items-center justify-center"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="flex flex-col w-full rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 mb-6 p-3 md:p-5">
        <div className="flex flex-col gap-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-amber-500 mb-3 inline-flex align-items-center justify-center p-4 bg-amber-50 rounded-full"><AlertCircle size={36} /></div>
              <h5 className="text-[#112F58] dark:text-white font-bold text-base mb-1">{t('Data Kosong', 'No Data')}</h5>
              <p className="text-gray-500 text-xs max-w-sm mx-auto">{t('Tidak ada transaksi di bulan atau filter yang kamu pilih.', 'No transactions found for the selected month or filter.')}</p>
            </div>
          ) : (
            filteredTransactions.map((tx, i) => {
              const isPemasukan = tx.jenis === 'pemasukan';
              return (
                <motion.div 
                  key={tx.id} 
                  onClick={() => platformNativeEditFunction(tx)}
                  className="w-full bg-white dark:bg-slate-800 !rounded-[16px] p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3 box-border hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 cursor-pointer group"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.2) }}
                >
                  <div className="transaction-card-main w-full pointer-events-none">
                    <div className="transaction-card-icon w-12 h-12 flex-shrink-0 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xl border border-slate-100 dark:border-slate-600">
                      {tx.icon || (isPemasukan ? '💼' : '🛒')}
                    </div>
                    <div className="transaction-card-copy min-w-0">
                      <h4 className="transaction-card-title font-semibold text-slate-800 dark:text-slate-100 m-0 group-hover:text-[#112F58] dark:group-hover:text-white transition-colors">{(tx.catatan || tx.kategori)}</h4>
                      <p className="transaction-card-meta text-slate-500 dark:text-slate-400 mt-0.5 mb-0">{formatTanggalIndo(tx.tanggal)} • {tx.kategori}</p>
                    </div>
                    <div className="transaction-card-value flex shrink-0">
                      <span className={`transaction-card-amount font-bold ${isPemasukan ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isPemasukan ? '+' : '-'}Rp{Number(tx.nominal || 0).toLocaleString('id-ID')}
                      </span>
                      <span className={`transaction-card-badge text-[9px] font-bold px-2 py-0.5 rounded-full ${isPemasukan ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {isPemasukan ? t('PEMASUKAN', 'INCOME') : t('PENGELUARAN', 'EXPENSE')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        platformNativeEditFunction(tx);
                      }} 
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all border-0 bg-transparent flex items-center justify-center cursor-pointer pointer-events-auto"
                      title={t('Edit Transaksi', 'Edit Transaction')}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => platformNativeDeleteFunction(tx.id, e)} 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all border-0 bg-transparent flex items-center justify-center cursor-pointer pointer-events-auto"
                      title={t('Hapus Transaksi', 'Delete Transaction')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-[#112F58] text-white p-4.5 sm:p-5 rounded-3xl flex flex-col justify-between gap-3.5 shadow-lg border-0 mb-4">
        <div>
          <h6 className="mb-1 text-white/70 text-xs font-bold tracking-wider uppercase">
            {filterBulan === 'semua' ? t('TOTAL KAS SEMUA WAKTU', 'TOTAL CASH ALL TIME') : `${t('TOTAL KAS', 'TOTAL CASH')} ${getMonthName(filterBulan).toUpperCase()}`}
          </h6>
          <div className="grid grid-cols-2 gap-4 w-full mt-2">
            <div>
              <span className="text-[10px] md:text-xs text-gray-300/80 truncate uppercase tracking-wider block leading-none">{t('PENGELUARAN', 'EXPENSES')}</span>
              <span className="text-sm font-bold text-white truncate block mt-1">{totalFormat(totalPengeluaran)}</span>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-gray-300/80 truncate uppercase tracking-wider block leading-none">{t('PEMASUKAN', 'INCOME')}</span>
              <span className="text-sm font-bold text-white truncate block mt-1">{totalFormat(totalPemasukan)}</span>
            </div>
          </div>
        </div>
        <button onClick={handleDownloadCSV} className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all shadow-sm border-0 cursor-pointer">
          <Download size={16} /> {t('Download Laporan', 'Download Report')}
        </button>
      </div>

      {/* EDIT MODAL DIALOG CONTAINER */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-[#112F58]/40 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300">
            <motion.div 
              className="absolute inset-0 bg-[#112F58]/20" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsEditModalOpen(false)} 
            />
            
            <motion.div 
              className="bg-white dark:bg-slate-900 w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="shrink-0 p-4 sm:p-6 pb-3 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-[#112F58] dark:text-white text-lg sm:text-xl font-extrabold tracking-wide m-0">{t('Edit Transaksi', 'Edit Transaction')}</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="bg-gray-50 p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all focus:outline-none border-0 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                
                {/* TOGGLE PENGELUARAN / PEMASUKAN PERSIS GAMBAR 1 */}
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1.5 px-1 font-sans">
                    Jenis Transaksi
                  </label>
                  <div className="flex w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditJenis("pengeluaran");
                        setEditKategori("Kebutuhan Pokok");
                      }}
                      className={`flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-200 border-0 cursor-pointer rounded-l-xl rounded-r-none border-r border-slate-200 dark:border-slate-700 ${
                        editJenis === "pengeluaran" 
                          ? "bg-[#112F58] text-white" 
                          : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {t('Pengeluaran', 'Expenses')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditJenis("pemasukan");
                        setEditKategori("Gaji & Upah");
                      }}
                      className={`flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-200 border-0 cursor-pointer rounded-r-xl rounded-l-none ${
                        editJenis === "pemasukan" 
                          ? "bg-[#112F58] text-white" 
                          : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {t('Pemasukan', 'Income')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 sm:mb-2 block px-1">{t('Jumlah Nominal', 'Total Nominal')}</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden focus-within:border-[#112F58] focus-within:bg-white transition-all duration-300">
                    <span className={`pl-4 sm:pl-5 text-xl sm:text-2xl font-bold ${editJenis === "pengeluaran" ? "text-red-500" : "text-emerald-500"}`}>Rp</span>
                    <input 
                      type="text" 
                      value={editNominal}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\D/g, "");
                        setEditNominal(cleanValue ? Number(cleanValue).toLocaleString('id-ID') : "");
                      }}
                      placeholder="0"
                      className={`w-full bg-transparent py-3 sm:py-5 pl-2 sm:pl-3 pr-4 sm:pr-5 text-2xl sm:text-4xl font-extrabold focus:outline-none placeholder-gray-300 ${editJenis === "pengeluaran" ? "text-red-500" : "text-emerald-500"}`} 
                    />
                  </div>
                </div>

                {/* GRID KATEGORI EDIT MODAL (DI PERBAIKI: Menggunakan rounded-xl, Border Tepat, Teks Abu-abu/Putih) */}
                <div>
                  <label className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-2 sm:mb-3 block px-1">{t('Pilih Kategori', 'Select Category')}</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 group-kategori">
                    {kategoriAktif.map((kat) => (
                      <button 
                        key={kat.id}
                        type="button"
                        onClick={() => setEditKategori(kat.id)}
                        className={`flex flex-col items-center justify-center gap-1 sm:gap-2 p-2.5 sm:p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                          editKategori === kat.id 
                            ? "bg-[#112F58] border-[#112F58] text-white shadow-md" 
                            : "bg-white dark:bg-slate-800 border-[#112F58] dark:border-[#112F58] hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span className="text-xl sm:text-2xl drop-shadow-sm">{kat.icon}</span>
                        <span className={`text-[9px] sm:text-[10px] text-center font-extrabold leading-tight break-words uppercase transition-colors ${
                          editKategori === kat.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {kat.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 sm:mb-2 block px-1">{t('Tanggal', 'Date')}</label>
                    <input 
                      type="date" 
                      value={editTanggal} 
                      onChange={(e) => setEditTanggal(e.target.value)} 
                      className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 text-xs sm:text-sm focus:border-[#112F58] focus:bg-white focus:outline-none transition-all cursor-pointer" 
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 sm:mb-2 block px-1">{t('Catatan', 'Notes')}</label>
                    <input 
                      type="text" 
                      value={editCatatan} 
                      onChange={(e) => setEditCatatan(e.target.value)} 
                      placeholder={editJenis === 'pemasukan'
                        ? t('Misal: Gaji bulan ini...', 'E.g., Monthly salary...')
                        : t('Misal: Makan siang...', 'E.g., Lunch...')} 
                      className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 text-xs sm:text-sm focus:border-[#112F58] focus:bg-white focus:outline-none transition-all placeholder-gray-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 bg-white border-t border-gray-100">
                <button 
                  className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#112F58] text-white font-bold text-base sm:text-lg shadow-lg hover:bg-[#0c2240] active:scale-95 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"
                  onClick={handleSimpanEdit}
                >
                  <Edit2 size={20} strokeWidth={2.5} />
                  <span>{t('Simpan Perubahan', 'Save Changes')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE TRANSACTION CONFIRMATION */}
      <AnimatePresence>
        {transactionToDelete && (
          <motion.div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#112F58]/55 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closeDeleteConfirmation();
            }}
          >
            <motion.div
              className="relative w-full max-w-[430px] overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-slate-900"
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-transaction-title"
              aria-describedby="delete-transaction-description"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={isDeletingTransaction}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border-0 !bg-transparent transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: 'transparent', color: '#112F58' }}
                aria-label={t('Tutup konfirmasi hapus', 'Close delete confirmation')}
              >
                <X size={20} strokeWidth={2.4} />
              </button>

              <div className="px-5 pb-5 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-8">
                <motion.div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100 dark:bg-red-950/40 dark:ring-red-900/50"
                  initial={{ rotate: -8, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.08, type: 'spring', stiffness: 350 }}
                >
                  <Trash2 size={30} strokeWidth={2.2} />
                </motion.div>

                <h2 id="delete-transaction-title" className="mb-2 text-xl font-extrabold text-[#112F58] dark:text-white sm:text-2xl">
                  {t('Hapus Transaksi?', 'Delete Transaction?')}
                </h2>
                <p id="delete-transaction-description" className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(
                    'Pastikan transaksi ini memang ingin dihapus. Data yang sudah dihapus tidak dapat dikembalikan.',
                    'Make sure you want to delete this transaction. Deleted data cannot be restored.'
                  )}
                </p>

                <div
                  className="mb-5 rounded-2xl border !bg-white p-4 text-left shadow-sm"
                  style={{ backgroundColor: '#ffffff', borderColor: '#dbe3ec' }}
                >
                  <div className="flex min-w-0 items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="mb-1 truncate text-sm font-extrabold" style={{ color: '#112F58' }}>
                        {transactionToDelete.catatan || transactionToDelete.kategori || t('Transaksi', 'Transaction')}
                      </p>
                      <p className="mb-0 text-xs" style={{ color: '#64748b' }}>
                        {[transactionToDelete.kategori, formatTanggalIndo(transactionToDelete.tanggal)].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-extrabold ${transactionToDelete.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {transactionToDelete.jenis === 'pemasukan' ? '+' : '-'}Rp {Number(transactionToDelete.nominal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteConfirmation}
                    disabled={isDeletingTransaction}
                    className="min-h-12 rounded-xl border !bg-white px-4 py-3 text-sm font-extrabold !text-[#112F58] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#112F58' }}
                  >
                    <span style={{ color: '#112F58' }}>{t('Batal', 'Cancel')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteTransaction}
                    disabled={isDeletingTransaction}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-0 bg-red-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                  >
                    <Trash2 size={17} />
                    {isDeletingTransaction ? t('Menghapus...', 'Deleting...') : t('Hapus', 'Delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300">
            <motion.div
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden relative z-10 max-h-[90vh]"
            >
              <div className="shrink-0 p-4 sm:p-6 pb-3 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h2 className="text-[#112F58] dark:text-white text-lg sm:text-xl font-extrabold tracking-wide m-0">{t('Filter', 'Filter')}</h2>
                <button onClick={() => setIsFilterModalOpen(false)} className="bg-gray-50 p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all focus:outline-none border-0 cursor-pointer"><X size={18} /></button>
              </div>
              
              <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                
                {/* TOGGLE PENGELUARAN / PEMASUKAN FILTER KONSISTEN GAMBAR 1 */}
                <div>
                  <label className="text-[11px] font-extrabold text-gray-400 block mb-3">{t('Tipe Transaksi', 'Transaction Type')}</label>
                  <div className="flex w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                      onClick={() => { setFilterTab('pengeluaran'); setTempFilter('pengeluaran'); }}
                      className={`flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-200 border-0 cursor-pointer rounded-l-xl rounded-r-none border-r border-slate-200 dark:border-slate-700 ${
                        filterTab === 'pengeluaran' 
                          ? "bg-[#112F58] text-white" 
                          : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {t('Pengeluaran', 'Expenses')}
                    </button>
                    <button 
                      onClick={() => { setFilterTab('pemasukan'); setTempFilter('pemasukan'); }}
                      className={`flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-200 border-0 cursor-pointer rounded-r-xl rounded-l-none ${
                        filterTab === 'pemasukan' 
                          ? "bg-[#112F58] text-white" 
                          : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {t('Pemasukan', 'Income')}
                    </button>
                  </div>
                </div>

                {/* GRID KATEGORI FILTER MODAL (DI PERBAIKI: Menggunakan rounded-xl standar Tailwind) */}
                <div>
                  <label className="text-[11px] font-extrabold text-gray-400 block mb-3">
                    {filterTab === 'pengeluaran' ? t('Kategori Pengeluaran', 'Expense Categories') : t('Kategori Pemasukan', 'Income Categories')}
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 group-kategori">
                    {(filterTab === 'pengeluaran' ? kategoriPengeluaran : kategoriPemasukan).map((cat) => {
                      const isActive = tempFilter === (filterTab === 'pengeluaran' ? `exp:${cat.id}` : `inc:${cat.id}`);
                      return (
                        <button 
                          key={cat.id} 
                          onClick={() => setTempFilter(filterTab === 'pengeluaran' ? `exp:${cat.id}` : `inc:${cat.id}`)} 
                          className={`flex flex-col items-center justify-center gap-1 sm:gap-2 p-2.5 sm:p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                            isActive 
                              ? 'bg-[#112F58] border-[#112F58] text-white shadow-md scale-[1.02]' 
                              : 'bg-white dark:bg-slate-800 border-[#112F58] dark:border-[#112F58] hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-xl sm:text-2xl drop-shadow-sm">{cat.icon}</span>
                          <span className={`text-[9px] sm:text-[10px] text-center font-extrabold leading-tight break-words uppercase transition-colors ${
                            isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {cat.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* FOOTER (ANTI-NYANGKUT) */}
              <div className="shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 bg-white flex gap-3 border-t border-gray-100">
                <button onClick={() => setTempFilter('semua')} className="flex-1 py-3 sm:py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg border-0 cursor-pointer transition-colors">{t('Reset', 'Reset')}</button>
                <button onClick={() => { setFilterJenis(tempFilter); setIsFilterModalOpen(false); }} className="flex-1 py-3 sm:py-4 bg-[#112F58] hover:bg-[#0c2240] text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg border-0 cursor-pointer transition-colors shadow-lg">{t('Terapkan', 'Apply')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
