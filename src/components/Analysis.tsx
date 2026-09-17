import React from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'motion/react';

ChartJS.register(ArcElement, Tooltip, Legend);
import { 
  PieChart, 
  TrendingDown, 
  TrendingUp, 
  ArrowUpRight, 
  AlertCircle,
  Sparkles,
  Award,
  Wallet,
  PlayCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface AnalysisProps {
  transactions?: any[];
}

export default function Analysis({ transactions: propsTransactions }: AnalysisProps = {}) {
  const { t, language, theme } = useThemeLanguage();
  const darkMode = theme === 'dark';
  const [localTransactions, setLocalTransactions] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [isAiAdviceExpanded, setIsAiAdviceExpanded] = React.useState(false);

  const transactions = propsTransactions !== undefined ? propsTransactions : localTransactions;

  React.useEffect(() => {
    if (propsTransactions === undefined) {
      const savedTransactions = localStorage.getItem('transactions');
      if (savedTransactions) {
        try {
          const parsed = JSON.parse(savedTransactions);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((t: any) => {
              if (!t || typeof t !== 'object') return false;
              const isDummyId = [1, 2, 3, 4, 5].includes(Number(t.id));
              const note = String(t.catatan || '').toLowerCase();
              const cat = String(t.kategori || '').toLowerCase();
              const hasDummyText = 
                note.includes('gaji') ||
                note.includes('netflix') ||
                note.includes('kopi') ||
                note.includes('pertamax') ||
                note.includes('bensin') ||
                note.includes('supermarket') ||
                note.includes('nasi padang') ||
                note.includes('rendang') ||
                note.includes('indihome') ||
                note.includes('wifi') ||
                note.includes('listrik') ||
                note.includes('sabun & beras') ||
                note.includes('kenangan') ||
                cat.includes('dummy');
              return !isDummyId && !hasDummyText;
            });
            setLocalTransactions(cleaned);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [propsTransactions]);

  const pengeluaran = (transactions || []).filter((t: any) => t && t.jenis === 'pengeluaran');
  
  let totalSemua = 0;
  const totalPerKategori: { [key: string]: number } = {};

  pengeluaran.forEach((t: any) => {
    if (!t) return;
    let nominal = 0;
    if (typeof t.nominal === 'number') {
      nominal = t.nominal;
    } else if (typeof t.nominal === 'string') {
      nominal = Number((t.nominal as string).replace(/\D/g, ""));
    } else if (t.nominal) {
      nominal = Number(t.nominal);
    }
    if (!isNaN(nominal) && nominal > 0 && t.kategori) {
      totalPerKategori[t.kategori] = (totalPerKategori[t.kategori] || 0) + nominal;
      totalSemua += nominal;
    }
  });

  const categoryStyles: { [key: string]: { color: string; bg: string; icon: string } } = {
    "Kebutuhan Pokok": { color: '#4F76B8', bg: '#EAF0F8', icon: '🛒' },
    "Transportasi": { color: '#886E41', bg: '#886E4115', icon: '🚗' }, 
    "Hiburan": { color: '#C21C34', bg: '#C21C3415', icon: '🎬' }, 
    "Makan & Minum": { color: '#CA8A04', bg: '#CA8A0415', icon: '🍜' }, 
    "Kesehatan": { color: '#059669', bg: '#05966915', icon: '💊' }, 
    "Pendidikan": { color: '#1D4ED8', bg: '#1D4ED815', icon: '📚' }, 
    "Tagihan": { color: '#6D28D9', bg: '#6D28D915', icon: '📄' }, 
    "Belanja": { color: '#BE185D', bg: '#BE185D15', icon: '👕' },
    "Target Impian": { color: '#7563B8', bg: '#F0ECF8', icon: '🎯' },
    "Lainnya": { color: '#4B5563', bg: '#4B556315', icon: '📦' },
  };

  const categoriesList = Object.keys(totalPerKategori).map(catName => {
    const value = totalPerKategori[catName];
    const percentNum = totalSemua > 0 ? (value / totalSemua) * 100 : 0;
    const percent = percentNum.toFixed(0) + '%';
    const style = categoryStyles[catName] || { color: '#0F766E', bg: '#0F766E18', icon: '🧾' };
    return {
      name: catName,
      value: value,
      percent: percent,
      percentNum: percentNum,
      color: style.color,
      bg: style.bg,
      icon: style.icon
    };
  }).sort((a, b) => b.value - a.value);

  const donutData = {
    labels: categoriesList.map(c => {
      const categoryTranslations: { [key: string]: string } = {
        "Kebutuhan Pokok": t("Kebutuhan Pokok", "Needs"),
        "Transportasi": t("Transportasi", "Transportation"),
        "Hiburan": t("Hiburan", "Entertainment"),
        "Makan & Minum": t("Makan & Minum", "Food & Dining"),
        "Kesehatan": t("Kesehatan", "Healthcare"),
        "Pendidikan": t("Pendidikan", "Education"),
        "Tagihan": t("Tagihan", "Bills & Utilities"),
        "Belanja": t("Belanja", "Shopping"),
        "Lainnya": t("Lainnya", "Others")
      };
      return categoryTranslations[c.name] || c.name;
    }),
    datasets: [
      {
        data: categoriesList.map(c => c.value),
        backgroundColor: categoriesList.map(c => c.color),
        borderColor: '#f8fafc',
        borderWidth: 2,
        hoverOffset: 8,
        cutout: '75%'
      },
    ],
  };

  const donutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.label || '';
            if (label) label += ': ';
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.parsed);
            }
            return label;
          }
        }
      }
    }
  };

  const totalPemasukanDinamis = (transactions || [])
    .filter((t: any) => t && t.jenis === 'pemasukan')
    .reduce((sum: number, t: any) => {
      let nominal = 0;
      if (typeof t.nominal === 'number') nominal = t.nominal;
      else if (typeof t.nominal === 'string') nominal = Number(t.nominal.replace(/\D/g, ""));
      return sum + nominal;
    }, 0);

  let income = totalPemasukanDinamis;

  if (income === 0) {
    const savedBudget = localStorage.getItem('mooduit_50_30_20_budget');
    const budgetData = savedBudget ? JSON.parse(savedBudget) : null;
    if (budgetData && budgetData.pendapatan) {
      income = Number(budgetData.pendapatan.replace(/\D/g, ""));
    } else {
      income = 10000000;
    }
  }

  const budgetLimitNeeds = income * 0.50;
  const budgetLimitWants = income * 0.30;
  const budgetLimitSavings = income * 0.20;

  let actualSpendingNeeds = 0;
  let actualSpendingWants = 0;
  let actualSpendingSavings = 0;

  const needsCategories = ["Kebutuhan Pokok", "Transportasi", "Kesehatan", "Pendidikan", "Tagihan"];

  pengeluaran.forEach((t: any) => {
    let nominal = 0;
    if (typeof t.nominal === 'number') nominal = t.nominal;
    else if (typeof t.nominal === 'string') nominal = Number(t.nominal.replace(/\D/g, ""));
    if (!isNaN(nominal)) {
      const note = String(t.catatan || t.description || "").toLowerCase();
      const cat = String(t.kategori || "").toUpperCase();
      
      if (cat === 'KANTONG' || cat === 'TABUNGAN' || cat === 'INVESTASI' || note.includes('alokasi') || note.includes('allocation')) {
        actualSpendingSavings += nominal;
      } else if (needsCategories.includes(t.kategori)) {
        actualSpendingNeeds += nominal;
      } else {
        actualSpendingWants += nominal;
      }
    }
  });

  const percentNeedsUsed = budgetLimitNeeds > 0 ? (actualSpendingNeeds / budgetLimitNeeds) * 100 : 0;
  const percentWantsUsed = budgetLimitWants > 0 ? (actualSpendingWants / budgetLimitWants) * 100 : 0;
  const percentSavingsUsed = budgetLimitSavings > 0 ? (actualSpendingSavings / budgetLimitSavings) * 100 : 0;

  const incomeCategoryStyles: { [key: string]: { color: string; bg: string; icon: string } } = {
    "Gaji & Upah": { color: '#059669', bg: '#05966915', icon: '💰' },
    "Bonus & THR": { color: '#ca8a04', bg: '#ca8a0415', icon: '🎉' }, 
    "Hasil Usaha": { color: '#0284c7', bg: '#0284c715', icon: '🏪' }, 
    "Investasi": { color: '#7c3aed', bg: '#7c3aed15', icon: '📈' }, 
    "Pemberian": { color: '#db2777', bg: '#db277715', icon: '🎁' }, 
    "Lainnya": { color: '#4b5563', bg: '#4b556315', icon: '📦' },
  };

  const pemasukanTransactions = (transactions || []).filter((t: any) => t && t.jenis === 'pemasukan');
  
  let totalPemasukanSemua = 0;
  const totalPemasukanPerKategori: { [key: string]: number } = {};

  pemasukanTransactions.forEach((t: any) => {
    if (!t) return;
    let nominal = 0;
    if (typeof t.nominal === 'number') {
      nominal = t.nominal;
    } else if (typeof t.nominal === 'string') {
      nominal = Number((t.nominal as string).replace(/\D/g, ""));
    } else if (t.nominal) {
      nominal = Number(t.nominal);
    }
    if (!isNaN(nominal) && nominal > 0 && t.kategori) {
      totalPemasukanPerKategori[t.kategori] = (totalPemasukanPerKategori[t.kategori] || 0) + nominal;
      totalPemasukanSemua += nominal;
    }
  });

  const incomeCategoriesList = Object.keys(totalPemasukanPerKategori).map(catName => {
    const value = totalPemasukanPerKategori[catName];
    const percentNum = totalPemasukanSemua > 0 ? (value / totalPemasukanSemua) * 100 : 0;
    const percent = percentNum.toFixed(0) + '%';
    const style = incomeCategoryStyles[catName] || { color: '#0F766E', bg: '#0F766E18', icon: '🧾' };
    return {
      name: catName,
      value: value,
      percent: percent,
      percentNum: percentNum,
      color: style.color,
      bg: style.bg,
      icon: style.icon
    };
  }).sort((a, b) => b.value - a.value);

  const incomeDonutData = {
    labels: incomeCategoriesList.map(c => {
      const categoryTranslations: { [key: string]: string } = {
        "Gaji & Upah": t("Gaji & Upah", "Salary & Wages"),
        "Bonus & THR": t("Bonus & THR", "Bonus & Allowance"),
        "Hasil Usaha": t("Hasil Usaha", "Business Profits"),
        "Investasi": t("Investasi", "Investments"),
        "Pemberian": t("Pemberian", "Gifts & Grants"),
        "Lainnya": t("Lainnya", "Others")
      };
      return categoryTranslations[c.name] || c.name;
    }),
    datasets: [
      {
        data: incomeCategoriesList.map(c => c.value),
        backgroundColor: incomeCategoriesList.map(c => c.color),
        borderColor: '#f8fafc',
        borderWidth: 2,
        hoverOffset: 8,
        cutout: '75%'
      },
    ],
  };

  const generateIncomeInsight = () => {
    if (totalPemasukanSemua === 0) {
      return {
        tip: t("Belum ada data pemasukan tercatat nih. Masukkan pendapatan gajimu atau hasil usaha agar AI bisa memberi analisa pilar kemakmuran finansialmu!", "No income data recorded yet. Please add your salary or business earnings so the AI can analyze your financial wealth pillars!"),
        highlightName: t("Catat Pendapatan", "Record Income"),
        highlightDesc: t("Sistem mendeteksi Pemasukan bulananmu masih Rp 0.", "System detects your monthly income is still Rp 0.")
      };
    }

    const topIncome = incomeCategoriesList[0];
    const topIncomeNameTranslated = topIncome ? (t(topIncome.name, topIncome.name)) : "";
    
    const savingsAmount = totalPemasukanSemua - totalSemua;
    const savingsRatio = totalPemasukanSemua > 0 ? (savingsAmount / totalPemasukanSemua) * 100 : 0;

    if (savingsRatio < 0) {
      return {
        tip: language === 'id'
          ? `⚠️ Warning keras! Pengeluaranmu melampaui pendapatan bulan ini sebesar Rp ${Math.abs(savingsAmount).toLocaleString('id-ID')}. Kamu kemungkinan menggunakan utang atau tabungan lama. Segera kurangi pengeluaran ya!`
          : `⚠️ Critical warning! Your spending has exceeded your income this month by Rp ${Math.abs(savingsAmount).toLocaleString('id-ID')}. You might be using debt or past savings. Reduce expenses immediately!`,
        highlightName: t("Defisit Anggaran", "Budget Deficit"),
        highlightDesc: language === 'id'
          ? `Laju pengeluaran menyerap ${((totalSemua / totalPemasukanSemua) * 100).toFixed(0)}% dari pemasukanmu.`
          : `Spending rate has absorbed ${((totalSemua / totalPemasukanSemua) * 100).toFixed(0)}% of your income.`
      };
    }

    if (savingsRatio < 20) {
      return {
        tip: language === 'id'
          ? `Pemasukan utamamu bersumber dari "${topIncomeNameTranslated}". Namun, rasio tabunganmu saat ini baru ${savingsRatio.toFixed(0)}% (di bawah target ideal 20%). Coba tingkatkan porsi saving di awal gajian ya! 💸`
          : `Your main income source is from "${topIncomeNameTranslated}". However, your current savings ratio is only ${savingsRatio.toFixed(0)}% (lower than the ideal 20% target). Try saving first at the start of payday! 💸`,
        highlightName: t("Tingkatkan Rasio Tabungan", "Boost Savings Ratio"),
        highlightDesc: language === 'id'
          ? `Sisa dana bebas ditabung: Rp ${savingsAmount.toLocaleString('id-ID')} (${savingsRatio.toFixed(0)}% dari total).`
          : `Remaining cash available to save: Rp ${savingsAmount.toLocaleString('id-ID')} (${savingsRatio.toFixed(0)}% of total).`
      };
    }

    return {
      tip: language === 'id'
        ? `Luar biasa, Slay Finansial! Rasio tabungan/investasimu sangat solid yaitu ${savingsRatio.toFixed(0)}% (Rp ${savingsAmount.toLocaleString('id-ID')}). Dukungan pemasukan terbesar Anda adalah "${topIncomeNameTranslated}". Pertahankan kemakmuran ini! 🎉`
        : `Fantastic, Financial Slay! Your savings/investment ratio is very solid at ${savingsRatio.toFixed(0)}% (Rp ${savingsAmount.toLocaleString('id-ID')}). Supported by your top income source "${topIncomeNameTranslated}". Keep up this prosperity! 🎉`,
      highlightName: t("Rasio Tabungan Prima", "Prime Savings Ratio"),
      highlightDesc: language === 'id'
        ? `Berhasil mengamankan Rp ${savingsAmount.toLocaleString('id-ID')} sebagai pilar dana masa depan.`
        : `Successfully secured Rp ${savingsAmount.toLocaleString('id-ID')} as your future foundation.`
    };
  };

  const incomeInsight = generateIncomeInsight();

  const generateInsight = () => {
    if (totalSemua === 0) {
      return {
        tip: t("Mulai masukkan datamu! AI siap menganalisa kebiasaan jajanmu dan memberikan rekomendasi strategi penghematan terbaik.", "Start inserting your data! AI is ready to analyze your spending habits and provide the best savings strategies."),
        highlightName: t("Lakukan Scan Pertama", "Make Your First Scan"),
        highlightDesc: t("Sistem membutuhkan minimal 1 struk pengeluaran.", "The system requires at least 1 spending receipt.")
      };
    }

    if (actualSpendingWants > budgetLimitWants) {
      const overAmount = actualSpendingWants - budgetLimitWants;
      return {
        tip: language === 'id' 
          ? `Aduh! Jajanan harianmu (keinginan & gaya hidup) sudah over budget sebesar Rp ${overAmount.toLocaleString('id-ID')}. Disarankan untuk membatasi self-reward minggu ini ya! 🧘`
          : `Aww! Your daily spending (wants & lifestyle) is over budget by Rp ${overAmount.toLocaleString('id-ID')}. It is highly recommended to limit self-rewards this week! 🧘`,
        highlightName: t("Keinginan Over budget", "Wants Overbudgeted"),
        highlightDesc: language === 'id'
          ? `Kamu telah membelanjakan ${percentWantsUsed.toFixed(0)}% dari batas jatah gaya hidup bulanan.`
          : `You have spent ${percentWantsUsed.toFixed(0)}% of your monthly lifestyle allocation limit.`
      };
    }

    if (actualSpendingNeeds > budgetLimitNeeds) {
      return {
        tip: t("Pengeluaran kebutuhan wajib bulananmu agak bengkak nih. Periksa kembali tagihan rutin atau biaya sewa untuk efisiensi tagihan berikutnya 📄.", "Your monthly essential needs spending is a bit bloated. Double check routine bills or rent costs for better efficiency next time 📄."),
        highlightName: t("Evaluasi Pos Wajib", "Evaluate Essential category"),
        highlightDesc: language === 'id'
          ? `Kebutuhan vital menyerap ${percentNeedsUsed.toFixed(0)}% dari batas anggaran dasar.`
          : `Vital needs have absorbed ${percentNeedsUsed.toFixed(0)}% of the basic budget allocation.`
      };
    }

    const categoryTranslations: { [key: string]: string } = {
      "Kebutuhan Pokok": t("Kebutuhan Pokok", "Needs"),
      "Transportasi": t("Transportasi", "Transportation"),
      "Hiburan": t("Hiburan", "Entertainment"),
      "Makan & Minum": t("Makan & Minum", "Food & Dining"),
      "Kesehatan": t("Kesehatan", "Healthcare"),
      "Pendidikan": t("Pendidikan", "Education"),
      "Tagihan": t("Tagihan", "Bills & Utilities"),
      "Belanja": t("Belanja", "Shopping"),
      "Lainnya": t("Lainnya", "Others")
    };

    const topCat = categoriesList[0];
    const topCatNameTranslated = topCat ? (categoryTranslations[topCat.name] || topCat.name) : "";
    return {
      tip: language === 'id'
        ? `Kondisi kas terkontrol aman! Pengeluaran terbesarmu saat ini ada di pos "${topCatNameTranslated}" sebesar Rp ${topCat?.value.toLocaleString('id-ID')}. Pertahankan ritme belanja terkendali seperti ini! 📊`
        : `Financial status is safely controlled! Your largest expense right now is on "${topCatNameTranslated}" with a total of Rp ${topCat?.value.toLocaleString('id-ID')}. Keep up this well-managed spending rate! 📊`,
      highlightName: t("Kas Sehat Terkendali", "Healthy Controlled Cash"),
      highlightDesc: language === 'id'
        ? `Penyerapan terbesar pada ${topCatNameTranslated} (${topCat?.percent} dari total pengeluaran).`
        : `Highest absorption on ${topCatNameTranslated} (${topCat?.percent} of total expenses).`
    };
  };

  const insight = generateInsight();
  const isEmpty = activeTab === 'pengeluaran' ? totalSemua === 0 : totalPemasukanSemua === 0;

  return (
    <div className="analysis-page w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4 md:pt-6 pb-24 overflow-x-hidden flex flex-col gap-4 lg:gap-6">
      <style>
        {`
          .text-fix {
            word-break: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      
      {/* 1. Header */}
      <header className="w-full">
        <div className="analysis-header mb-2">
          <div className="analysis-heading-row">
            <div className="analysis-heading-icon bg-[#112F58] text-white rounded-xl shadow-sm">
              <PieChart size={21} />
            </div>
            <h1 
              className="analysis-page-title fw-800 font-bold mb-0" 
              style={{ color: darkMode ? '#ffffff' : '#112F58' }}
            >
              {t('Analisa Keuangan Cerdas', 'Smart Financial Analysis')}
            </h1>
          </div>
          <p className="analysis-page-subtitle text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-0">
            {t('Alat alokasi real-time perbandingan pengeluaran & pemasukan dengan Target Alokasi 50/30/20.', 'Real-time tool comparing your spending & earnings against the 50/30/20 Ideal Budget allocation.')}
          </p>
        </div>
      </header>

      {/* 2. Grid Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-6 w-full">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-4 flex flex-col gap-4 order-1">
          
          {/* KOTAK SARAN AI */}
          <motion.div 
            style={{ 
              backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
              borderRadius: '20px', 
              padding: 'clamp(14px, 4vw, 20px)', 
              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div 
              className="d-flex justify-content-between align-items-center cursor-pointer select-none"
              onClick={() => setIsAiAdviceExpanded(!isAiAdviceExpanded)}
              role="button"
              tabIndex={0}
            >
              <div className="analysis-advisor-title d-flex align-items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">🤖</span>
                <h2 className="font-bold text-base sm:text-lg md:text-xl m-0 leading-tight" style={{ color: darkMode ? '#ffffff' : '#112F58' }}>
                  {language === 'id' ? 'Saran AI Advisor' : 'AI Advisor Suggestion'}
                </h2>
              </div>
              <div className="d-flex align-items-center gap-1.5 shrink-0 ms-2">
                <span className="whitespace-nowrap text-[10px] sm:text-xs font-bold tracking-wide uppercase bg-amber-500/90 text-[#112F58] px-2.5 py-1 rounded-full">
                  {t('LIVE', 'LIVE')}
                </span>
                <div className="text-slate-500 dark:text-slate-400">
                  {isAiAdviceExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {isAiAdviceExpanded && (
              <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                <p 
                  className="text-sm md:text-base leading-relaxed mb-4 whitespace-pre-wrap"
                  style={{ color: darkMode ? '#f8fafc' : '#334155' }} 
                >
                  {!isEmpty ? (
                    activeTab === 'pengeluaran' 
                      ? insight.tip 
                      : incomeInsight.tip
                  ) : (
                    language === 'id' ? 'Catat data pertamamu agar AI bisa mulai bekerja!' : 'Record your first data to activate AI!'
                  )}
                </p>

                {!isEmpty && (
                  <div 
                    className="p-3.5 rounded-xl mt-auto"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(17,47,88,0.03)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(17,47,88,0.1)' 
                    }}
                  >
                    <div 
                      className="text-xs font-bold tracking-wider uppercase mb-1"
                      style={{ color: darkMode ? '#94a3b8' : '#64748b' }} 
                    >
                      {activeTab === 'pengeluaran' ? t('DETEKSI & POIN UTAMA', 'HIGHLIGHTS') : t('PILAR UTAMA', 'MAIN PILLAR')}
                    </div>
                    <div 
                      className="font-extrabold text-sm sm:text-base mb-1"
                      style={{ color: darkMode ? '#ffffff' : '#112F58' }} 
                    >
                      {activeTab === 'pengeluaran' ? insight.highlightName : incomeInsight.highlightName}
                    </div>
                    <p 
                      className="text-xs sm:text-sm m-0 leading-relaxed"
                      style={{ color: darkMode ? '#cbd5e1' : '#475569' }} 
                    >
                      {activeTab === 'pengeluaran' ? insight.highlightDesc : incomeInsight.highlightDesc}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* TAB SWITCHER */}
          <div 
            className="p-1.5 rounded-2xl flex shadow-sm w-full mt-1"
            style={{ 
              backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' 
            }}
          >
            <button
              onClick={() => setActiveTab('pengeluaran')}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center transition-all border-0 cursor-pointer"
              style={{
                backgroundColor: activeTab === 'pengeluaran' ? '#112F58' : 'transparent',
                color: activeTab === 'pengeluaran' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                boxShadow: activeTab === 'pengeluaran' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              {language === 'id' ? 'Pengeluaran' : 'Expenses'}
            </button>
            <button
              onClick={() => setActiveTab('pemasukan')}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center transition-all border-0 cursor-pointer"
              style={{
                backgroundColor: activeTab === 'pemasukan' ? '#112F58' : 'transparent',
                color: activeTab === 'pemasukan' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                boxShadow: activeTab === 'pemasukan' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              {language === 'id' ? 'Pemasukan' : 'Income'}
            </button>
          </div>

        </div>

        {/* KOLOM KANAN */}
        <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6 order-2">
          
          {isEmpty ? (
            <div className="text-center py-10 px-4 w-full h-full flex items-center justify-center">
              <motion.div 
                className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 shadow-sm w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                  <AlertCircle size={48} className="text-amber-500" />
                </div>
                <h2 
                  className="font-extrabold text-xl md:text-2xl mb-2"
                  style={{ color: darkMode ? '#ffffff' : '#112F58' }}
                >
                  {t('Data Masih Kosong', 'Data is Empty')}
                </h2>
                <p 
                  className="text-sm md:text-base max-w-sm mx-auto leading-relaxed"
                  style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
                >
                  {t('Laporan visual ini akan langsung terisi begitu kamu mencatat transaksi pertamamu.', 'This visual report will load instantly once you record your first transaction.')}
                </p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* KARTU GRAFIK RINCIAN */}
              <motion.div 
                className="bg-white rounded-[20px] p-4 sm:p-6 shadow-sm border border-slate-200"
                style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="analysis-card-heading d-flex justify-content-between align-items-start gap-3 mb-4 sm:mb-5 border-b border-slate-200 pb-3">
                   <h2 
                     className="fw-extrabold font-bold text-lg sm:text-2xl mb-0 leading-tight min-w-0"
                     style={{ color: darkMode ? '#ffffff' : '#112F58' }}
                   >
                     {activeTab === 'pengeluaran' ? t('Rincian Pengeluaran', 'Spending Details') : t('Rincian Pemasukan', 'Income Details')}
                   </h2>
                   <div className={`d-flex align-items-center gap-1 font-bold whitespace-nowrap shrink-0 text-[10px] sm:text-sm px-2.5 sm:px-3 py-1 rounded-full ${activeTab === 'pengeluaran' ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                     {activeTab === 'pengeluaran' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                     <span>{t('Real-time', 'Real-time')}</span>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full">
                  {/* Donut Chart */}
                  <div className="relative flex justify-center w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] shrink-0">
                    <Doughnut data={activeTab === 'pengeluaran' ? donutData : incomeDonutData} options={donutOptions} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
                      <div 
                        className="font-black text-base sm:text-lg leading-tight"
                        style={{ color: darkMode ? '#ffffff' : '#112F58' }} 
                      >
                        Rp<br/>{(activeTab === 'pengeluaran' ? totalSemua : totalPemasukanSemua).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="w-full flex-1">
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[160px] sm:max-h-[220px] pr-2 no-scrollbar">
                      {(activeTab === 'pengeluaran' ? categoriesList : incomeCategoriesList).map((item, i) => {
                        const labelTranslations: { [key: string]: string } = {
                          "Kebutuhan Pokok": t("Kebutuhan Pokok", "Needs"),
                          "Transportasi": t("Transportasi", "Transportation"),
                          "Hiburan": t("Hiburan", "Entertainment"),
                          "Makan & Minum": t("Makan & Minum", "Food & Dining"),
                          "Kesehatan": t("Kesehatan", "Healthcare"),
                          "Pendidikan": t("Pendidikan", "Education"),
                          "Tagihan": t("Tagihan", "Bills & Utilities"),
                          "Belanja": t("Belanja", "Shopping"),
                          "Lainnya": t("Lainnya", "Others"),
                          "Gaji & Upah": t("Gaji & Upah", "Salary & Wages"),
                          "Bonus & THR": t("Bonus & THR", "Bonus & Allowance"),
                          "Hasil Usaha": t("Hasil Usaha", "Business Profits"),
                          "Investasi": t("Investasi", "Investments"),
                          "Pemberian": t("Pemberian", "Gifts & Grants")
                        };

                        return (
                          <div key={i} className="flex flex-col">
                            <div className="flex items-center justify-between mb-1.5 font-sans">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-xs font-bold shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                                  {item.percent}
                               </span>
                               <span 
                                 className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-[180px]"
                                 style={{ color: '#1e293b' }} 
                               >
                                  {item.icon} {labelTranslations[item.name] || item.name}
                                </span>
                              </div>
                              <span 
                                className="text-xs sm:text-sm font-bold shrink-0"
                                style={{ color: item.color }}
                              >
                                Rp {item.value.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="w-full bg-[#E4E8EF] h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: item.percent, backgroundColor: item.color }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CAROUSEL KARTU PROGRESS */}
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-3 gap-2">
                  <div>
                    <h2 
                      className="fw-extrabold font-bold text-xl sm:text-2xl mb-1"
                      style={{ color: darkMode ? '#ffffff' : '#112F58' }}
                    >
                      {activeTab === 'pengeluaran' ? t('Alokasi Budget 50/30/20', '50/30/20 Budgeting') : t('Rencana Target 50/30/20', '50/30/20 Income Target')}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 m-0">
                      {t("Total Pendapatan Terhitung: Rp ", "Calculated Income Base: Rp ")}
                      {income.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div 
                    className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full shrink-0"
                    style={{ color: '#112F58' }}
                  >
                    {t('Target Ideal', 'Ideal Target')}
                  </div>
                </div>

                {/* WRAPPER CAROUSEL */}
                <div className="flex flex-nowrap md:grid md:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                  
                  {/* Kartu 1: Kebutuhan (Needs) */}
                  <div className="w-[85%] sm:w-auto shrink-0 snap-center p-4 bg-[#112F58]/5 border border-[#112F58]/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span 
                        className="text-xs sm:text-sm font-extrabold block mb-1"
                        style={{ color: darkMode ? '#93c5fd' : '#112F58' }}
                      >
                        🛒 {t('KEBUTUHAN (50%)', 'NEEDS (50%)')}
                      </span>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                        {t('Pokok, Transport, Kesehatan, Pendidikan, Tagihan', 'Groceries, Transport, Health, Education, Bills')}
                      </p>
                    </div>
                    {activeTab === 'pengeluaran' ? (
                      <div className="mt-auto">
                        <div className="text-end mb-1">
                          <span 
                            className="text-sm sm:text-base font-bold block leading-none"
                            style={{ color: darkMode ? '#ffffff' : '#112F58' }}
                          >
                            Rp {actualSpendingNeeds.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-gray-500 block mt-1">Batas: Rp {budgetLimitNeeds.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5 mt-2">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(percentNeedsUsed, 100)}%`,
                              backgroundColor: percentNeedsUsed > 100 ? '#dc2626' : '#112F58'
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-500">Penyerapan</span>
                          <span style={{ color: percentNeedsUsed > 100 ? '#dc2626' : (darkMode ? '#93c5fd' : '#112F58') }}>
                            {percentNeedsUsed.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-white rounded-xl text-center mt-auto border border-gray-100">
                        <span className="text-xs text-gray-400 block">Target Alokasi</span>
                        <span 
                          className="text-sm sm:text-base font-extrabold"
                          style={{ color: darkMode ? '#ffffff' : '#112F58' }}
                        >
                          Rp {budgetLimitNeeds.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Kartu 2: Keinginan (Wants) */}
                  <div className="w-[85%] sm:w-auto shrink-0 snap-center p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-amber-800 block mb-1">🎬 {t('KEINGINAN (30%)', 'WANTS (30%)')}</span>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                        {t('Makan jajan, Hiburan, Belanja, Gaya hidup', 'Dining out, Entertainment, Shopping, Lifestyle')}
                      </p>
                    </div>
                    {activeTab === 'pengeluaran' ? (
                      <div className="mt-auto">
                        <div className="text-end mb-1">
                          <span className="text-sm sm:text-base font-bold text-amber-800 block leading-none">Rp {actualSpendingWants.toLocaleString('id-ID')}</span>
                          <span className="text-xs text-gray-500 block mt-1">Batas: Rp {budgetLimitWants.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5 mt-2">
                          <div className={`h-full rounded-full ${percentWantsUsed > 100 ? 'bg-red-600' : 'bg-amber-600'}`} style={{ width: `${Math.min(percentWantsUsed, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-500">Penyerapan</span>
                          <span className={percentWantsUsed > 100 ? "text-red-600" : "text-amber-800"}>{percentWantsUsed.toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-white rounded-xl text-center mt-auto border border-gray-100">
                        <span className="text-xs text-gray-400 block">Target Alokasi</span>
                        <span className="text-sm sm:text-base font-extrabold text-amber-800">Rp {budgetLimitWants.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>

                  {/* Kartu 3: Tabungan (Savings) */}
                  <div className="w-[85%] sm:w-auto shrink-0 snap-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-800 block mb-1">💼 {t('TABUNGAN (20%)', 'SAVINGS (20%)')}</span>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                        {t('Dana Darurat, Investasi, Tabungan Impian', 'Emergency Funds, Investments, Goals')}
                      </p>
                    </div>
                    {activeTab === 'pengeluaran' ? (
                      <div className="mt-auto">
                        <div className="text-end mb-1">
                          <span className="text-sm sm:text-base font-bold text-emerald-800 block leading-none">Rp {actualSpendingSavings.toLocaleString('id-ID')}</span>
                          <span className="text-xs text-gray-500 block mt-1">Target Minimum: Rp {budgetLimitSavings.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5 mt-2">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(percentSavingsUsed, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-500">Tercapai</span>
                          <span className="text-emerald-800">{percentSavingsUsed.toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-white rounded-xl text-center mt-auto border border-gray-100">
                        <span className="text-xs text-gray-400 block">Target Alokasi</span>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-800">Rp {budgetLimitSavings.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
