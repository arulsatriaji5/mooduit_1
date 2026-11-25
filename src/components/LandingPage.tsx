import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  Camera, 
  Brain, 
  PiggyBank,
  CheckCircle2,
  X,
  Menu,
  TrendingUp,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import Logo from './Logo';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface LandingPageProps {
  onStart: (mode: 'login' | 'register') => void;
}

function useLandingCarousel(itemCount: number, intervalMs = 4000) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const pauseUntilRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const autoTimerRef = useRef<number | null>(null);
  const programmaticTimerRef = useRef<number | null>(null);

  const resetAutoScrollTimer = useCallback(() => {
    if (autoTimerRef.current) {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    autoTimerRef.current = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      if (track.scrollWidth <= track.clientWidth + 4) return;
      if (isPausedRef.current || Date.now() < pauseUntilRef.current) return;

      const nextIndex = (activeIndexRef.current + 1) % itemCount;
      const cards = Array.from(track.querySelectorAll('.landing-horizontal-card')) as HTMLElement[];
      const targetCard = cards[nextIndex];
      if (!targetCard) return;

      const trackRect = track.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const paddingLeft = parseFloat(window.getComputedStyle(track).paddingLeft || '0') || 0;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const targetLeft = Math.min(maxScroll, Math.max(0, cardRect.left - trackRect.left + track.scrollLeft - paddingLeft));

      isProgrammaticScrollRef.current = true;
      if (programmaticTimerRef.current) {
        window.clearTimeout(programmaticTimerRef.current);
      }
      programmaticTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 650);

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      track.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }, intervalMs);
  }, [itemCount, intervalMs]);

  const scrollToIndex = useCallback((index: number, isUserAction = false) => {
    const clampedIndex = ((index % itemCount) + itemCount) % itemCount;
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.querySelectorAll('.landing-horizontal-card')) as HTMLElement[];
    const targetCard = cards[clampedIndex];
    if (!targetCard) return;

    const trackRect = track.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const paddingLeft = parseFloat(window.getComputedStyle(track).paddingLeft || '0') || 0;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const targetLeft = Math.min(maxScroll, Math.max(0, cardRect.left - trackRect.left + track.scrollLeft - paddingLeft));

    isProgrammaticScrollRef.current = true;
    if (programmaticTimerRef.current) {
      window.clearTimeout(programmaticTimerRef.current);
    }
    programmaticTimerRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 650);

    activeIndexRef.current = clampedIndex;
    setActiveIndex(clampedIndex);

    if (isUserAction) {
      pauseUntilRef.current = Date.now() + intervalMs;
      resetAutoScrollTimer();
    }

    track.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, [itemCount, intervalMs, resetAutoScrollTimer]);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    if (track.scrollWidth <= track.clientWidth + 4) return;
    if (isProgrammaticScrollRef.current) return;

    pauseUntilRef.current = Date.now() + intervalMs;
    resetAutoScrollTimer();

    const cards = Array.from(track.querySelectorAll('.landing-horizontal-card')) as HTMLElement[];
    if (cards.length === 0) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    let closestIndex = 0;

    if (track.scrollLeft <= 4) {
      closestIndex = 0;
    } else if (track.scrollLeft >= maxScroll - 4) {
      closestIndex = cards.length - 1;
    } else {
      const trackRect = track.getBoundingClientRect();
      const paddingLeft = parseFloat(window.getComputedStyle(track).paddingLeft || '0') || 0;
      let minDist = Infinity;
      cards.forEach((card, idx) => {
        const dist = Math.abs(card.getBoundingClientRect().left - trackRect.left - paddingLeft);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = idx;
        }
      });
    }

    if (closestIndex !== activeIndexRef.current) {
      activeIndexRef.current = closestIndex;
      setActiveIndex(closestIndex);
    }
  }, [intervalMs, resetAutoScrollTimer]);

  const handlePauseStart = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const handlePauseEnd = useCallback(() => {
    isPausedRef.current = false;
    pauseUntilRef.current = Date.now() + intervalMs;
    resetAutoScrollTimer();
  }, [intervalMs, resetAutoScrollTimer]);

  useEffect(() => {
    resetAutoScrollTimer();
    return () => {
      if (autoTimerRef.current) window.clearInterval(autoTimerRef.current);
      if (programmaticTimerRef.current) window.clearTimeout(programmaticTimerRef.current);
    };
  }, [resetAutoScrollTimer]);

  return {
    trackRef,
    activeIndex,
    scrollToIndex,
    handleScroll,
    handlePauseStart,
    handlePauseEnd,
  };
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const { language, setLanguage, t, theme, toggleTheme } = useThemeLanguage();
  const darkMode = theme === 'dark';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('beranda');
  const featuresCarousel = useLandingCarousel(3, 4000);
  const benefitsCarousel = useLandingCarousel(3, 4000);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver Scroll Spy
  useEffect(() => {
    const sectionIds = ['beranda', 'krisis', 'fitur', 'manfaat', 'keamanan'];
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0.5,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Redirect instantly if user already has an active session
  useEffect(() => {
    const savedSession = localStorage.getItem('mooduit_session');
    const savedUser = localStorage.getItem('mooduit_user');
    const savedName = localStorage.getItem('userName');
    
    if (savedSession || savedUser || savedName) {
      localStorage.setItem('mooduit_current_page', 'dashboard');
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="w-full min-h-screen scroll-smooth font-sans mooduit-landing-page pt-16 md:pt-20" style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease' }}>
      <style>{`
        @keyframes floatSmooth {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: floatSmooth 3.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* --- 1. HEADER (EFEK KACA/TRANSPARAN SAAT SCROLL) --- */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b"
        style={{
          backgroundColor: isScrolled 
            ? (darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)') 
            : (darkMode ? '#0f172a' : '#ffffff'),
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
          borderColor: isScrolled 
            ? (darkMode ? '#1e293b' : '#e2e8f0') 
            : 'transparent',
          boxShadow: isScrolled && !darkMode ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
        }}
      >
        <div className="flex justify-between items-center px-4 py-3.5 md:px-[6%] box-border max-w-7xl mx-auto">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="https://raw.githubusercontent.com/arulsatriaji5/mooduit-vibe-coding/main/public/Logo_mooduit.png" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain" />
            <h1 className="text-base sm:text-lg md:text-2xl font-black m-0 flex">
              <span style={{ color: darkMode ? '#ffffff' : '#112f58' }}>MOO</span>
              <span style={{ color: '#B9AB8C' }}>DUIT</span>
            </h1>
          </div>
 
          {/* Navigation Links - Desktop Only */}
          <nav className="hidden md:flex items-center gap-6 sm:gap-8">
            {[
              { label: language === 'id' ? 'Beranda' : 'Home', id: 'beranda' },
              { label: language === 'id' ? 'Krisis' : 'Crisis', id: 'krisis' },
              { label: language === 'id' ? 'Fitur' : 'Features', id: 'fitur' },
              { label: language === 'id' ? 'Manfaat' : 'Benefits', id: 'manfaat' },
              { label: language === 'id' ? 'Keamanan' : 'Security', id: 'keamanan' },
            ].map((item) => {
              const isActive = activeSection === item.id;
              const normalColor = darkMode ? '#cbd5e1' : '#64748b';
              const activeColor = darkMode ? '#38bdf8' : '#112f58';
              
              return (
                <a 
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="relative py-1 text-[15px] font-semibold transition-colors cursor-pointer text-decoration-none"
                  style={{ color: isActive ? activeColor : normalColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = activeColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? activeColor : normalColor)}
                >
                  {item.label}
                  {isActive && (
                    <span 
                      className="absolute bottom-[-4px] left-0 w-full h-[3px] rounded-full transition-all"
                      style={{ backgroundColor: activeColor }}
                    />
                  )}
                </a>
              );
            })}
          </nav>
 
          {/* Right Section: Toggles & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle Bahasa */}
            <button
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              type="button"
              className="font-bold text-[10px] sm:text-xs cursor-pointer flex items-center justify-center shrink-0"
              style={{
                height: '32px',
                minWidth: '36px',
                padding: '0 8px',
                borderRadius: '6px',
                border: darkMode ? '1px solid #334155' : '1px solid #112f58',
                color: darkMode ? '#38bdf8' : '#112f58',
                backgroundColor: 'transparent'
              }}
            >
              {language === 'id' ? 'ID' : 'EN'}
            </button>

            {/* Toggle Tema / Dark Mode */}
            <button
              onClick={toggleTheme}
              type="button"
              className="flex items-center justify-center cursor-pointer shrink-0"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                border: darkMode ? '1px solid #334155' : '1px solid #112f58',
                color: darkMode ? '#cbd5e1' : '#112f58',
                backgroundColor: 'transparent'
              }}
            >
              {darkMode ? (
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
              )}
            </button>

            {/* Auth Buttons - Desktop Only */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                style={{ backgroundColor: 'transparent', border: darkMode ? '1px solid #cbd5e1' : '1px solid #112f58', color: darkMode ? '#cbd5e1' : '#112f58', padding: '7px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => onStart('login')}
              >
                {language === 'id' ? 'Masuk' : 'Login'}
              </button>
              <button 
                style={{ backgroundColor: darkMode ? '#f8fafc' : '#112f58', color: darkMode ? '#0f172a' : '#ffffff', padding: '7px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                onClick={() => onStart('register')}
              >
                {language === 'id' ? 'Daftar' : 'Register'}
              </button>
            </div>

            {/* Hamburger Menu - Mobile Only (TOMBOL MASUK DIHILANGKAN DARI SINI) */}
            <div className="flex md:hidden items-center ml-1">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1 rounded-lg transition shrink-0"
                aria-label="Toggle menu"
                style={{ color: darkMode ? '#ffffff' : '#112f58', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* DROPDOWN MENU MOBILE (LOGIN/REGISTER PINDAH KE SINI) */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden absolute top-[100%] left-0 w-full shadow-xl border-t flex flex-col py-2 px-6 z-50 transition-all backdrop-blur-lg"
            style={{ 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
              borderTopColor: darkMode ? '#334155' : '#f1f5f9'
            }}
          >
            {[
              { label: '🏠 Beranda', id: 'beranda' },
              { label: '⚠️ Krisis Finansial', id: 'krisis' },
              { label: '💡 Fitur Unggulan', id: 'fitur' },
              { label: '🧘‍♂️ Manfaat Nyata', id: 'manfaat' },
              { label: '🛡️ Keamanan Kelas Dunia', id: 'keamanan' },
            ].map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveSection(item.id);
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); 
                  setIsMobileMenuOpen(false); 
                }} 
                style={{ 
                  color: activeSection === item.id 
                    ? (darkMode ? '#38bdf8' : '#112f58') 
                    : (darkMode ? '#cbd5e1' : '#475569'), 
                  fontWeight: activeSection === item.id ? '800' : '600', 
                  cursor: 'pointer', 
                  fontSize: '16px', 
                  padding: '14px 0', 
                  textAlign: 'left', 
                  borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', 
                  textDecoration: 'none' 
                }}
                className="w-full flex items-center gap-2"
              >
                {item.label}
              </a>
            ))}

            {/* Tombol Auth di dalam menu mobile */}
            <div className="flex flex-col gap-3 mt-4 mb-3">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onStart('login'); }} 
                style={{ 
                  border: darkMode ? '1px solid #cbd5e1' : '1px solid #112f58', 
                  color: darkMode ? '#cbd5e1' : '#112f58', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  background: 'transparent', 
                  cursor: 'pointer' 
                }}
              >
                {language === 'id' ? 'Masuk ke Akun' : 'Sign In'}
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onStart('register'); }} 
                style={{ 
                  backgroundColor: darkMode ? '#f8fafc' : '#112f58', 
                  color: darkMode ? '#0f172a' : '#ffffff', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                {language === 'id' ? 'Daftar Sekarang' : 'Register Now'}
              </button>
            </div>
          </div>
        )}
      </header>
      
      {/* --- BAGIAN HERO --- */}
      <section id="beranda" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 6% 40px', marginTop: '20px' }}>
        <div className="animate-float" style={{ width: '120px', height: '120px', marginBottom: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="https://raw.githubusercontent.com/arulsatriaji5/mooduit-vibe-coding/main/public/Logo_mooduit.png" alt="Ikon Dompet" style={{ width: '200px', height: '200px', objectFit: 'contain' }} referrerPolicy="no-referrer" />
        </div>
        <h1 style={{ color: darkMode ? '#ffffff' : '#112f58', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '900', marginBottom: '24px', maxWidth: '800px', lineHeight: '1.2' }}>
          {language === 'id' ? 'Atur Uangmu, Bukan Uang yang Mengaturmu.' : 'Manage Your Money, Don\'t Let It Manage You.'}
        </h1>
        <p className="max-w-2xl mx-auto text-base md:text-xl leading-relaxed mb-8 px-4 text-center" style={{ color: darkMode ? '#cbd5e1' : '#475569', maxWidth: '700px' }}>
          {language === 'id' 
            ? 'Aplikasi asisten keuangan cerdas berbasis AI yang siap bantu kamu atur budget, wujudkan impian, dan nikmati hidup tanpa rasa bersalah.' 
            : 'An AI-powered smart financial assistant ready to help you budget, achieve your dreams, and enjoy life without the guilt.'}
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            style={{ backgroundColor: '#112f58', color: '#ffffff', padding: '14px 32px', fontSize: '16px', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
            onClick={() => onStart('register')}
          >
            {language === 'id' ? 'Daftar / Masuk Sekarang' : 'Sign Up / Login Now'}
          </button>
          <button 
            style={{ backgroundColor: 'transparent', color: darkMode ? '#ffffff' : '#112f58', padding: '14px 32px', fontSize: '16px', fontWeight: 'bold', borderRadius: '12px', border: darkMode ? '1px solid #ffffff' : '1px solid #112f58', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => {
              const element = document.getElementById('krisis');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {language === 'id' ? 'Pelajari Lebih Lanjut' : 'Learn More'}
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
        </div>
      </section>

      {/* --- 3. PROBLEM SECTION --- */}
      <section id="krisis" style={{ padding: '80px 6%', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ color: darkMode ? '#ffffff' : '#112f58', fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
            {language === 'id' ? 'Kenyataan Pahit Tentang Uang.' : 'The Bitter Truth About Money.'}
          </h2>
          <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '18px', lineHeight: '1.7', marginBottom: '32px' }}>
            {language === 'id' 
              ? 'Data menunjukkan jutaan anak muda di Indonesia dan dunia terjebak stres finansial, gaya hidup konsumtif (FOMO), hingga jeratan pinjaman online. Uang seharusnya menjadi alat untuk merdeka, bukan sumber kecemasan tiap akhir bulan.'
              : 'Data shows millions of young adults globally are trapped in financial stress, FOMO-driven consumerism, and debt. Money should be a tool for freedom, not a source of anxiety.'}
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: darkMode ? '#cbd5e1' : '#475569', fontSize: '14px', fontWeight: '600' }}><span style={{ fontSize: '20px' }}>⚠️</span> {language === 'id' ? 'Krisis Literasi Finansial' : 'Financial Literacy Crisis'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: darkMode ? '#cbd5e1' : '#475569', fontSize: '14px', fontWeight: '600' }}><span style={{ fontSize: '20px' }}>💸</span> {language === 'id' ? 'Terjebak Tren FOMO' : 'Trapped in FOMO Trends'}</div>
          </div>
        </div>
        {/* Visual Krisis Keuangan Nyata */}
        <div style={{ flex: '1 1 400px', borderRadius: '24px', overflow: 'hidden', aspectRatio: '4/3', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} className="md:order-first">
          <img 
            src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&q=80&w=800" 
            alt="Anak Muda Gen Z Memegang Kepala Frustrasi di Depan Smartphone" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* --- 4. FEATURES SECTION --- */}
      <section id="fitur" className="mooduit-landing-section-features" style={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', padding: '80px 6%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ color: darkMode ? '#ffffff' : '#112f58', fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
          {language === 'id' ? 'Waktunya Slay Finansial Bersama MOODUIT' : 'Time to Slay Your Finances with MOODUIT'}
        </h2>
        <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '18px', marginBottom: '48px', maxWidth: '700px' }}>
          {language === 'id' ? 'Fitur-fitur andalan yang didesain intuitif dan friendly untuk mengubah kebiasaan buruk finansialmu.' : 'Core features designed intuitively and friendly to transform your financial habits.'}
        </p>
        <div
          ref={featuresCarousel.trackRef}
          onScroll={featuresCarousel.handleScroll}
          onTouchStart={featuresCarousel.handlePauseStart}
          onTouchEnd={featuresCarousel.handlePauseEnd}
          onTouchCancel={featuresCarousel.handlePauseEnd}
          onMouseEnter={featuresCarousel.handlePauseStart}
          onMouseLeave={featuresCarousel.handlePauseEnd}
          className="landing-horizontal-track landing-features-track"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1200px', width: '100%', marginBottom: '48px' }}
        >
          {[
            { 
              icon: '🧠', 
              title: 'Ambient AI Advisor', 
              desc: language === 'id' ? 'Bukan sekadar pencatat kas. AI kami menganalisa kebiasaanmu dan memberi saran personal secara real-time.' : 'Not just an expense logger. Our AI analyzes your habits and provides real-time personal advice.'
            },
            { 
              icon: '📸', 
              title: 'Smart Receipt Scanner', 
              desc: language === 'id' ? 'Males ngetik pengeluaran? Foto struk belanjamu dan biarkan AI kami mengkategorikannya otomatis.' : 'Lazy to type expenses? Just snap a photo of your receipt and let our AI categorize it automatically.'
            },
            { 
              icon: '🎯', 
              title: 'Anti-Boncos 50/30/20', 
              desc: language === 'id' ? 'Sistem budgeting cerdas yang mengunci rasio pengeluaranmu agar masa depan dan lifestyle tetap seimbang.' : 'Smart budgeting system that locks your spending ratio to keep your future and lifestyle balanced.'
            }
          ].map((f, i) => (
            <div 
              key={i} 
              className="landing-horizontal-card transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(17,47,88,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] cursor-pointer"
              style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc', padding: '40px 32px', borderRadius: '24px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', textAlign: 'center' }}
            >
              <div style={{ fontSize: '40px', marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ color: darkMode ? '#ffffff' : '#112f58', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>{f.title}</h3>
              <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '15px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div
          className="flex md:hidden items-center justify-center gap-2 mt-1 mb-6"
          role="tablist"
          aria-label={language === 'id' ? 'Navigasi fitur unggulan' : 'Core features navigation'}
        >
          {[0, 1, 2].map((dotIndex) => {
            const isActive = featuresCarousel.activeIndex === dotIndex;
            return (
              <button
                key={dotIndex}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={language === 'id' ? `Fitur ${dotIndex + 1}` : `Feature ${dotIndex + 1}`}
                onClick={() => featuresCarousel.scrollToIndex(dotIndex, true)}
                className="p-1.5 bg-transparent border-0 cursor-pointer flex items-center justify-center focus:outline-none"
              >
                <span
                  className="block h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? '26px' : '10px',
                    backgroundColor: isActive
                      ? (darkMode ? '#38bdf8' : '#112f58')
                      : (darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(17, 47, 88, 0.22)'),
                  }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* --- SEKSI MANFAAT (BENEFITS) --- */}
      <section id="manfaat" className="py-20 px-6 md:px-12 bg-white dark:bg-slate-900/40 w-full flex flex-col items-center mooduit-landing-section-benefits">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#112f58] dark:text-white mb-4">
              {t('Lebih dari Sekadar Pencatat Keuangan', 'More Than Just a Finance Tracker')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              {t(
                'MOODUIT dirancang untuk mengubah cara kamu melihat uang, membantumu mengambil kendali penuh tanpa perlu pusing memikirkan rumus rumit.',
                'MOODUIT is designed to transform the way you see money, helping you take full control without worrying about complicated formulas.'
              )}
            </p>
          </div>

          <div
            ref={benefitsCarousel.trackRef}
            onScroll={benefitsCarousel.handleScroll}
            onTouchStart={benefitsCarousel.handlePauseStart}
            onTouchEnd={benefitsCarousel.handlePauseEnd}
            onTouchCancel={benefitsCarousel.handlePauseEnd}
            onMouseEnter={benefitsCarousel.handlePauseStart}
            onMouseLeave={benefitsCarousel.handlePauseEnd}
            className="landing-horizontal-track landing-benefits-track grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Manfaat 1 */}
            <div className="landing-horizontal-card bg-white dark:bg-slate-800/80 p-8 rounded-[24px] shadow-[0_15px_40px_-5px_rgba(17,47,88,0.08)] dark:shadow-none border border-slate-100/80 dark:border-slate-800 hover:shadow-[0_25px_50px_-10px_rgba(17,47,88,0.14)] dark:hover:border-slate-700 hover:-translate-y-2 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🧘‍♂️
              </div>
              <h3 className="text-xl font-bold text-[#112f58] dark:text-white mb-3">
                {t('Bebas Stres Finansial', 'Freedom from Financial Stress')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t(
                  'Tidak perlu lagi cemas memikirkan sisa uang. AI Advisor siap memberikan saran kontekstual agar kondisi dompetmu tetap sehat setiap hari.',
                  'No more worrying about how much money is left. AI Advisor provides contextual guidance to keep your finances healthy every day.'
                )}
              </p>
            </div>

            {/* Manfaat 2 */}
            <div className="landing-horizontal-card bg-white dark:bg-slate-800/80 p-8 rounded-[24px] shadow-[0_15px_40px_-5px_rgba(17,47,88,0.08)] dark:shadow-none border border-slate-100/80 dark:border-slate-800 hover:shadow-[0_25px_50px_-10px_rgba(17,47,88,0.14)] dark:hover:border-slate-700 hover:-translate-y-2 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🚀
              </div>
              <h3 className="text-xl font-bold text-[#112f58] dark:text-white mb-3">
                {t('Impian Cepat Terwujud', 'Reach Your Dreams Faster')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t(
                  'Pisahkan uangmu ke Kantong Masa Depan. Lacak target impianmu dan nikmati sensasi menabung yang menyenangkan dan terarah.',
                  'Set money aside in your Future Pocket, track your goals, and enjoy a saving journey that feels rewarding and purposeful.'
                )}
              </p>
            </div>

            {/* Manfaat 3 */}
            <div className="landing-horizontal-card bg-white dark:bg-slate-800/80 p-8 rounded-[24px] shadow-[0_15px_40px_-5px_rgba(17,47,88,0.08)] dark:shadow-none border border-slate-100/80 dark:border-slate-800 hover:shadow-[0_25px_50px_-10px_rgba(17,47,88,0.14)] dark:hover:border-slate-700 hover:-translate-y-2 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-3xl mb-6">
                ⚖️
              </div>
              <h3 className="text-xl font-bold text-[#112f58] dark:text-white mb-3">
                {t('Disiplin Tanpa Ribet', 'Effortless Financial Discipline')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {t(
                  'Metode 50/30/20 otomatis memilah uangmu. Kamu tetap bisa nongkrong dan belanja tanpa rasa bersalah, karena jatah tabungan sudah aman.',
                  'The 50/30/20 method automatically organizes your money, so you can enjoy spending while keeping your savings securely on track.'
                )}
              </p>
            </div>
          </div>

          <div
            className="flex md:hidden items-center justify-center gap-2 mt-1"
            role="tablist"
            aria-label={t('Navigasi manfaat MOODUIT', 'MOODUIT benefits navigation')}
          >
            {[0, 1, 2].map((dotIndex) => {
              const isActive = benefitsCarousel.activeIndex === dotIndex;
              return (
                <button
                  key={dotIndex}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t(`Manfaat ${dotIndex + 1}`, `Benefit ${dotIndex + 1}`)}
                  onClick={() => benefitsCarousel.scrollToIndex(dotIndex, true)}
                  className="p-1.5 bg-transparent border-0 cursor-pointer flex items-center justify-center focus:outline-none"
                >
                  <span
                    className="block h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: isActive ? '26px' : '10px',
                      backgroundColor: isActive
                        ? (darkMode ? '#38bdf8' : '#112f58')
                        : (darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(17, 47, 88, 0.22)'),
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- 4.5. SECURITY & EXCELLENCE (KEAMANAN & KEUNGGULAN) SECTION --- */}
      <section id="keamanan" className="mooduit-landing-section-security" style={{ padding: '80px 6%', backgroundColor: darkMode ? '#112f58' : '#ffffff', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'background-color 0.3s' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#B9AB8C', color: '#112f58', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
              🛡️ Bank-Grade Security
            </div>
            <h2 style={{ color: darkMode ? '#ffffff' : '#112f58', fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
              {language === 'id' ? 'Keunggulan & Sistem Keamanan Kelas Dunia.' : 'World-Class Security & Excellence.'}
            </h2>
            <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '18px', lineHeight: '1.7', marginBottom: '32px' }}>
              {language === 'id' 
                ? 'Kami memahami bahwa data keuangan adalah privasi mutlak Anda. MOODUIT dilengkapi dengan enkripsi AES-256 bit end-to-end, perlindungan PIN biometric, serta pemantauan pintar yang menjamin tidak ada kebocoran data.'
                : 'We understand that financial data is your absolute privacy. MOODUIT is equipped with AES-256 bit end-to-end encryption, biometric PIN, and smart monitoring to prevent any data leaks.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ color: darkMode ? '#ffffff' : '#112f58', fontWeight: 'bold', margin: '0 0 8px 0' }}>🔒 Enkripsi Kuat</h4>
                <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '14px', margin: 0 }}>
                  {language === 'id' ? 'Data Anda disandikan secara militer di server terjaga.' : 'Your data is militarily encrypted on protected servers.'}
                </p>
              </div>
              <div>
                <h4 style={{ color: darkMode ? '#ffffff' : '#112f58', fontWeight: 'bold', margin: '0 0 8px 0' }}>⚡ Sinkronisasi Instan</h4>
                <p style={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '14px', margin: 0 }}>
                  {language === 'id' ? 'Update data real-time antar perangkat tanpa lag.' : 'Real-time sync across your devices with zero lag.'}
                </p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <div 
              className="border border-slate-100 dark:border-slate-800 mooduit-landing-security-card"
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '400px', 
                padding: '30px', 
                backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                borderRadius: '24px', 
                boxShadow: darkMode ? 'none' : '0 25px 50px -12px rgba(17, 47, 88, 0.15), 0 12px 24px -8px rgba(17, 47, 88, 0.1)' 
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="mooduit-landing-security-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="mooduit-landing-security-icon" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#112f58', fontSize: '20px' }}>🛡️</div>
                  <div>
                    <div className="mooduit-landing-security-title" style={{ fontWeight: 'bold', color: '#112f58' }}>Sertifikat SSL</div>
                    <div className="mooduit-landing-security-desc" style={{ fontSize: '12px', color: '#64748b' }}>Aktif • Terenkripsi</div>
                  </div>
                </div>
                <div className="mooduit-landing-security-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="mooduit-landing-security-icon" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eefcf3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#112f58', fontSize: '20px' }}>🔐</div>
                  <div>
                    <div className="mooduit-landing-security-title" style={{ fontWeight: 'bold', color: '#112f58' }}>Otentikasi Dua Faktor</div>
                    <div className="mooduit-landing-security-desc" style={{ fontSize: '12px', color: '#64748b' }}>Melindungi akun dari akses ilegal</div>
                  </div>
                </div>
                <div className="mooduit-landing-security-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="mooduit-landing-security-icon" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff9e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#112f58', fontSize: '20px' }}>🤖</div>
                  <div>
                    <div className="mooduit-landing-security-title" style={{ fontWeight: 'bold', color: '#112f58' }}>AI Security Guard</div>
                    <div className="mooduit-landing-security-desc" style={{ fontSize: '12px', color: '#64748b' }}>Mendeteksi aksi mencurigakan otomatis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. FOOTER DENGAN TATA LETAK KOLOM YANG RESPONSIF --- */}
      <footer className="bg-[#112f58] dark:bg-[#0a1c35] border-t border-white/10 text-white" style={{ padding: '60px 6% 30px 6%' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-b border-white/10 pb-8 mb-8">
          <div>
            <h3 className="text-2xl font-black mb-4">MOODUIT</h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              {language === 'id' 
                ? 'Platform asisten keuangan cerdas berbasis Ambient AI untuk membebaskan Gen-Z dari stres uang.' 
                : 'Smart financial assistant powered by Ambient AI to free Gen-Z from money stress.'}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{language === 'id' ? 'Fitur Utama' : 'Core Features'}</h4>
            <ul className="space-y-2 text-slate-300 text-sm list-none p-0 m-0">
              <li>🧠 Ambient AI Advisor</li>
              <li>📸 Smart Receipt Scanner</li>
              <li>🎯 Anti-Boncos 50/30/20</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{language === 'id' ? 'Metodologi' : 'Methodology'}</h4>
            <ul className="space-y-2 text-slate-300 text-sm list-none p-0 m-0">
              <li>{language === 'id' ? 'Budgeting Sederhana' : 'Simple Budgeting'}</li>
              <li>{language === 'id' ? 'Pencatatan Otomatis' : 'Automatic Logging'}</li>
              <li>{language === 'id' ? 'Saran Kontekstual' : 'Contextual Insights'}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs text-center md:text-left">
          <div>© 2026 MOODUIT. All rights reserved.</div>
          <div>
            {language === 'id' ? 'Dirancang & Dikembangkan oleh ' : 'Designed & Developed by '}
            <span className="font-bold text-white">AS</span>.
          </div>
        </div>
      </footer>

    </div>
  );
}
