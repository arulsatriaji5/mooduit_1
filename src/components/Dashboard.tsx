import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import {
  Scan,
  Plus,
  MessageSquareText,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Target,
  ArrowUpRight,
  X,
  Send,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Gift,
  Loader2,
} from "lucide-react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { fetchUserStreak, restoreStreak, fetchAiStreakMotivation } from "../utils/api";
import { BirthdayModal, isUserBirthdayToday } from "./BirthdayModal";
import "./Dashboard.css";

interface DashboardProps {
  onNavigate: (page: string) => void;
  saldoDanaDarurat: number;
  transactions?: any[];
  setTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
  isLoading?: boolean;
}

const getDreamTargetName = (target: any) => String(target?.nama || target?.name || "").trim();

const getDreamTargetPrice = (target: any) =>
  Number(String(target?.harga || target?.price || "0").replace(/\D/g, ""));

const getDreamTargetCollected = (target: any, transactionList: any[]) => {
  const targetName = getDreamTargetName(target).toLowerCase();
  if (!targetName) return 0;

  return transactionList
    .filter((transaction) => {
      const category = String(transaction.kategori || transaction.category || "").toLowerCase();
      const note = String(transaction.catatan || transaction.description || "").toLowerCase();
      return (category === "target impian" || category === "tabungan") && note.includes(targetName);
    })
    .reduce((sum, transaction) => sum + (Number(transaction.nominal || transaction.amount) || 0), 0);
};

const DAILY_WELCOME_MESSAGES = [
  {
    id: "Semangat, {name}! Hari ini adalah kesempatan baru untuk membuat keputusan keuangan yang lebih baik. 🌤️",
    en: "Keep it up, {name}! Today is a fresh chance to make better financial decisions. 🌤️",
  },
  {
    id: "Halo, {name}! Sedikit lebih hemat hari ini bisa membawa kamu lebih dekat ke tujuan impian. 🎯",
    en: "Hi, {name}! Saving a little more today can bring you closer to your dream goal. 🎯",
  },
  {
    id: "Kamu hebat, {name}! Catat transaksi hari ini agar dompet tetap terarah dan tenang. ✨",
    en: "You're doing great, {name}! Log today's transactions to keep your finances clear and calm. ✨",
  },
  {
    id: "Selamat datang kembali, {name}! Yuk jaga keseimbangan antara kebutuhan, keinginan, dan tabungan. ⚖️",
    en: "Welcome back, {name}! Let's balance your needs, wants, and savings. ⚖️",
  },
  {
    id: "Pelan-pelan tetap maju, {name}. Kebiasaan kecil yang konsisten bisa membuat dompet makin sehat. 🌱",
    en: "Small steps still move you forward, {name}. Consistent habits can build healthier finances. 🌱",
  },
  {
    id: "Hari yang bagus untuk lebih bijak, {name}! Cek dulu kebutuhan sebelum belanja, ya. 🛍️",
    en: "It's a great day to spend wisely, {name}! Check what you need before buying. 🛍️",
  },
  {
    id: "Selamat menjalani hari, {name}! Sisihkan sedikit untuk masa depan sebelum menikmati sisanya. 💰",
    en: "Have a wonderful day, {name}! Set something aside for the future before enjoying the rest. 💰",
  },
  {
    id: "Ayo lanjutkan progresmu, {name}! Satu transaksi yang tercatat membuat rencana makin akurat. 📝",
    en: "Keep your progress going, {name}! Every logged transaction makes your plan more accurate. 📝",
  },
  {
    id: "Dompet yang sehat dimulai dari keputusan sederhana, {name}. Kamu pasti bisa! 💪",
    en: "Healthy finances start with simple decisions, {name}. You've got this! 💪",
  },
  {
    id: "Halo, {name}! Rayakan progres kecilmu dan tetap fokus pada tujuan besar. 🚀",
    en: "Hi, {name}! Celebrate your small wins and stay focused on the bigger goal. 🚀",
  },
  {
    id: "Hari ini, pilih satu kebiasaan baik untuk dompetmu, {name}. Mulai dari yang paling mudah. 🌟",
    en: "Choose one good money habit today, {name}. Start with the easiest one. 🌟",
  },
  {
    id: "Tetap tenang dan terarah, {name}. Keuangan yang rapi dibangun satu hari demi satu hari. 🧭",
    en: "Stay calm and focused, {name}. Organized finances are built one day at a time. 🧭",
  },
  {
    id: "Semoga harimu menyenangkan, {name}! Jangan lupa beri ruang untuk menabung dan bersenang-senang. 😊",
    en: "Hope you have a lovely day, {name}! Make room for both saving and enjoying life. 😊",
  },
  {
    id: "Konsisten lebih penting daripada sempurna, {name}. Lanjutkan langkah baikmu hari ini! 🔥",
    en: "Consistency matters more than perfection, {name}. Keep your good momentum today! 🔥",
  },
] as const;

const getDailyWelcomeMessage = (language: "id" | "en", userName: string) => {
  const today = new Date();
  const dayNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000,
  );
  const message = DAILY_WELCOME_MESSAGES[dayNumber % DAILY_WELCOME_MESSAGES.length];

  return message[language].replace("{name}", userName);
};

export default function Dashboard({
  onNavigate,
  saldoDanaDarurat,
  transactions: propsTransactions,
  setTransactions: propsSetTransactions,
  isLoading = false,
}: DashboardProps) {
  const { t, language, theme } = useThemeLanguage();
  const darkMode = theme === "dark";
  const [showBalance, setShowBalance] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mooduit_balance_visibility");
      return saved === "true";
    }
    return false;
  });
  const [userName, setUserName] = React.useState("Sobat Cuan");
  const [userDob, setUserDob] = React.useState<string>(() => localStorage.getItem("userDob") || "");
  const [showBirthdayModal, setShowBirthdayModal] = React.useState<boolean>(false);
  const [budgetsData, setBudgetsData] = React.useState<any[]>([]);

  // Check URL Deep Link for ?surprise=true or ?birthday=true on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDob = localStorage.getItem("userDob") || "";
      if (storedDob) setUserDob(storedDob);

      const params = new URLSearchParams(window.location.search);
      const isSurpriseDeepLink = params.get("surprise") === "true" || params.get("birthday") === "true";

      if (isSurpriseDeepLink) {
        setShowBirthdayModal(true);
        // Clean up URL query params smoothly without reloading page
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Keep the birthday indicator in sync after the date of birth is edited in
  // Settings, across tabs, and after returning to the Dashboard.
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const applyStoredDob = (event?: Event) => {
      const eventDob = (event as CustomEvent<{ dob?: string }> | undefined)?.detail?.dob;
      const latestDob = eventDob || localStorage.getItem("userDob") || "";
      setUserDob(latestDob);
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "userDob" || event.key === "mooduit_user" || event.key === "mooduit_session") {
        applyStoredDob();
      }
    };

    applyStoredDob();
    window.addEventListener("profileUpdated", applyStoredDob as EventListener);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", applyStoredDob);

    const userEmail = localStorage.getItem("userEmail") || "";
    if (userEmail) {
      fetch(`/api/users/profile?email=${encodeURIComponent(userEmail)}`, { credentials: "include" })
        .then((response) => response.ok ? response.json() : null)
        .then((profile) => {
          if (profile?.dob) {
            localStorage.setItem("userDob", String(profile.dob));
            setUserDob(String(profile.dob));
          }
        })
        .catch((error) => console.warn("Failed to refresh birthday profile:", error));
    }

    return () => {
      window.removeEventListener("profileUpdated", applyStoredDob as EventListener);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", applyStoredDob);
    };
  }, []);

  // Daily Streak and Celebration Pop-up States
  const [streakCount, setStreakCount] = React.useState<number>(0);
  const [streakActive, setStreakActive] = React.useState<boolean>(false);
  const [showCelebration, setShowCelebration] = React.useState<boolean>(false);
  const [quoteIndex, setQuoteIndex] = React.useState<number>(0);
  const [streakIncreasedToday, setStreakIncreasedToday] = React.useState<boolean>(true);

  // AI Real-Time Motivation states
  const [isMotivationLoading, setIsMotivationLoading] = React.useState<boolean>(false);
  const [aiMotivationText, setAiMotivationText] = React.useState<string>("");

  const motivationQuotes = React.useMemo(() => [
    {
      id: "Keren banget! Setiap koin yang kamu catat hari ini mendekatkanmu ke kebebasan finansial. Streak kamu menyala! 🔥",
      en: "Super cool! Every coin you log today brings you closer to financial freedom. Your streak is glowing! 🔥"
    },
    {
      id: "Satu langkah kecil untuk dompetmu, satu lompatan besar menuju bebas finansial! Pertahankan apimu! 🚀",
      en: "One small step for your wallet, one giant leap towards financial freedom! Keep your fire burning! 🚀"
    },
    {
      id: "Konsistensi adalah kunci! Catat terus pengeluaranmu dan jadilah tuan atas uangmu sendiri. 💪",
      en: "Consistency is key! Keep logging your expenses and master your own money. 💪"
    },
    {
      id: "Mantap! Kebiasaan baik sudah mulai terbentuk. Jangan biarkan apinya padam besok ya! ✨",
      en: "Awesome! Good habits are forming. Don't let the fire go out tomorrow! ✨"
    },
    {
      id: "Disiplin hari ini, foya-foya terencana besok! Keren, kamu berhasil menjaga streak-mu hari ini. 🎯",
      en: "Disciplined today, planned fun tomorrow! Great job keeping your streak alive today. 🎯"
    }
  ], []);

  const generateStreakMotivation = React.useCallback(async (txContext?: { type?: string; amount?: number; category?: string }) => {
    setIsMotivationLoading(true);
    setAiMotivationText("");
    try {
      const text = await fetchAiStreakMotivation({
        type: txContext?.type,
        amount: txContext?.amount,
        category: txContext?.category,
        language: language
      });
      setAiMotivationText(text);
    } catch (err) {
      console.error("Failed to generate AI motivation:", err);
      setAiMotivationText(
        language === "en"
          ? "Super cool! Every coin you log today brings you closer to financial freedom. Your streak is glowing! 🔥"
          : "Keren banget! Setiap koin yang kamu catat hari ini mendekatkanmu ke kebebasan finansial. Streak kamu menyala! 🔥"
      );
    } finally {
      setIsMotivationLoading(false);
    }
  }, [language]);

  React.useEffect(() => {
    if (showCelebration) {
      const randomIndex = Math.floor(Math.random() * motivationQuotes.length);
      setQuoteIndex(randomIndex);
    }
  }, [showCelebration, motivationQuotes]);
  const [lostStreak, setLostStreak] = React.useState<number>(0);
  const [restoreCount, setRestoreCount] = React.useState<number>(0);
  const [isRestoring, setIsRestoring] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const triggerFn = (apiStreak?: number, apiIncreased?: boolean, txContext?: { type?: string; amount?: number; category?: string }) => {
        setStreakCount((prev) => {
          let finalStreak = 1;
          if (typeof apiStreak === "number" && apiStreak > 0) {
            finalStreak = apiStreak;
          } else if (prev > 0) {
            finalStreak = prev;
          }
          return finalStreak;
        });

        // KUNCI ANTI-SPAM POPUP
        const todayDate = new Date().toISOString().split('T')[0];
        const lastPopupDate = localStorage.getItem("mooduit_last_streak_popup");

        if (lastPopupDate !== todayDate) {
          setStreakActive(true);
          setStreakIncreasedToday(true);
          setShowCelebration(true);
          generateStreakMotivation(txContext);
          localStorage.setItem("mooduit_last_streak_popup", todayDate);
        } else {
          // Jika hari ini sudah pernah muncul pop-up, HANYA nyalakan apinya di background (JANGAN TAMPILKAN POP-UP)
          setStreakActive(true);
        }

        const email = localStorage.getItem("userEmail") || "";
        if (email) {
          fetchUserStreak(email).then((s) => {
            const fetched = Number(s.current_streak || s.streakCount) || 1;
            setStreakCount((prev) => Math.max(prev, fetched > 0 ? fetched : 1));
            setStreakActive(true);
            setLostStreak(s.lost_streak || 0);
            setRestoreCount(s.restore_count || 0);
          });
        }
      };

      (window as any).triggerTransactionSuccess = triggerFn;
      (window as any).showStreakCelebration = (txContext?: any) => {
        setStreakIncreasedToday(true);
        setShowCelebration(true);
        generateStreakMotivation(txContext);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).triggerTransactionSuccess;
        delete (window as any).showStreakCelebration;
      }
    };
  }, [generateStreakMotivation, streakActive]);

  const handleRestoreStreak = async () => {
    if (isRestoring) return;
    const email = localStorage.getItem("userEmail") || "";
    if (!email) {
      toast.error(t("Silakan login terlebih dahulu!", "Please login first!"));
      return;
    }
    setIsRestoring(true);
    try {
      const res = await restoreStreak(email);
      if (res.success) {
        toast.success(res.message || t("Streak berhasil dipulihkan! 🔥", "Streak restored successfully! 🔥"));
        setStreakCount(res.data.current_streak || res.data.streakCount);
        setStreakActive(true);
        setLostStreak(0);
        setRestoreCount(res.data.restore_count);
      } else {
        toast.error(res.error || t("Gagal memulihkan streak", "Failed to restore streak"));
      }
    } catch (err: any) {
      toast.error(err.message || t("Terjadi kesalahan jaringan", "Network error occurred"));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  const dailyQuotes = React.useMemo(() => [
    {
      id: "Setiap koin yang kamu simpan hari ini adalah pondasi kebebasan finansialmu di masa depan. Selangkah demi selangkah menuju impian!",
      en: "Every coin you save today is the foundation of your financial freedom in the future. Step by step toward your dreams!"
    },
    {
      id: "Jangan habiskan sisa uang setelah belanja, tapi belanjakan sisa uang setelah menabung. Kebiasaan kecil melahirkan hasil besar!",
      en: "Do not save what is left after spending, but spend what is left after saving. Small habits breed great results!"
    },
    {
      id: "Investasi terbaik adalah investasi pada diri sendiri dan masa depan finansialmu. Tetap bijak dalam setiap keputusan belanja!",
      en: "The best investment is in yourself and your financial future. Stay wise in every spending decision!"
    },
    {
      id: "Kedisiplinan finansial mengalahkan impulsivitas sesaat. Mari kendalikan anggaranmu dan jadilah tuan atas keuanganmu sendiri!",
      en: "Financial discipline beats momentary impulsiveness. Let's control your budget and be the master of your own money!"
    },
    {
      id: "Ingat, kemakmuran tidak diukur dari seberapa banyak kamu membelanjakan, melainkan seberapa banyak kamu mengamankan.",
      en: "Remember, prosperity is not measured by how much you spend, but by how much you secure."
    },
    {
      id: "Mulailah hari ini dengan komitmen baru: kurangi pengeluaran yang tak perlu dan tingkatkan kantong tabunganmu!",
      en: "Start today with a new commitment: cut unnecessary expenses and boost your savings pockets!"
    },
    {
      id: "Uang adalah alat yang luar biasa jika kamu yang mengendalikannya. Rencanakan pengeluaranmu dan capai tujuan hidupmu!",
      en: "Money is an incredible tool if you control it. Plan your spending and achieve your life goals!"
    }
  ], []);

  const currentDailyQuote = React.useMemo(() => {
    const day = new Date().getDate();
    const index = day % dailyQuotes.length;
    return dailyQuotes[index];
  }, [dailyQuotes]);

  const [aiInsight, setAiInsight] = React.useState<string>(
    "Menganalisa dompetmu...",
  );
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [messages, setMessages] = React.useState<
    { 
      text: string; 
      isAi: boolean; 
      isTransactionSuccess?: boolean; 
      transactionDetails?: { 
        type: string; 
        amount: number; 
        category: string; 
        notes: string; 
      };
    }[]
  >([]);
  const [isTyping, setIsTyping] = React.useState(false);

  const [isListening, setIsListening] = React.useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = React.useState<number | null>(null);
  const [isVoiceInteraction, setIsVoiceInteraction] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      const welcome = language === "id"
        ? "Halo Sobat Cuan! 👋 Aku Asisten AI MOODUIT. Kamu bisa tanya tips keuangan, konsultasikan rencana belanja, atau langsung ucapkan transaksi untuk dicatat (misal: 'Beli kopi 25rb tadi siang')! 🎙️"
        : "Hello Sobat Cuan! 👋 I'm MOODUIT AI Advisor. Ask financial tips, consult shopping plans, or speak transactions to log them (e.g., 'Spent 25k on coffee')! 🎙️";
      setMessages([{ text: welcome, isAi: true }]);
    }
  }, [isChatOpen, messages.length, language]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        language === "id"
          ? "Fitur input suara tidak didukung di browser ini. Gunakan Chrome, Edge, atau Safari!"
          : "Speech recognition is not supported in this browser."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "id" ? "id-ID" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput((prev) => (prev ? prev + " " + transcript : transcript));
          setIsVoiceInteraction(true); 
          toast.success(
            language === "id" ? "Suara berhasil ditranskrip! 🎙️" : "Voice transcribed! 🎙️"
          );
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error(
            language === "id"
              ? "Gagal merekam suara. Pastikan izin mikrofon telah aktif!"
              : "Failed to record voice. Check microphone permissions."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error("SpeechRecognition error:", e);
      setIsListening(false);
      toast.error(
        language === "id"
          ? "Tidak dapat mengakses mikrofon!"
          : "Cannot access microphone!"
      );
    }
  };

  const speakMessage = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) {
      toast.error(
        language === "id"
          ? "Browser Anda tidak mendukung fitur pembaca suara (Text-to-Speech)."
          : "Your browser does not support Text-to-Speech."
      );
      return;
    }

    if (speakingMsgIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMsgIndex(index);

    const cleanText = text
      .replace(/<[^>]*>/g, "")
      .replace(/\*+/g, "")
      .replace(/#+/g, "")
      .replace(/`+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "id" ? "id-ID" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    try {
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.toLowerCase().includes("id") || v.lang.toLowerCase().includes("indonesia")
      );
      if (idVoice) utterance.voice = idVoice;
    } catch (_) {}

    utterance.onend = () => {
      setSpeakingMsgIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const [wishlist, setWishlist] = React.useState<any[]>([]);
  const [targetImpian, setTargetImpian] = React.useState<any[]>([]);
  const [isTargetModalOpen, setIsTargetModalOpen] = React.useState(false);
  const [newTargetName, setNewTargetName] = React.useState("");
  const [newTargetPrice, setNewTargetPrice] = React.useState("");
  
  const [isCelebrationOpen, setIsCelebrationOpen] = React.useState(false);
  const [selectedTargetForCelebration, setSelectedTargetForCelebration] = React.useState<any>(null);
  const [isCompletingTarget, setIsCompletingTarget] = React.useState(false);

  const [isNyicilModalOpen, setIsNyicilModalOpen] = React.useState(false);
  const [selectedTargetForNyicil, setSelectedTargetForNyicil] = React.useState<any>(null);
  const [nyicilNominal, setNyicilNominal] = React.useState("");
  const [isSavingInstallment, setIsSavingInstallment] = React.useState(false);

  const [localTransactions, setLocalTransactions] = React.useState<any[]>([]);
  const transactions =
    propsTransactions !== undefined ? propsTransactions : localTransactions;
  const setTransactions =
    propsSetTransactions !== undefined
      ? propsSetTransactions
      : setLocalTransactions;

  React.useEffect(() => {
    if (isCelebrationOpen || selectedTargetForCelebration) return;

    const completedTarget = targetImpian.find((target) => {
      const targetPrice = getDreamTargetPrice(target);
      return targetPrice > 0 && getDreamTargetCollected(target, transactions) >= targetPrice;
    });

    if (completedTarget) {
      setSelectedTargetForCelebration(completedTarget);
      setIsCelebrationOpen(true);
    }
  }, [targetImpian, transactions, isCelebrationOpen, selectedTargetForCelebration]);

  const handleCompleteTarget = async () => {
    if (!selectedTargetForCelebration) return;
    const target = selectedTargetForCelebration;
    const targetId = String(target.id);
    const updatedWishlist = wishlist.filter((item) => String(item.id) !== targetId);
    const userEmail = localStorage.getItem("userEmail") || "";

    setIsCompletingTarget(true);
    try {
      if (userEmail) {
        const { deleteGoal } = await import("../utils/api");
        const isDeleted = await deleteGoal(userEmail, targetId);
        if (!isDeleted) {
          toast.error(
            t(
              "Target belum berhasil dipindahkan dari daftar. Coba tekan tombol sekali lagi.",
              "The target could not be removed yet. Please try the button again.",
            ),
          );
          return;
        }
      }

      setWishlist(updatedWishlist);
      setTargetImpian(updatedWishlist);
      setIsCelebrationOpen(false);
      setSelectedTargetForCelebration(null);

      toast.success(
        t(
          "Target selesai dan sudah dipindahkan dari daftar. Transaksi tetap tersimpan di Riwayat. 🎉",
          "Target completed and removed from the list. The transaction remains in History. 🎉",
        ),
      );
    } catch (error) {
      console.error("Failed to complete dream target:", error);
      toast.error(t("Target gagal diselesaikan. Coba lagi.", "Target could not be completed. Please try again."));
    } finally {
      setIsCompletingTarget(false);
    }
  };

  const handleSetorNyicil = async () => {
    if (isSavingInstallment) return;
    if (!selectedTargetForNyicil) return;
    const cleanAmount = Number(nyicilNominal.replace(/\D/g, ""));
    const isId = language === "id";

    if (!cleanAmount || cleanAmount <= 0) {
      toast.error(isId ? "Masukkan nominal cicilan yang valid!" : "Enter a valid installment amount!");
      return;
    }

    const targetName = getDreamTargetName(selectedTargetForNyicil);
    const targetPrice = getDreamTargetPrice(selectedTargetForNyicil);
    const collectedBefore = getDreamTargetCollected(selectedTargetForNyicil, transactions);
    const remainingAmount = Math.max(0, targetPrice - collectedBefore);

    if (targetPrice <= 0) {
      toast.error(isId ? "Harga target tidak valid. Silakan edit target terlebih dahulu." : "The target price is invalid. Please edit it first.");
      return;
    }

    if (remainingAmount === 0) {
      setIsNyicilModalOpen(false);
      setSelectedTargetForCelebration(selectedTargetForNyicil);
      setIsCelebrationOpen(true);
      return;
    }

    if (cleanAmount > remainingAmount) {
      toast.error(
        isId
          ? `Cicilan maksimal Rp ${remainingAmount.toLocaleString("id-ID")} sesuai sisa target.`
          : `The maximum installment is Rp ${remainingAmount.toLocaleString("id-ID")}, matching the remaining target.`,
      );
      return;
    }

    if (totalSaldo < cleanAmount) {
      toast.error(isId ? "Saldo kas tidak cukup untuk alokasi cicilan ini!" : "Insufficient cash balance for this installment!");
      return;
    }

    const newTx = {
      id: "nyicil_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      nominal: cleanAmount,
      jenis: "pengeluaran" as const,
      kategori: "Target Impian",
      catatan: `Cicilan Impian: ${targetName}`,
      tanggal: new Date().toISOString().split('T')[0],
      icon: "🎯"
    };

    setIsSavingInstallment(true);
    try {
      if (propsSetTransactions && typeof propsSetTransactions === "function") {
        const { insertTransaction } = await import("../utils/api");
        const user_email = localStorage.getItem("userEmail") || "";
        const insertedTx = await insertTransaction(newTx, user_email);
        propsSetTransactions(prev => [insertedTx, ...prev]);
        if (typeof window !== "undefined" && (window as any).triggerTransactionSuccess) {
          (window as any).triggerTransactionSuccess(insertedTx.currentStreak, insertedTx.streakIncreasedToday, {
            type: 'expense',
            amount: cleanAmount,
            category: 'Target Impian'
          });
        }
      } else {
        setLocalTransactions(prev => [newTx, ...prev]);
        if (typeof window !== "undefined" && (window as any).triggerTransactionSuccess) {
          (window as any).triggerTransactionSuccess(undefined, undefined, {
            type: 'expense',
            amount: cleanAmount,
            category: 'Target Impian'
          });
        }
      }
    } catch (err) {
      console.error("Failed to insert nyicil transaction:", err);
      toast.error(isId ? "Cicilan gagal disimpan. Silakan coba lagi." : "The installment could not be saved. Please try again.");
      return;
    } finally {
      setIsSavingInstallment(false);
    }

    setIsNyicilModalOpen(false);
    setSelectedTargetForNyicil(null);
    setNyicilNominal("");

    const collectedAfter = collectedBefore + cleanAmount;
    if (collectedAfter >= targetPrice) {
      setSelectedTargetForCelebration(selectedTargetForNyicil);
      setIsCelebrationOpen(true);
      return;
    }

    toast.success(
      isId
        ? `Berhasil menyisihkan Rp ${cleanAmount.toLocaleString("id-ID")} untuk ${targetName}. Sisa target Rp ${(targetPrice - collectedAfter).toLocaleString("id-ID")}! 🚀`
        : `Successfully saved Rp ${cleanAmount.toLocaleString("id-ID")} for ${targetName}. Rp ${(targetPrice - collectedAfter).toLocaleString("id-ID")} remaining! 🚀`,
    );
  };

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editTargetId, setEditTargetId] = React.useState<string | null>(null);
  const [editNama, setEditNama] = React.useState("");
  const [editHarga, setEditHarga] = React.useState("");
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  const savingsPockets = React.useMemo(() => {
    let darurat = 0;
    let investasi = 0;
    let tabungan = 0;

    transactions.forEach((tx) => {
      const note = String(tx.catatan || tx.description || "").toLowerCase();
      if (
        note === "alokasi dana darurat" || 
        note.includes("alokasi kantong dana darurat") || 
        note.includes("emergency fund")
      ) {
        darurat += (Number(tx.nominal || tx.amount) || 0);
      } else if (
        note === "alokasi investasi" || 
        note.includes("alokasi kantong investasi") || 
        note.includes("investment")
      ) {
        investasi += (Number(tx.nominal || tx.amount) || 0);
      } else if (
        note === "alokasi tabungan" || 
        note.includes("alokasi kantong tabungan") || 
        note.includes("alokasi kantong goal savings") || 
        note.includes("savings")
      ) {
        tabungan += (Number(tx.nominal || tx.amount) || 0);
      }
    });

    return { darurat, investasi, tabungan };
  }, [transactions]);

  const [pocketInputs, setPocketInputs] = React.useState<{ [key: string]: string }>({
    darurat: "",
    investasi: "",
    tabungan: "",
  });

  const [showCustomInput, setShowCustomInput] = React.useState<{ [key: string]: boolean }>({
    darurat: false,
    investasi: false,
    tabungan: false,
  });

  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0 });
  const startCoords = React.useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleAlokasiTabungan = async (jenisKantong: "darurat" | "investasi" | "tabungan", nominal: number) => {
    const isId = language === "id";
    if (nominal <= 0 || isNaN(nominal)) {
      toast.error(isId ? "Masukkan nominal yang valid!" : "Enter a valid amount!");
      return;
    }
    if (totalSaldo < nominal) {
      toast.error(isId ? "Saldo kas tidak cukup untuk dialokasikan!" : "Insufficient cash balance for allocation!");
      return;
    }

    let deskripsi = "";
    if (jenisKantong === 'darurat') deskripsi = "Alokasi Dana Darurat";
    if (jenisKantong === 'investasi') deskripsi = "Alokasi Investasi";
    if (jenisKantong === 'tabungan') deskripsi = "Alokasi Tabungan";

    const newTx = {
      id: "pocket_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      nominal: nominal,
      jenis: "pengeluaran" as const,
      kategori: 'Tabungan',
      catatan: deskripsi,
      tanggal: new Date().toISOString().split('T')[0]
    };

    try {
      if (propsSetTransactions && typeof propsSetTransactions === "function") {
        const { insertTransaction } = await import("../utils/api");
        const user_email = localStorage.getItem("userEmail") || "";
        const insertedTx = await insertTransaction(newTx, user_email);
        propsSetTransactions(prev => [insertedTx, ...prev]);
      } else {
        setLocalTransactions(prev => [newTx, ...prev]);
      }
    } catch (err) {
      console.error("Failed to insert pocket transaction:", err);
      setLocalTransactions(prev => [newTx, ...prev]);
    }

    toast.success(isId
      ? `Berhasil mengalokasikan Rp ${nominal.toLocaleString('id-ID')} ke kantong ${deskripsi}!`
      : `Successfully allocated Rp ${nominal.toLocaleString('id-ID')} to ${jenisKantong} pocket!`
    );
  };

  const renderQuickAllocate = (key: "darurat" | "investasi" | "tabungan") => {
    const customActive = showCustomInput[key] || false;
    const inputValue = pocketInputs[key] || "";

    const handlePreset = (val: number) => {
      handleAlokasiTabungan(key, val);
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const cleanNum = Number(inputValue.replace(/\D/g, ""));
      if (!cleanNum || cleanNum <= 0) {
        toast.error(language === "id" ? "Masukkan nominal yang valid!" : "Enter a valid amount!");
        return;
      }
      handleAlokasiTabungan(key, cleanNum);
      setPocketInputs(prev => ({ ...prev, [key]: "" }));
      setShowCustomInput(prev => ({ ...prev, [key]: false }));
    };

    return (
      <div className="mt-2">
        <div className="text-xs sm:text-sm text-muted font-bold mb-2">
          🚀 {t("Alokasi Cepat", "Quick Allocate")}
        </div>
        <div className="d-flex flex-wrap gap-1.5 mb-2">
          <button
            type="button"
            className="btn btn-sm py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-primary-mooduit rounded-full border-0 font-bold text-xs sm:text-sm cursor-pointer transition-all"
            onClick={() => handlePreset(25000)}
          >
            +25k
          </button>
          <button
            type="button"
            className="btn btn-sm py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-primary-mooduit rounded-full border-0 font-bold text-xs sm:text-sm cursor-pointer transition-all"
            onClick={() => handlePreset(100000)}
          >
            +100k
          </button>
          <button
            type="button"
            className="btn btn-sm py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-primary-mooduit rounded-full border-0 font-bold text-xs sm:text-sm cursor-pointer transition-all"
            onClick={() => handlePreset(250000)}
          >
            +250k
          </button>
          <button
            type="button"
            className="btn btn-sm py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-primary-mooduit rounded-full border-0 font-bold text-xs sm:text-sm cursor-pointer transition-all"
            style={{ backgroundColor: customActive ? "#112F58" : "", color: customActive ? "#ffffff" : "" }}
            onClick={() => setShowCustomInput(prev => ({ ...prev, [key]: !prev[key] }))}
          >
            {customActive ? "×" : "+Custom"}
          </button>
        </div>

        <AnimatePresence>
          {customActive && (
            <motion.form
              onSubmit={handleCustomSubmit}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-primary-mooduit border border-end-0 text-xs sm:text-sm font-bold" style={{ background: "#f8f9fa", border: "1px solid #ced4da" }}>Rp</span>
                <input
                  type="text"
                  className="form-control text-xs sm:text-sm"
                  placeholder={t("Nominal", "Amount")}
                  value={inputValue}
                  onChange={(e) => {
                    const formatted = formatInput(e.target.value);
                    setPocketInputs(prev => ({ ...prev, [key]: formatted }));
                  }}
                  style={{ border: "1px solid #ced4da" }}
                />
                <button
                  type="submit"
                  className="btn btn-sm text-white text-xs sm:text-sm font-bold px-3"
                  style={{ border: "none", backgroundColor: "#112F58", borderRadius: "0 8px 8px 0" }}
                >
                  {t("Kirim", "Send")}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    isDragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    const clientX = e.clientX;
    const clientY = e.clientY;
    dragStart.current = { x: clientX - pos.x, y: clientY - pos.y };
    startCoords.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const rawX = clientX - dragStart.current.x;
    const rawY = clientY - dragStart.current.y;

    const buttonWidth = 56;
    const buttonHeight = 56;
    const rightOffset = 20;
    const bottomOffset = isMobile ? 85 : 20;

    const defaultLeft = window.innerWidth - rightOffset - buttonWidth;
    const defaultTop = window.innerHeight - bottomOffset - buttonHeight;

    const minLeft = 10;
    const maxLeft = window.innerWidth - buttonWidth - 10;
    const targetLeft = Math.max(minLeft, Math.min(maxLeft, defaultLeft + rawX));
    const clampedX = targetLeft - defaultLeft;

    const minTop = 10;
    const maxTop = window.innerHeight - buttonHeight - 10;
    const targetTop = Math.max(minTop, Math.min(maxTop, defaultTop + rawY));
    const clampedY = targetTop - defaultTop;

    setPos({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const distance = Math.hypot(
      e.clientX - startCoords.current.x,
      e.clientY - startCoords.current.y,
    );
    if (distance < 6) {
      setIsChatOpen((prev) => !prev);
    }
  };

  const syncWishlistWithDb = async (updatedList: any[]) => {
    const user_email = localStorage.getItem("userEmail") || "";
    if (user_email) {
      try {
        const { syncGoals } = await import("../utils/api");
        await syncGoals(user_email, updatedList);
      } catch (err) {
        console.error("Failed to sync wishlist with DB:", err);
      }
    }
  };

  const formatInput = (val: string) => {
    const rawValue = val.replace(/\D/g, "");
    if (!rawValue) return "";
    return Number(rawValue).toLocaleString("id-ID");
  };

  const handleEditItem = (item: any) => {
    setEditTargetId(String(item.id));
    setEditNama(String(item.nama || item.name || ""));
    setEditHarga(formatInput(String(item.harga || item.price || "")));
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async () => {
    if (editTargetId === null) return;

    const cleanName = editNama.trim();
    const cleanPrice = String(editHarga).replace(/\D/g, "");
    if (!cleanName || !cleanPrice || Number(cleanPrice) <= 0) {
      toast.error(t("Nama dan harga target wajib diisi.", "Target name and price are required."));
      return;
    }

    const previousWishlist = wishlist;
    const currentItem = wishlist.find((item) => String(item.id) === editTargetId);
    if (!currentItem) {
      toast.error(t("Target tidak ditemukan. Silakan muat ulang halaman.", "Target not found. Please reload the page."));
      return;
    }

    // Keep both legacy and current field names synchronized.
    const updatedItem = {
      ...currentItem,
      name: cleanName,
      nama: cleanName,
      price: cleanPrice,
      harga: cleanPrice,
    };
    const updatedWishlist = wishlist.map((item) =>
      String(item.id) === editTargetId ? updatedItem : item,
    );

    setWishlist(updatedWishlist);
    setTargetImpian(updatedWishlist);
    setIsEditModalOpen(false);
    setEditTargetId(null);

    const userEmail = localStorage.getItem("userEmail") || "";
    if (userEmail) {
      const { updateGoal } = await import("../utils/api");
      const isSaved = await updateGoal(userEmail, updatedItem);
      if (!isSaved) {
        setWishlist(previousWishlist);
        setTargetImpian(previousWishlist);
        toast.error(t("Perubahan gagal disimpan. Coba lagi.", "Changes could not be saved. Please try again."));
        return;
      }
    }

    toast.success(t("Target impian berhasil diperbarui.", "Dream target updated successfully."));
  };

  const handleAddTarget = () => {
    if (!newTargetName || !newTargetPrice) return;
    const cleanPrice = newTargetPrice.replace(/\D/g, "");
    const newItem = {
      id: Date.now().toString(),
      name: newTargetName,
      nama: newTargetName,
      price: cleanPrice,
      harga: cleanPrice,
    };
    const updated = [...wishlist, newItem];
    setWishlist(updated);
    setTargetImpian(updated);
    syncWishlistWithDb(updated);
    setNewTargetName("");
    setNewTargetPrice("");
    setIsTargetModalOpen(false);
  };

  const handleDeleteItem = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t("Hapus target impian ini?", "Delete this dream target?"))) {
      return;
    }

    const previousWishlist = wishlist;
    const updatedWishlist = wishlist.filter((item) => String(item.id) !== targetId);
    setWishlist(updatedWishlist);
    setTargetImpian(updatedWishlist);
    setIsEditModalOpen(false);
    setEditTargetId(null);

    const userEmail = localStorage.getItem("userEmail") || "";
    if (userEmail) {
      const { deleteGoal } = await import("../utils/api");
      const isDeleted = await deleteGoal(userEmail, targetId);
      if (!isDeleted) {
        setWishlist(previousWishlist);
        setTargetImpian(previousWishlist);
        toast.error(t("Target gagal dihapus. Coba lagi.", "Target could not be deleted. Please try again."));
        return;
      }
    }

    toast.success(t("Target impian berhasil dihapus.", "Dream target deleted successfully."));
  };

  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
    }

    const user_email = localStorage.getItem("userEmail") || "";
    if (user_email) {
      setIsSyncing(true);
      import("../utils/api").then(({ fetchGoals, fetchBudgetPlan, fetchBudgetPlanCustom }) => {
        fetchGoals(user_email).then((goals) => {
          const mapped = goals.map((item: any) => ({
            ...item,
            id: item.id || Date.now().toString() + Math.random().toString(),
            nama: item.nama || item.name,
            harga: item.harga || item.price,
            name: item.name || item.nama,
            price: item.price || item.harga,
          }));
          setWishlist(mapped);
          setTargetImpian(mapped);
          setIsSyncing(false);
        }).catch((err) => {
          console.error("Error loading goals:", err);
          setIsSyncing(false);
        });

        Promise.all([
          fetchBudgetPlan(user_email),
          fetchBudgetPlanCustom(user_email)
        ]).then(([dbBudget, customBudget]) => {
          const list: any[] = [];
          if (dbBudget && dbBudget.hasilBudget) {
            list.push({
              kategori: "Kebutuhan Pokok (50%)",
              limit: dbBudget.hasilBudget.kebutuhan,
              deskripsi: "Untuk makanan, tagihan, transportasi, dan kebutuhan esensial lainnya."
            });
            list.push({
              kategori: "Jajan / Keinginan (30%)",
              limit: dbBudget.hasilBudget.keinginan,
              deskripsi: "Untuk hiburan, belanja non-primer, kopi, dan rekreasi."
            });
            list.push({
              kategori: "Tabungan / Investasi (20%)",
              limit: dbBudget.hasilBudget.tabungan,
              deskripsi: "Untuk kantong dana darurat, investasi masa depan, dan impian."
            });
          } else if (customBudget) {
            list.push({
              kategori: "Kebutuhan Pokok",
              limit: customBudget.expenses,
              deskripsi: "Anggaran kebutuhan pokok bulanan kustom."
            });
            list.push({
              kategori: "Dana Darurat Target",
              limit: customBudget.emergencyTarget,
              deskripsi: "Target dana darurat kustom (dalam bulan pengeluaran)."
            });
            list.push({
              kategori: "Tabungan Target",
              limit: customBudget.savingsTarget,
              deskripsi: "Target persentase tabungan kustom."
            });
          }
          setBudgetsData(list);
        }).catch((err) => {
          console.error("Error loading budgets for AI:", err);
        });
      });
    } else {
      setWishlist([]);
      setTargetImpian([]);
      setBudgetsData([]);
    }

    if (propsTransactions === undefined) {
      setLocalTransactions([]);
    }
  }, [propsTransactions]);

  React.useEffect(() => {
    const syncStreakWithLocalTime = () => {
      const user_email = localStorage.getItem("userEmail") || "";
      if (user_email) {
        fetchUserStreak(user_email).then((s) => {
          setStreakCount(s.streakCount);
          setStreakActive(s.streakActive);
        });
      }
    };

    syncStreakWithLocalTime();
    const streakInterval = setInterval(syncStreakWithLocalTime, 30000);
    return () => clearInterval(streakInterval);
  }, []);

  React.useEffect(() => {
    if (userName) {
      setMessages([
        {
          text: t(
            `Halo ${userName}! Ada yang mau didiskusikan soal keuanganmu hari ini?`,
            `Hello ${userName}! Is there anything you'd like to discuss about your finances today?`,
          ),
          isAi: true,
        },
      ]);
    }
  }, [userName, language]);

  const renderMarkdown = (text: string) => {
    if (!text) return { __html: "" };
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");
    escaped = escaped.replace(/\n/g, "<br />");
    return { __html: escaped };
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const wasVoiceInput = isVoiceInteraction;
    setIsVoiceInteraction(false); 

    const userMessage = chatInput.trim();
    const updatedMessages = [...messages, { text: userMessage, isAi: false }];
    setMessages(updatedMessages);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);

    const user_email = localStorage.getItem("userEmail") || "";

    const financialContext = {
      totalBalance: totalSaldo,
      totalIncome: totalPemasukan,
      totalExpense: totalPengeluaran,
      currency: "IDR",
      summary: { 
        balance: totalSaldo, 
        totalIncome: totalPemasukan, 
        totalExpense: totalPengeluaran 
      },
      smartBudget: budgetsData || [],
      recentTransactions: transactions.slice(0, 10).map((t: any) => ({
        id: t.id,
        amount: Number(t.nominal || t.amount) || 0,
        type: t.jenis === 'pemasukan' ? 'pemasukan' : 'pengeluaran',
        category: t.kategori,
        description: t.catatan || t.description,
        date: t.tanggal
      })),
      savingsGoals: wishlist.map((g: any) => ({
        id: g.id,
        name: g.nama || g.name || "Impian",
        price: Number(g.harga || g.price) || 0
      }))
    };

    const tempGeminiKey = localStorage.getItem("TEMP_GEMINI_KEY") || "";

    let attempts = 0;
    const maxAttempts = 3; 
    let success = false;
    let dataText = "";
    let serverActionPayload: any = null;
    let lastError = "";

    while (attempts < maxAttempts) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage,
            messages: updatedMessages.map(m => ({ text: m.text, isAi: m.isAi })), 
            language, 
            user_email,
            financialContext,
            targetImpian: targetImpian && targetImpian.length > 0 ? targetImpian : wishlist,
            tempGeminiKey
          }),
        });

        const status = res.status;
        const contentType = res.headers.get("content-type") || "";

        if (!res.ok || status === 503) {
          const errData = contentType.includes("application/json") 
            ? await res.json().catch(() => ({})) 
            : {};
          
          const errStr = String(errData.error || errData.text || errData.reply || `Server error ${status}`).toLowerCase();
          lastError = errData.error || errData.text || errData.reply || `Server error ${status}`;
          
          const isRetryable = status === 503 || 
                              errStr.includes("503") || 
                              errStr.includes("high demand") || 
                              errStr.includes("overloaded") || 
                              errStr.includes("resource exhausted") ||
                              errStr.includes("rate limit") ||
                              errStr.includes("unavailable");

          if (isRetryable && (attempts + 1) < maxAttempts) {
            attempts++;
            console.log(`[AI Chat Frontend] Attempt ${attempts} did not succeed. Retrying in 1.5s...`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          } else {
            throw new Error(errData.error || errData.text || `Server returned status ${status}`);
          }
        }

        const data = await res.json();
        const replyMsg = data.reply || data.text || "";
        const actionPayload = data.actionPayload || null;

        if (data && (replyMsg || actionPayload)) {
          dataText = replyMsg;
          serverActionPayload = actionPayload;
          success = true;
          break;
        } else if (data && data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("No response text received from server");
        }
      } catch (error: any) {
        attempts++;
        const errMsg = String(error.message || error).toLowerCase();
        lastError = error.message || String(error);
        
        const isRetryable = errMsg.includes("503") || 
                            errMsg.includes("high demand") || 
                            errMsg.includes("overloaded") || 
                            errMsg.includes("resource exhausted") ||
                            errMsg.includes("rate limit") || 
                            errMsg.includes("unavailable");

        if (isRetryable && attempts < maxAttempts) {
          console.log(`[AI Chat Frontend] Catch attempt ${attempts} did not succeed. Retrying in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          break;
        }
      }
    }

    if (success && (dataText || serverActionPayload)) {
      let cleanText = dataText;
      let transactionData: any = serverActionPayload;

      if (!transactionData && dataText) {
        try {
          const markdownMatch = dataText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (markdownMatch && markdownMatch[1]) {
            const parsed = JSON.parse(markdownMatch[1].trim());
            if (parsed && (parsed.action === "ADD_TRANSACTION" || parsed.amount || parsed.type)) {
              transactionData = parsed;
              cleanText = dataText.replace(markdownMatch[0], "").trim();
            }
          }
        } catch (e) {
          console.warn("Strategy 1 (Markdown JSON) parse attempt:", e);
        }

        if (!transactionData) {
          try {
            const rawMatch = dataText.match(/\{\s*"action"\s*:\s*"ADD_TRANSACTION"[\s\S]*?\}/i) ||
                             dataText.match(/\{\s*"type"\s*:[\s\S]*?"amount"\s*:[\s\S]*?\}/i);
            if (rawMatch) {
              const parsed = JSON.parse(rawMatch[0]);
              if (parsed && (parsed.action === "ADD_TRANSACTION" || parsed.amount || parsed.type)) {
                transactionData = parsed;
                cleanText = dataText.replace(rawMatch[0], "").trim();
              }
            }
          } catch (e) {
            console.warn("Strategy 2 (Raw JSON) parse attempt:", e);
          }
        }
      }

      cleanText = cleanText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

      if (transactionData) {
        let rawAmount = transactionData.amount;
        let nominalValue = 0;
        if (typeof rawAmount === "number") {
          nominalValue = Math.abs(rawAmount);
        } else if (typeof rawAmount === "string") {
          const digitsOnly = rawAmount.replace(/[^0-9]/g, "");
          nominalValue = Number(digitsOnly) || 0;
        }

        const typeStr = String(transactionData.type || "expense").toLowerCase();
        const typeValue = (typeStr === "income" || typeStr === "pemasukan") ? "pemasukan" : "pengeluaran";
        const categoryValue = transactionData.category || transactionData.kategori || "Lainnya";
        let rawNotes = transactionData.notes || transactionData.title || transactionData.catatan || transactionData.category || "Transaksi";
        rawNotes = String(rawNotes)
          .replace(/^(?:catat|tolong catat|input|rekam|tambah)\s+(?:pengeluaran|pemasukan)?\s*/i, "")
          .trim();
        const notesValue = rawNotes || categoryValue;

        const categoryIcons: Record<string, string> = {
          "Kebutuhan Pokok": "🛒", 
          "Transportasi": "🚗", 
          "Hiburan": "🎬", 
          "Makan & Minum": "🍜", 
          "Makanan & Minuman": "🍜",
          "Kesehatan": "💊", 
          "Pendidikan": "📚", 
          "Tagihan": "📄", 
          "Belanja": "👕", 
          "Gaji": "💰",
          "Investasi": "📈",
          "Lainnya": "📦"
        };
        const iconValue = categoryIcons[categoryValue] || "🧾";

        const newTx = {
          id: "ai_tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          nominal: nominalValue,
          jenis: typeValue,
          kategori: categoryValue,
          catatan: notesValue,
          tanggal: new Date().toISOString().split('T')[0],
          icon: iconValue
        };

        const saveTransactionToState = async () => {
          try {
            if (propsSetTransactions && typeof propsSetTransactions === "function") {
              const { insertTransaction } = await import("../utils/api");
              const user_email = localStorage.getItem("userEmail") || "";
              const insertedTx = await insertTransaction(newTx, user_email);
              propsSetTransactions(prev => [insertedTx, ...prev]);
              if (typeof window !== "undefined" && (window as any).triggerTransactionSuccess) {
                (window as any).triggerTransactionSuccess(insertedTx.currentStreak, insertedTx.streakIncreasedToday, {
                  type: typeValue,
                  amount: nominalValue,
                  category: categoryValue
                });
              }
            } else {
              setLocalTransactions(prev => [newTx, ...prev]);
              if (typeof window !== "undefined" && (window as any).triggerTransactionSuccess) {
                (window as any).triggerTransactionSuccess(undefined, undefined, {
                  type: typeValue,
                  amount: nominalValue,
                  category: categoryValue
                });
              }
            }
          } catch (err) {
            console.error("Failed to insert AI transaction:", err);
            setLocalTransactions(prev => [newTx, ...prev]);
          }
        };

        saveTransactionToState();

        toast.success(
          language === "id"
            ? `Berhasil mencatat transaksi: ${notesValue} (Rp ${nominalValue.toLocaleString("id-ID")})`
            : `Successfully recorded transaction: ${notesValue} (Rp ${nominalValue.toLocaleString("id-ID")})`
        );

        if (!cleanText) {
          cleanText = language === "id" 
            ? `Sip! Transaksi ${notesValue} sebesar Rp ${nominalValue.toLocaleString("id-ID")} telah berhasil dicatat ya! ✅` 
            : `Got it! Transaction ${notesValue} worth Rp ${nominalValue.toLocaleString("id-ID")} has been recorded! ✅`;
        }

        setMessages((prev) => {
          const next = [
            ...prev,
            { 
              text: cleanText, 
              isAi: true, 
              isTransactionSuccess: true, 
              transactionDetails: { 
                type: transactionData.type, 
                amount: nominalValue, 
                category: categoryValue, 
                notes: notesValue 
              } 
            }
          ];
          if (wasVoiceInput) {
            const aiIdx = next.length - 1;
            setTimeout(() => {
              speakMessage(cleanText, aiIdx);
            }, 100);
          }
          return next;
        });
      } else {
        setMessages((prev) => {
          const next = [...prev, { text: cleanText, isAi: true }];
          if (wasVoiceInput) {
            const aiIdx = next.length - 1;
            setTimeout(() => {
              speakMessage(cleanText, aiIdx);
            }, 100);
          }
          return next;
        });
      }
    } else {
      const lastErrorLower = lastError.toLowerCase();
      if (
        lastErrorLower.includes("api_key") || 
        lastErrorLower.includes("403") || 
        lastErrorLower.includes("401") || 
        lastErrorLower.includes("forbidden") || 
        lastErrorLower.includes("unauthorized") || 
        lastErrorLower.includes("key not valid") || 
        lastErrorLower.includes("invalid key") || 
        lastErrorLower.includes("key belum dipasang")
      ) {
        const keyMsg = "🔑 API Key Gemini belum terpasang atau tidak valid! Silakan klik tombol Kunci 🔑 di atas untuk memasukkan API Key Anda agar AI bisa menjawab.";
        setMessages((prev) => [...prev, { text: keyMsg, isAi: true }]);
      } else {
        const friendlyMsg = "Maaf, AI sedang memproses data. Coba tanyakan lagi ya! 🙏";
        setMessages((prev) => [...prev, { text: friendlyMsg, isAi: true }]);
      }
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  React.useEffect(() => {
    const generateInsight = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAiInsight(
        t(
          `Halo! Aku AI Advisor-mu. Saldomu masih kosong nih, yuk atur Smart Budget pertamamu!`,
          `Hello! I am your AI Advisor. Your balance is looking empty, let's configure your first Smart Budget!`,
        ),
      );
    };
    generateInsight();
  }, [saldoDanaDarurat, userName, language]);

  const totalPemasukan = transactions
    .filter((t) => t.jenis === "pemasukan")
    .reduce((acc, t) => acc + (Number(t.nominal) || 0), 0);
  const totalPengeluaran = transactions
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((acc, t) => acc + (Number(t.nominal) || 0), 0);
  const totalSaldo = totalPemasukan - totalPengeluaran;

  // Pesan lokal ini berubah otomatis setiap hari dan tidak menunggu layanan AI.
  const dailyWelcomeMessage = getDailyWelcomeMessage(language, userName);

  const summaryCards = [
    {
      label: t("Total Saldo", "Total Balance"),
      value: `Rp ${totalSaldo.toLocaleString("id-ID")}`,
      icon: <Wallet size={20} className="text-primary-mooduit" />,
      bg: "bg-white",
      text: "text-primary-mooduit",
    },
    {
      label: t("Pemasukan Bulan Ini", "Income This Month"),
      value: `Rp ${totalPemasukan.toLocaleString("id-ID")}`,
      icon: <ArrowDownCircle size={20} className="text-success" />,
      bg: "bg-white",
      text: "text-primary-mooduit",
    },
    {
      label: t("Pengeluaran Bulan Ini", "Expenses This Month"),
      value: `Rp ${totalPengeluaran.toLocaleString("id-ID")}`,
      icon: <ArrowUpCircle size={20} style={{ color: "#382718" }} />,
      bg: "bg-white",
      text: "text-[#382718]",
    },
  ];

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 0 && hours <= 11) {
      return { id: "Selamat Pagi", en: "Good Morning" };
    } else if (hours >= 12 && hours <= 14) {
      return { id: "Selamat Siang", en: "Good Afternoon" };
    } else if (hours >= 15 && hours <= 18) {
      return { id: "Selamat Sore", en: "Good Afternoon" };
    } else {
      return { id: "Selamat Malam", en: "Good Evening" };
    }
  };

  const currentGreeting = getGreeting();

  return (
    <div className="container py-4 pb-5 mb-5">
      <header className="mb-4">
        <div className="d-flex align-items-center flex-wrap gap-3 mb-1">
          <h1 className="fw-800 text-primary-mooduit text-2xl sm:text-3xl mb-0">
            {t(`${currentGreeting.id}, ${userName}! 👋`, `${currentGreeting.en}, ${userName}! 👋`)}
          </h1>
          <div className="streak-badge-container flex items-center gap-2">
            <div 
              className={`streak-badge ${streakActive && streakCount > 0 ? 'streak-badge-menyala' : 'streak-badge-padam'}`}
            >
              <span className="streak-badge-fire">🔥</span>
              <span className="streak-badge-text text-xs sm:text-sm">
                {streakCount}
              </span>
            </div>
          </div>

          {/* IKON KADO ULANG TAHUN DI DASHBOARD (SEBELAH STREAK) */}
          {isUserBirthdayToday(userDob) && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              type="button"
              onClick={() => setShowBirthdayModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md shadow-pink-500/25 animate-pulse border-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              style={{ borderRadius: '9999px' }}
              title={t("Kado Ulang Tahun Kamu! 🎉 Klik untuk membuka modal kado", "Your Birthday Gift! 🎉 Click to open surprise modal")}
            >
              <span className="text-sm select-none">🎁</span>
              <span className="tracking-wide uppercase text-xs font-black">{t("Kado Ulang Tahun", "Birthday Gift")}</span>
            </motion.button>
          )}
        </div>
        {isLoading ? (
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded my-1" />
        ) : totalSaldo <= 50000 ? (
          <p className="mb-0 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 text-sm sm:text-base">
            <span>⚠️</span>
            <span>
              {t(
                "Waduh, dompetmu lagi kritis nih. Yuk rem pengeluaran!",
                "Watch out, your wallet is in critical condition. Let's slow down spending!"
              )}
            </span>
          </p>
        ) : (
          <p className="text-muted text-sm sm:text-base mb-0">
            {t(
              "Status dompetmu lagi terpantau sehat hari ini.",
              "Your wallet status is looking healthy today.",
            )}
          </p>
        )}
      </header>

      {/* Pesan harian lokal: langsung tampil tanpa request AI */}
      <motion.div
        className="p-4 bg-cream-mooduit rounded-2xl shadow-sm border-0 d-flex gap-4 align-items-center mb-4 mooduit-ambient-ai-banner"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white p-3 rounded-xl text-brown-mooduit shadow-sm shrink-0 mooduit-ambient-ai-icon">
          <MessageSquareText size={24} />
        </div>
        <div className="w-full">
          <div
            className="text-xs sm:text-sm font-extrabold text-brown-mooduit opacity-80 uppercase tracking-wider mb-1 mooduit-ambient-ai-title"
          >
            {t("Pesan Hari Ini", "Today's Message")}
          </div>
          <p
            className="mb-0 font-bold text-brown-mooduit text-left text-sm sm:text-base leading-relaxed mooduit-ambient-ai-desc"
          >
            {dailyWelcomeMessage}
          </p>
        </div>
      </motion.div>

      {/* Summary Cards Grid */}
      <div className="w-full flex flex-col gap-3 sm:gap-4 mb-5">
        {/* KARTU 1: Total Saldo (Full Width Compact) */}
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#112F58] dark:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                ></path>
              </svg>
            </div>
          </div>
          
          {/* TEXT HEADER & TOGGLE MATA (INLINE & CLEAN) */}
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold m-0 p-0 leading-none">
              {t("Total Saldo", "Total Balance")}
            </p>
            <div className="mooduit-tooltip-wrapper">
              <button 
                onClick={() => {
                  const nextVal = !showBalance;
                  setShowBalance(nextVal);
                  localStorage.setItem("mooduit_balance_visibility", String(nextVal));
                }}
                className="btn-eye-toggle"
                type="button"
                aria-label={showBalance ? t("Sembunyikan Saldo", "Hide Balance") : t("Tampilkan Saldo", "Show Balance")}
              >
                {showBalance ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
              <span className="mooduit-tooltip">
                {showBalance ? t("Sembunyikan", "Hide") : t("Tampilkan", "Show")}
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-8 w-44 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse my-0.5" />
          ) : (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#112F58] dark:text-white leading-tight mb-0">
              {showBalance ? `Rp ${totalSaldo.toLocaleString("id-ID")}` : "Rp ••••••••"}
            </h2>
          )}
        </div>

        {/* KARTU RINGKASAN PEMASUKAN & PENGELUARAN (BALANCED GRID FIX) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
          
          {/* Kartu Pemasukan */}
          <div className="w-full min-h-[92px] bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">
                {t("Pemasukan", "Income")}
              </span>
            </div>
            {isLoading ? (
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1" />
            ) : (
              <h3 className="summary-amount-secondary font-extrabold tracking-tight m-0 text-[#112F58] dark:text-white leading-tight">
                {showBalance ? `Rp ${totalPemasukan.toLocaleString("id-ID")}` : "Rp ••••••••"}
              </h3>
            )}
          </div>

          {/* Kartu Pengeluaran */}
          <div className="w-full min-h-[92px] bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">
                {t("Pengeluaran", "Expenses")}
              </span>
            </div>
            {isLoading ? (
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1" />
            ) : (
              <h3 className="summary-amount-secondary font-extrabold tracking-tight m-0 text-[#112F58] dark:text-white leading-tight">
                {showBalance ? `Rp ${totalPengeluaran.toLocaleString("id-ID")}` : "Rp ••••••••"}
              </h3>
            )}
          </div>

        </div>
      </div>

      {/* SECTION TARGET IMPIAN (REORDERED: DIRECTLY BELOW PEMASUKAN & PENGELUARAN) */}
      <div className="mb-6">
        <div className="card-mooduit h-100 shadow-sm p-4 d-flex flex-column bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
          <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
            <h2 className="fw-800 text-[#112F58] dark:text-white whitespace-nowrap truncate m-0 d-flex align-items-center gap-1.5" style={{ fontSize: '16px' }}>
              🎯 {t("Target Impian", "Dream Target")}
            </h2>
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="btn btn-mooduit-outline px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0"
            >
              + {t("Tambah", "Add")}
            </button>
          </div>

          <div className="flex-grow-1 d-flex flex-column py-1">
            <div className="space-y-3">
              {targetImpian.length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl d-flex flex-column align-items-center justify-content-center h-100 py-5">
                  <p className="mb-3 text-sm sm:text-base leading-relaxed">
                    {t(
                      "Belum ada target impian. Yuk, tambah target pertamamu!",
                      "No dream targets yet. Let's add your first target!",
                    )}
                  </p>
                  <button
                    className="btn btn-mooduit-outline px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap shrink-0"
                    onClick={() => setIsTargetModalOpen(true)}
                  >
                    + {t("Tambah", "Add")}
                  </button>
                </div>
              ) : (
                <div
                  className="d-flex flex-column gap-3 overflow-y-auto"
                  style={{ maxHeight: "300px" }}
                >
                  {targetImpian.map((target) => {
                    const targetName = getDreamTargetName(target);
                    const hargaTarget = getDreamTargetPrice(target);
                    const terkumpul = getDreamTargetCollected(target, transactions);
                    const persentase = hargaTarget > 0 ? Math.min(100, Math.floor((terkumpul / hargaTarget) * 100)) : 0;

                    return (
                      <div
                        key={target.id}
                        className="border border-gray-100 dark:border-slate-700 rounded-2xl p-4 flex flex-col relative group bg-light dark:bg-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        onClick={() => handleEditItem(target)}
                      >
                        {/* Bagian Atas: Nama, Harga, dan Tombol Nyicil */}
                        <div className="flex justify-between items-center w-full mb-3">
                          <div className="min-w-0 flex-1 pr-2">
                            <h3 className="font-bold text-[#112F58] dark:text-white capitalize mb-0.5 truncate" style={{ fontSize: '14px' }}>{targetName}</h3>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-400 mb-0">Rp {hargaTarget.toLocaleString("id-ID")}</p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTargetForNyicil(target);
                              setNyicilNominal("");
                              setIsNyicilModalOpen(true);
                            }}
                            className="px-4 py-1.5 bg-[#112F58] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#1a447d] hover:scale-105 active:scale-95 transition-all border-0 cursor-pointer shadow-sm shrink-0"
                          >
                            Nyicil
                          </button>
                        </div>

                        {/* Bagian Bawah: Progress Bar & Keterangan Terkumpul */}
                        <div className="w-full mt-3">
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="text-xs font-extrabold transition-colors" style={{ color: darkMode ? '#ffffff' : '#112F58' }}>
                              Terkumpul: Rp {terkumpul.toLocaleString("id-ID")}
                            </span>
                            <span className="text-sm font-black transition-colors" style={{ color: darkMode ? '#ffffff' : '#112F58' }}>
                              {persentase}%
                            </span>
                          </div>
                          
                          {/* Track Putih (Belum Terkumpul) */}
                          <div className="w-full rounded-full h-2.5 overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}>
                            {/* Fill Mutlak Navy */}
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${persentase}%`, backgroundColor: '#112F58' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION KANTONG MASA DEPAN */}
      <div className="mb-6">
        <div className="d-flex flex-column mb-3">
          <h2 className="fw-800 text-primary-mooduit text-xl sm:text-2xl mb-1 d-flex align-items-center gap-2">
            💼 {t("Kantong Masa Depan", "Future Pockets")}
          </h2>
          <p className="text-muted text-sm sm:text-base leading-relaxed mb-0">
            {t(
              "Alokasikan sisa saldo aktifmu ke pos tabungan khusus (secara logis mengurangi saldo aktif utama).",
              "Allocate your remaining active balance to target savings pockets (automatically deducts active cash)."
            )}
          </p>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
          {/* Kantong 1: Dana Darurat */}
          <div className="min-w-[85%] sm:min-w-[45%] md:min-w-0 md:flex-1 snap-center">
            <div className="card-mooduit h-100 p-4 border shadow-sm transition-all" style={{ minHeight: '180px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="font-bold text-muted text-xs sm:text-sm">{t("Dana Darurat", "Emergency Fund")}</span>
                <span className="fs-4">🚨</span>
              </div>
              <h3 className="fw-800 text-primary-mooduit text-xl sm:text-2xl mb-3">
                Rp {savingsPockets.darurat.toLocaleString("id-ID")}
              </h3>
              {renderQuickAllocate("darurat")}
            </div>
          </div>

          {/* Kantong 2: Investasi */}
          <div className="min-w-[85%] sm:min-w-[45%] md:min-w-0 md:flex-1 snap-center">
            <div className="card-mooduit h-100 p-4 border shadow-sm transition-all" style={{ minHeight: '180px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="font-bold text-muted text-xs sm:text-sm">{t("Investasi", "Investments")}</span>
                <span className="fs-4">📈</span>
              </div>
              <h3 className="fw-800 text-primary-mooduit text-xl sm:text-2xl mb-3">
                Rp {savingsPockets.investasi.toLocaleString("id-ID")}
              </h3>
              {renderQuickAllocate("investasi")}
            </div>
          </div>

          {/* Kantong 3: Tabungan */}
          <div className="min-w-[85%] sm:min-w-[45%] md:min-w-0 md:flex-1 snap-center">
            <div className="card-mooduit h-100 p-4 border shadow-sm transition-all" style={{ minHeight: '180px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="font-bold text-muted text-xs sm:text-sm">{t("Tabungan", "Goal Savings")}</span>
                <span className="fs-4">🏦</span>
              </div>
              <h3 className="fw-800 text-primary-mooduit text-xl sm:text-2xl mb-3">
                Rp {savingsPockets.tabungan.toLocaleString("id-ID")}
              </h3>
              {renderQuickAllocate("tabungan")}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION TRANSAKSI TERAKHIR (RIWAYAT) */}
      <div className="mb-6">
        <div className="card-mooduit p-4 shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2
              className="fw-800 text-primary-mooduit dark:text-white text-lg sm:text-xl mb-0"
            >
              {t("Transaksi Terakhir", "Recent Transactions")}
            </h2>
            <button
              className="btn btn-link text-primary-mooduit dark:text-sky-400 fw-bold text-decoration-none text-xs sm:text-sm p-0 border-0 bg-transparent"
              onClick={() => onNavigate("history")}
            >
              {t("Lihat Semua", "See All")}
            </button>
          </div>

          {isLoading ? (
            <div className="d-flex flex-column gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex justify-content-between align-items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse">
                  <div className="d-flex align-items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div
              className="d-flex flex-column gap-3 overflow-y-auto"
              style={{ maxHeight: "400px" }}
            >
              {transactions.slice(0, 3).map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="d-flex justify-content-between align-items-center p-3 rounded-2xl bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700"
                >
                  <div className="d-flex align-items-center gap-3 flex-1 min-w-0 pr-2">
                    <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl shadow-xs text-lg shrink-0">
                      {t.icon || "🧾"}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="fw-800 text-slate-800 dark:text-white text-sm sm:text-base leading-tight mb-0.5 truncate line-clamp-1">
                        {t.catatan || t.kategori}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium truncate">
                        {t.tanggal}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`fw-800 text-sm sm:text-base shrink-0 whitespace-nowrap ${t.jenis === "pemasukan" ? "text-success" : "text-[#382718] dark:text-rose-400"}`}
                  >
                    {t.jenis === "pemasukan" ? "+" : "-"} Rp{" "}
                    {Number(t.nominal).toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="bg-light dark:bg-slate-800 p-3 rounded-circle mb-3">
                <ArrowUpRight size={24} className="text-muted opacity-50" />
              </div>
              <p className="text-muted text-sm sm:text-base text-center mb-3 leading-relaxed">
                {t(
                  "Belum ada transaksi. Yuk mulai catat pengeluaran pertamamu!",
                  "No transactions yet. Let's start tracking your first expense!",
                )}
              </p>
              <button
                className="btn btn-mooduit-outline px-4 py-2 rounded-xl font-bold text-xs sm:text-sm"
                onClick={() => onNavigate("scanner")}
              >
                + {t("Scan Struk AI", "Scan Receipt AI")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Widget & Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, y: 50 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-0 md:fixed md:inset-auto md:bottom-20 md:right-8 md:w-[400px] md:h-[600px] bg-white dark:bg-slate-900 md:rounded-3xl shadow-2xl md:border border-slate-200 dark:border-slate-800 z-[99999] flex flex-col resize overflow-hidden min-w-[320px] min-h-[400px] max-w-[600px] max-h-[800px]"
          >
            {/* HEADER CHAT */}
            <div className="bg-[#112F58] p-4 flex justify-between items-center text-white shrink-0 mooduit-chat-header">
              <div className="flex items-center gap-2">
                <h3 className="font-bold flex items-center gap-2 mb-0 text-base sm:text-lg">✨ MOODUIT AI Advisor</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsChatOpen(false);
                }} 
                className="btn btn-link text-white text-xl p-2 cursor-pointer border-0 shadow-none leading-none d-flex align-items-center justify-content-center mooduit-chat-close"
                style={{ padding: '8px', background: 'transparent', outline: 'none' }}
              >
                ✕
              </button>
            </div>

            {/* AREA OBROLAN */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.isAi ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3.5 rounded-2xl shadow-sm ${
                    msg.isAi
                      ? (darkMode ? "bg-slate-800 border border-slate-700 text-white rounded-tl-none align-self-start" : "bg-white rounded-tl-none text-primary-mooduit align-self-start")
                      : "bg-primary-mooduit rounded-tr-none text-white align-self-end"
                  }`}
                  style={{ maxWidth: "85%" }}
                >
                  <div 
                    className="text-sm sm:text-base mb-0 font-medium leading-relaxed font-sans"
                    dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                  />
                  {msg.isTransactionSuccess && msg.transactionDetails && (
                    <div className="bg-[#112F58] border border-[#244c7d] text-white rounded-lg p-3 md:p-4 my-2 shadow-md flex items-start gap-3 font-sans animate-fade-in">
                      <span className="text-emerald-400 text-xl shrink-0 mt-0.5">✅</span>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm sm:text-base mb-1">
                          {language === "id" ? "Transaksi Berhasil Dicatat!" : "Transaction Successfully Recorded!"}
                        </div>
                        <div className="text-slate-200 text-xs sm:text-sm font-medium">
                          {msg.transactionDetails.type === "income" ? (language === "id" ? "Pemasukan" : "Income") : (language === "id" ? "Pengeluaran" : "Expense")} • Rp {msg.transactionDetails.amount.toLocaleString("id-ID")} ({msg.transactionDetails.category})
                        </div>
                        {msg.transactionDetails.notes && (
                          <div className="text-slate-300 text-xs mt-0.5 italic">
                            "{msg.transactionDetails.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {msg.isAi && (
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 bg-transparent dark:bg-transparent">
                      <span className="text-xs text-slate-400 font-sans font-semibold">MOODUIT AI</span>
                      <button
                        type="button"
                        onClick={() => speakMessage(msg.text, i)}
                        className={`p-1 px-2 rounded-full transition-all flex items-center gap-1 border-0 cursor-pointer bg-transparent dark:bg-transparent ${
                          speakingMsgIndex === i 
                            ? "text-rose-500 animate-pulse font-bold" 
                            : "text-slate-600 dark:text-slate-300 hover:opacity-80"
                        }`}
                        title={speakingMsgIndex === i ? t("Hentikan Suara", "Stop Voice") : t("Dengarkan Suara AI", "Listen to AI Voice")}
                        style={{ outline: "none" }}
                      >
                        {speakingMsgIndex === i ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span className="text-xs font-bold">
                          {speakingMsgIndex === i ? (language === "id" ? "Stop" : "Stop") : (language === "id" ? "Dengarkan" : "Listen")}
                        </span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <div className={`p-2.5 px-3.5 rounded-2xl rounded-tl-none shadow-sm align-self-start ${darkMode ? "bg-slate-800 text-slate-300" : "bg-white text-[#112F58]"}`}>
                  <div className="text-xs sm:text-sm text-muted font-bold">
                    Bentar, lagi mikir nih... ✨
                  </div>
                </div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className={`p-3 border-t shrink-0 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              {isListening && (
                <div className="mb-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs sm:text-sm font-semibold animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span>{t("🎙️ Bicara sekarang... MOODUIT sedang mendengarkan", "🎙️ Speak now... MOODUIT is listening")}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mooduit-chat-input-wrapper">
                <textarea
                  rows={2}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full border-none bg-transparent dark:bg-transparent !bg-transparent p-1 shadow-none resize-none flex-1 outline-none focus:ring-0 text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-normal"
                  placeholder={isListening ? t("Mendengarkan suara kamu...", "Listening to your voice...") : t("Tanya AI atau ucapkan transaksi...", "Ask AI or speak transaction...")}
                  style={{
                    minHeight: "44px",
                    maxHeight: "120px",
                    outline: "none",
                    border: "none",
                    boxShadow: "none",
                    backgroundColor: "transparent",
                    color: darkMode ? "#f8fafc" : "#0f172a"
                  }}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full border-0 transition-all flex items-center justify-center shrink-0 cursor-pointer bg-transparent dark:bg-transparent ${
                    isListening
                      ? "text-rose-500 animate-bounce"
                      : "text-primary-mooduit dark:text-sky-400 hover:opacity-80"
                  }`}
                  title={isListening ? t("Hentikan Merekam", "Stop Recording") : t("Kirim Pesan Suara (Voice Note)", "Voice Input")}
                  style={{ width: "38px", height: "38px" }}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className={`p-2 rounded-full border-0 transition-all flex items-center justify-center shrink-0 cursor-pointer bg-transparent dark:bg-transparent ${
                    chatInput.trim()
                      ? "text-primary-mooduit dark:text-sky-400 hover:opacity-80"
                      : "text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                  style={{ width: "38px", height: "38px" }}
                  title={t("Kirim Pesan", "Send Message")}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Toggle Button */}
      {!(isMobile && isChatOpen) && (
        <div 
          className="position-fixed end-0 m-4 d-flex flex-column align-items-end"
          style={{
            zIndex: 1050,
            bottom: isMobile ? "85px" : "20px",
            right: "20px",
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: isDragging.current ? "none" : "transform 0.15s ease-out",
            touchAction: "none"
          }}
        >
          <motion.button
            className={`btn rounded-circle p-3 shadow-lg border border-white border-2 transition-all duration-200 floating-ai-btn ${
              isChatOpen
                ? "bg-white text-primary-mooduit"
                : "bg-white text-[#112F58] hover:bg-gray-100"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: "none", cursor: isDragging.current ? "grabbing" : "grab" }}
            title="Tanya AI Mooduit"
          >
            {isChatOpen ? (
              <X size={28} />
            ) : (
              <Sparkles size={28} className="animate-pulse" />
            )}
          </motion.button>
        </div>
      )}

      {/* Edit Modal Target Impian */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
            role="presentation"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditTargetId(null);
            }}
            style={{
              zIndex: 2000,
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xl w-100 border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: "440px" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-dream-target-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 id="edit-dream-target-title" className="fw-800 text-primary-mooduit dark:text-white text-xl sm:text-2xl mb-0">
                  {t("Edit Target Impian", "Edit Dream Target")}
                </h3>
                <button
                  type="button"
                  className="border-0 bg-transparent d-flex align-items-center justify-content-center p-2"
                  style={{ color: darkMode ? "#ffffff" : "#112F58", borderRadius: "9999px" }}
                  aria-label={t("Tutup popup edit target", "Close edit target popup")}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditTargetId(null);
                  }}
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs sm:text-sm text-muted font-bold mb-1 block">
                    {t("Nama Target Impian", "Target Name")}
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-xl text-sm sm:text-base dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    placeholder="Contoh: Beli Laptop Baru"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-muted font-bold mb-1 block">
                    {t("Target Harga (Rp)", "Target Price (IDR)")}
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-xl text-sm sm:text-base dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={editHarga}
                    onChange={(e) => setEditHarga(formatInput(e.target.value))}
                    placeholder="Contoh: 15.000.000"
                  />
                </div>
              </div>

              <div className="d-flex align-items-stretch gap-2">
                {editTargetId !== null && (
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 d-flex align-items-center justify-content-center gap-2 text-xs sm:text-sm font-bold"
                    style={{
                      flex: 1,
                      minHeight: "44px",
                      backgroundColor: "#fff1f2",
                      color: "#dc2626",
                      border: "1px solid #fda4af",
                    }}
                    title={t("Hapus", "Delete")}
                    aria-label={t("Hapus target impian", "Delete dream target")}
                    onClick={(e) => handleDeleteItem(editTargetId, e)}
                  >
                    <Trash2 size={17} />
                    {t("Hapus", "Delete")}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold"
                  style={{
                    flex: 1,
                    minHeight: "44px",
                    backgroundColor: "#112F58",
                    color: "#ffffff",
                    border: "1px solid #112F58",
                  }}
                  onClick={handleUpdateItem}
                >
                  {t("Simpan", "Save")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal Target Impian */}
      <AnimatePresence>
        {isTargetModalOpen && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
            style={{
              zIndex: 2000,
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xl w-100 border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: "440px" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fw-800 text-primary-mooduit dark:text-white text-xl sm:text-2xl mb-0">
                  {t("Tambah Target Impian Baru", "Add New Dream Target")}
                </h3>
                <button
                  type="button"
                  className="btn-close dark:filter dark:invert"
                  onClick={() => setIsTargetModalOpen(false)}
                />
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs sm:text-sm text-muted font-bold mb-1 block">
                    {t("Nama Impian", "Dream Target Name")}
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-xl text-sm sm:text-base dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={newTargetName}
                    onChange={(e) => setNewTargetName(e.target.value)}
                    placeholder="Contoh: Beli Sepeda Lipat"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-muted font-bold mb-1 block">
                    {t("Target Harga (Rp)", "Target Price (IDR)")}
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-xl text-sm sm:text-base dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={newTargetPrice}
                    onChange={(e) => setNewTargetPrice(formatInput(e.target.value))}
                    placeholder="Contoh: 5.000.000"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light dark:bg-slate-700 dark:text-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold"
                  onClick={() => setIsTargetModalOpen(false)}
                >
                  {t("Batal", "Cancel")}
                </button>
                <button
                  type="button"
                  disabled={!newTargetName || !newTargetPrice}
                  className="btn rounded-xl px-4 py-2 text-xs sm:text-sm font-bold disabled:opacity-50 shadow-sm"
                  style={{ backgroundColor: "#112F58", color: "#ffffff", border: "1px solid #112F58" }}
                  onClick={handleAddTarget}
                >
                  {t("Tambah Target", "Add Target")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Modal Target Impian Tercapai */}
      <AnimatePresence>
        {isCelebrationOpen && selectedTargetForCelebration && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
            style={{
              zIndex: 2000,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(5px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-2xl w-100 text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: "440px" }}
            >
              <div className="text-5xl mb-3 animate-bounce">🎉</div>
              <h3 className="fw-800 text-primary-mooduit dark:text-white text-xl sm:text-2xl mb-2">
                {t("Selamat, Impianmu Tercapai!", "Congratulations, You Reached Your Dream!")}
              </h3>
              <p className="text-muted text-sm sm:text-base leading-relaxed mb-4">
                {t(
                  `Hebat! Dana untuk "${getDreamTargetName(selectedTargetForCelebration)}" sudah terkumpul 100%. Semoga pembeliannya bermanfaat dan menjadi awal tercapainya impian-impian berikutnya.`,
                  `Amazing! The funds for "${getDreamTargetName(selectedTargetForCelebration)}" are now 100% complete. May your purchase be useful and mark the beginning of many more dreams achieved.`
                )}
              </p>

              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  disabled={isCompletingTarget}
                  className="btn rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-60"
                  style={{ backgroundColor: "#112F58", color: "#ffffff", border: "1px solid #112F58" }}
                  onClick={handleCompleteTarget}
                >
                  {isCompletingTarget
                    ? t("Menyelesaikan...", "Completing...")
                    : `🎊 ${t("Mantap, Selesaikan Target", "Awesome, Complete Target")}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nyicil Target Impian */}
      <AnimatePresence>
        {isNyicilModalOpen && selectedTargetForNyicil && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
            role="presentation"
            onPointerDown={(event) => {
              if (!isSavingInstallment && event.target === event.currentTarget) {
                setIsNyicilModalOpen(false);
              }
            }}
            onClick={(event) => {
              if (!isSavingInstallment && event.target === event.currentTarget) {
                setIsNyicilModalOpen(false);
              }
            }}
            style={{
              zIndex: 2000,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(5px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-2xl w-100 border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: "420px" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="installment-dream-target-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 id="installment-dream-target-title" className="fw-800 text-primary-mooduit dark:text-white text-lg sm:text-xl mb-0">
                  {t("Nyicil", "Installment")}
                </h3>
                <button
                  type="button"
                  className="border-0 bg-transparent d-flex align-items-center justify-content-center p-2"
                  style={{ color: darkMode ? "#ffffff" : "#112F58", borderRadius: "9999px" }}
                  aria-label={t("Tutup popup cicilan", "Close installment popup")}
                  onClick={() => {
                    if (!isSavingInstallment) setIsNyicilModalOpen(false);
                  }}
                  disabled={isSavingInstallment}
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  {t("Nominal Cicilan (Rp)", "Installment Amount (IDR)")}
                </label>
                <input
                  type="text"
                  className="form-control rounded-xl text-base dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold"
                  placeholder="Contoh: 100.000"
                  value={nyicilNominal}
                  onChange={(e) => setNyicilNominal(formatInput(e.target.value))}
                  disabled={isSavingInstallment}
                />
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  disabled={!nyicilNominal || isSavingInstallment}
                  className="w-100 px-4 py-2.5 bg-[#112F58] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#1a447d] transition-all border-0 cursor-pointer disabled:opacity-50"
                  onClick={handleSetorNyicil}
                  aria-busy={isSavingInstallment}
                >
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    {isSavingInstallment && <Loader2 size={17} className="animate-spin" />}
                    {isSavingInstallment ? t("Menyimpan cicilan...", "Saving installment...") : t("Simpan Cicilan", "Save Installment")}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Streak Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
            style={{
              zIndex: 99999,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-2xl w-100 text-center border border-slate-200 dark:border-slate-700"
              style={{ maxWidth: "420px" }}
            >
              <div className="position-relative d-flex align-items-center justify-content-center mb-3" style={{ height: "82px" }}>
                <motion.div
                  className="position-absolute rounded-circle"
                  style={{ width: "72px", height: "72px", background: "rgba(251,146,60,0.22)", filter: "blur(10px)" }}
                  animate={{ scale: [0.82, 1.18, 0.9, 1.12, 0.82], opacity: [0.35, 0.75, 0.45, 0.7, 0.35] }}
                  transition={{ duration: 1.45, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="position-relative text-6xl"
                  style={{ filter: "drop-shadow(0 8px 12px rgba(249,115,22,0.35))", transformOrigin: "50% 85%" }}
                  animate={{ y: [2, -7, 1, -4, 2], scale: [0.96, 1.08, 1, 1.05, 0.96], rotate: [-3, 3, -2, 2, -3] }}
                  transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
                >
                  🔥
                </motion.div>
              </div>
              <h3 className="fw-800 text-[#112F58] dark:text-white text-2xl mb-1">
                {streakIncreasedToday ? t("Streak Bertambah! 🔥", "Streak Increased! 🔥") : t("Streak Menyala! 🔥", "Streak is Glowing! 🔥")}
              </h3>
              <div
                className="inline-block px-4 py-1.5 font-extrabold rounded-full text-sm mb-3"
                style={{
                  backgroundColor: streakCount === 1 ? "#ffffff" : (darkMode ? "#431407" : "#ffedd5"),
                  color: streakCount === 1 ? "#ea580c" : (darkMode ? "#fb923c" : "#ea580c"),
                  border: streakCount === 1 ? "1px solid #fed7aa" : "1px solid transparent",
                  boxShadow: streakCount === 1 ? "0 5px 14px rgba(234,88,12,0.12)" : "none",
                }}
              >
                {streakCount === 1
                  ? t("1 Hari", "1 Day")
                  : `${streakCount} ${t("Hari Beruntun", "Day Streak")}`}
              </div>
              <p 
                className="text-sm sm:text-base font-bold mb-0 leading-relaxed italic transition-colors"
                style={{ color: darkMode ? '#ffffff' : '#112F58' }}
              >
                {isMotivationLoading ? (
                  <span className="italic animate-pulse" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {t("Menyiapkan motivasi khusus dari AI...", "Preparing AI motivation...")}
                  </span>
                ) : aiMotivationText ? (
                  aiMotivationText
                ) : (
                  language === "en" ? motivationQuotes[quoteIndex].en : motivationQuotes[quoteIndex].id
                )}
              </p>

              <button
                type="button"
                className="w-full py-2.5 bg-[#112F58] text-white font-bold rounded-xl text-sm hover:bg-[#1a447d] transition-all border-0 cursor-pointer shadow-md mt-4"
                onClick={handleCloseCelebration}
              >
                {t("Lanjutkan Catat Keuangan", "Continue")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Birthday Surprise Modal */}
      <BirthdayModal
        isOpen={showBirthdayModal}
        onClose={() => setShowBirthdayModal(false)}
        userName={userName}
        userDob={userDob}
        userAvatar={localStorage.getItem("userAvatar") || undefined}
        userKey={localStorage.getItem("userEmail") || userName}
      />
    </div>
  );
}
