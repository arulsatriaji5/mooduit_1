import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, X, CheckCircle, ArrowLeft, ShieldAlert, Calendar, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import './Auth.css';

// Declare Google Identity Services global object
declare const google: any;

interface AuthProps {
  onAuth: (user: any) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
}

export default function Auth({ onAuth, onClose, initialMode = 'login' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Custom Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const { t, language, theme } = useThemeLanguage();
  const darkMode = theme === 'dark';

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const userInfo = event.data.userInfo;
        try {
          const syncRes = await fetch('/api/google-login', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: userInfo.email,
              name: userInfo.name || 'Sobat Cuan',
              picture: userInfo.picture || ''
            })
          });

          const resText = await syncRes.text();
          let backendUser: any = {};
          try {
            backendUser = resText ? JSON.parse(resText) : {};
          } catch (e) {
            console.error("Gagal parse JSON Google Login:", resText);
          }

          if (!syncRes.ok) {
            throw new Error(
              backendUser.message || backendUser.error || (language === 'id' 
                ? "Gagal menyinkronkan akun Google dengan backend"
                : "Failed to sync Google account with backend")
            );
          }

          const savedLocalAvatar = backendUser.email ? localStorage.getItem(`avatar_${backendUser.email}`) : null;
          const DEFAULT_ANIMATED_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arul';
          const finalAvatar = backendUser.picture || backendUser.avatarUrl || savedLocalAvatar || localStorage.getItem('userAvatar') || DEFAULT_ANIMATED_AVATAR;

          const safeSet = (k: string, v: string) => {
            try { localStorage.setItem(k, v); } catch (e) { console.warn(`Storage quota exceeded for ${k}`); }
          };

          safeSet('userId', backendUser.id);
          safeSet('userName', backendUser.name);
          safeSet('userEmail', backendUser.email);
          safeSet('authProvider', backendUser.authProvider || 'google');
          safeSet('userAvatar', finalAvatar);
          if (backendUser.email) {
            safeSet(`avatar_${backendUser.email}`, finalAvatar);
          }

          const userData = {
            id: backendUser.id,
            name: backendUser.name,
            email: backendUser.email,
            picture: finalAvatar,
            avatar: finalAvatar,
            authProvider: backendUser.authProvider || 'google',
          };
          safeSet('mooduit_user', JSON.stringify(userData));

          onAuth(userData);

          toast.success(
            language === 'id'
              ? `Selamat datang kembali, ${backendUser.name}! Login berhasil. 🎉`
              : `Welcome back, ${backendUser.name}! Logged in successfully. 🎉`
          );
        } catch (error: any) {
          console.error("Error retrieving Google user info:", error);
          toast.error(error.message || (
            language === 'id'
              ? "Gagal mengambil data profil Google Anda. Silakan coba lagi."
              : "Failed to retrieve your Google profile data. Please try again."
          ));
        }
      } else if (event.data?.type === 'GOOGLE_AUTH_FAILURE') {
        console.error("Google auth failure from popup:", event.data.error);
        toast.error(language === 'id'
          ? `Gagal masuk dengan Google: ${event.data.error}`
          : `Google sign-in failed: ${event.data.error}`
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [language, onAuth]);

  const handleGoogleLogin = () => {
    if (isSubmitting || isGoogleLoading) return;
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured in environment variables.");
      toast.error(
        language === 'id'
          ? "Google Client ID belum dikonfigurasi di Pengaturan AI Studio. Silakan tambahkan VITE_GOOGLE_CLIENT_ID terlebih dahulu di panel Secrets."
          : "Google Client ID is not configured in AI Studio Secrets. Please add VITE_GOOGLE_CLIENT_ID first."
      );
      return;
    }

    setIsGoogleLoading(true);

    const redirectUri = `${window.location.origin}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      redirectTo: `${window.location.origin}/dashboard`
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Full window redirect for PWA & Mobile standalone mode compatibility (NO POPUP)
    window.location.href = googleAuthUrl;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Validasi Kolom Wajib Diisi
    if (!name.trim()) {
      setToastType('error');
      setToastMessage(language === 'id' ? 'Nama Lengkap wajib diisi!' : 'Full Name is required!');
      return;
    }
    if (!email.trim()) {
      setToastType('error');
      setToastMessage(language === 'id' ? 'Email wajib diisi!' : 'Email is required!');
      return;
    }
    if (!password.trim()) {
      setToastType('error');
      setToastMessage(language === 'id' ? 'Kata sandi wajib diisi!' : 'Password is required!');
      return;
    }

    // 2. Validasi Format Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToastType('error');
      setToastMessage(language === 'id' ? 'Format email tidak valid!' : 'Invalid email format!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, dob })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Gagal parse JSON Register:", responseText);
        throw new Error(responseText || (language === 'id' ? "Terjadi kesalahan pada server. Silakan coba lagi." : "Server error occurred. Please try again."));
      }

      if (!res.ok) {
        setToastType('error');
        setToastMessage(data.message || data.error || responseText || (language === 'id' ? 'Pendaftaran gagal!' : 'Registration failed!'));
        return;
      }

      setToastType('success');
      setToastMessage(
        language === 'id'
          ? "Akun berhasil dibuat! Silakan masuk."
          : "Account successfully created! Please log in."
      );

      // Simpan ke localStorage
      const registeredUserData = {
        name,
        email,
        dob,
        authProvider: 'local'
      };
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', email);
      if (dob) localStorage.setItem('userDob', dob);
      localStorage.setItem('mooduit_user', JSON.stringify(registeredUserData));

      // Secara otomatis alihkan (redirect / switch state) tampilan Modal dari "Daftar" ke "Masuk"
      setTimeout(() => {
        setIsLogin(true);
        // Bersihkan form register
        setName('');
        setEmail('');
        setPassword('');
        setToastMessage(null);
        setToastType(null);
      }, 2500); // Tampilkan pesan sukses sebentar agar pengguna dapat membacanya
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      await handleRegisterSubmit(e);
      return;
    }
    if (isSubmitting) return;

    // Validasi Login Dasar
    if (!email.trim() || !password.trim()) {
      setToastType('error');
      setToastMessage(language === 'id' ? 'Email dan kata sandi wajib diisi!' : 'Email and password are required!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Gagal parse JSON Login:", responseText);
        throw new Error(responseText || (language === 'id' ? "Terjadi kesalahan pada server. Silakan coba lagi." : "Server error occurred. Please try again."));
      }

      if (!res.ok) {
        setToastType('error');
        setToastMessage(data.message || data.error || responseText || (language === 'id' ? 'Gagal masuk, periksa kembali email dan sandi.' : 'Login failed, check your email and password.'));
        return;
      }

      // Berhasil Login
      setToastType('success');
      setToastMessage(
        language === 'id'
          ? `Selamat datang kembali, ${data.name}!`
          : `Welcome back, ${data.name}!`
      );

      // Simpan detail ke localStorage
      const savedLocalAvatar = data.email ? localStorage.getItem(`avatar_${data.email}`) : null;
      const DEFAULT_ANIMATED_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arul';
      const finalAvatar = data.picture || data.avatarUrl || savedLocalAvatar || localStorage.getItem('userAvatar') || DEFAULT_ANIMATED_AVATAR;

      const safeSet = (k: string, v: string) => {
        try { localStorage.setItem(k, v); } catch (e) { console.warn(`Storage quota exceeded for ${k}`); }
      };

      safeSet('userId', data.id);
      safeSet('userName', data.name);
      safeSet('userEmail', data.email);
      if (data.dob) safeSet('userDob', data.dob);
      safeSet('authProvider', data.authProvider || 'local');
      safeSet('userAvatar', finalAvatar);
      if (data.email) {
        safeSet(`avatar_${data.email}`, finalAvatar);
      }

      const loginUserData = {
        id: data.id,
        name: data.name,
        email: data.email,
        picture: finalAvatar,
        avatar: finalAvatar,
        authProvider: data.authProvider || 'local'
      };
      safeSet('mooduit_user', JSON.stringify(loginUserData));

      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      onAuth(loginUserData);
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container bg-off-white dark:bg-slate-950">
      {/* Decorative Background Elements */}
      <div className="auth-bg-circle-1"></div>
      <div className="auth-bg-circle-2"></div>

      <motion.div 
        className="auth-card card shadow-lg border-0 bg-white dark:bg-slate-900" 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* HEADER MODAL AUTH (WITH BALANCED BACK AND CLOSE BUTTONS) */}
        <div className="auth-header">
          {/* Symmetrical Back Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isLogin) {
                setIsLogin(true);
              } else if (onClose) {
                onClose();
              } else if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="auth-back-btn"
            title={t("Kembali", "Back")}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Logo & Teks in Center of Header */}
          <div className="d-flex align-items-center">
            <Logo size={40} showText={true} variant={darkMode ? 'light' : 'dark'} />
          </div>

          {/* Symmetrical Close (X) Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (onClose) {
                onClose();
              } else if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="auth-close-btn"
            title={t("Tutup", "Close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary-mooduit dark:text-blue-400 mb-1">
            {isLogin ? (
              t('Masuk Sekarang 👀', 'Log In Now 👀')
            ) : (
              t('Daftar Sekarang ✨', 'Register Now ✨')
            )}
          </h2>
          {isLogin ? (
            <p className="auth-subtitle">
              {language === 'id' 
                ? 'Kelola keuanganmu lagi dengan lebih tenang bersama MOODUIT.' 
                : 'Manage your finances with peace of mind with MOODUIT.'}
            </p>
          ) : (
            <p className="auth-subtitle">
              {language === 'id' 
                ? 'Buat akun dan mulai kelola keuanganmu dengan lebih tenang.' 
                : 'Create an account and start managing your finances with peace of mind.'}
            </p>
          )}
        </div>

        {/* TOAST ALERT BANNER */}
        {toastMessage && (
          <div className="auth-toast-container mb-3">
            <div className={`auth-toast ${toastType === 'success' ? 'success' : 'error'}`}>
              {toastType === 'success' ? (
                <CheckCircle size={18} className="flex-shrink-0" />
              ) : (
                <ShieldAlert size={18} className="flex-shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Nama Lengkap */}
              <div className="mb-3 animate-fade-in">
                <label className="auth-input-label">{t("Nama Lengkap", "Full Name")}</label>
                <div className="auth-input-group">
                  <span className="auth-input-addon">
                    <User size={18} className="text-slate-400 dark:text-slate-500" />
                  </span>
                  <input 
                    type="text" 
                    className="auth-input-field" 
                    placeholder={t("Ketik nama lengkapmu...", "Type your full name here...")} 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {/* Tanggal Lahir (DOB) */}
              <div className="mb-3 animate-fade-in">
                <label className="auth-input-label">{t("Tanggal Lahir 🎂", "Date of Birth 🎂")}</label>
                <div className="auth-input-group">
                  <span className="auth-input-addon">
                    <Calendar size={18} className="text-slate-400 dark:text-slate-500" />
                  </span>
                  <input 
                    type="date" 
                    className="auth-input-field" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </>
          )}
          <div className="mb-3">
            <label className="auth-input-label">{t("Email", "Email")}</label>
            <div className="auth-input-group">
              <span className="auth-input-addon">
                <Mail size={18} className="text-slate-400 dark:text-slate-500" />
              </span>
              <input 
                type="email" 
                className="auth-input-field" 
                placeholder="nama@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="auth-input-label">
              {language === 'id' ? 'Kata Sandi' : 'Password'}
            </label>
            <div className="auth-input-group">
              <span className="auth-input-addon">
                <Lock size={18} className="text-slate-400 dark:text-slate-500" />
              </span>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="auth-input-field" 
                placeholder={language === 'id' ? 'Masukkan kata sandi...' : 'Enter your password...'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-slate-400 dark:text-slate-500" />
                ) : (
                  <Eye size={18} className="text-slate-400 dark:text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* LINK LUPA KATA SANDI */}
          {isLogin && (
            <div className="auth-forgot-wrapper">
              <button 
                type="button"
                onClick={() => setIsForgotModalOpen(true)} 
                className="auth-forgot-link"
              >
                {language === 'id' ? 'Lupa kata sandi?' : 'Forgot password?'}
              </button>
            </div>
          )}

          <button type="submit" className="btn-auth-submit" disabled={isSubmitting || isGoogleLoading} aria-busy={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={19} className="animate-spin" />
                {isLogin ? t('Sedang masuk...', 'Logging in...') : t('Membuat akun...', 'Creating account...')}
              </span>
            ) : (
              isLogin ? t('Masuk Sekarang', 'Log In Now') : t('Daftar Sekarang', 'Register Now')
            )}
          </button>
        </form>

        <div className="d-flex align-items-center my-4">
          <hr className="flex-grow-1 border-light dark:border-slate-800" />
          <span className="mx-3 text-muted dark:text-slate-500 small opacity-50">{t("Atau", "Or")}</span>
          <hr className="flex-grow-1 border-light dark:border-slate-800" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="btn-auth-google"
          disabled={isSubmitting || isGoogleLoading}
          aria-busy={isGoogleLoading}
          aria-label={t("Lanjutkan dengan Google", "Continue with Google")}
        >
          {isGoogleLoading ? (
            <Loader2 size={20} className="animate-spin flex-shrink-0" />
          ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          )}
          <span>{isGoogleLoading ? t("Menghubungkan Google...", "Connecting to Google...") : t("Lanjutkan dengan Google", "Continue with Google")}</span>
        </button>

        <div className="text-center mt-4 pt-2">
          <p className="small mb-0 text-slate-600 dark:text-slate-400">
            {isLogin ? t('Belum punya akun?', 'Don\'t have an account?') : t('Sudah punya akun?', 'Already have an account?')} {' '}
            <button disabled={isSubmitting || isGoogleLoading} className="btn btn-link p-0 fw-bold text-primary-mooduit dark:text-blue-400 text-decoration-none disabled:opacity-50" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? t('Daftar Sekarang', 'Register Now') : t('Masuk Sekarang', 'Log In Now')}
            </button>
          </p>
        </div>
      </motion.div>

      {/* MODAL LUPA PASSWORD (FINANCIAL CRISIS PROTECTION RESET FLOW) */}
      {isForgotModalOpen && (
        <div className="auth-modal-overlay">
          <motion.div 
            className="auth-modal-card card shadow-lg bg-white dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="auth-modal-title text-primary-mooduit dark:text-blue-400">
                {language === 'id' ? 'Atur Ulang Kata Sandi' : 'Reset Password'}
              </h4>
              <button 
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotStatus('idle');
                  setForgotEmail('');
                }} 
                className="auth-modal-close-btn text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {forgotStatus === 'success' ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-emerald-500 mb-3 mx-auto" />
                <h5 className="fw-bold text-slate-900 dark:text-white mb-2">
                  {language === 'id' ? 'Email Terkirim!' : 'Email Sent!'}
                </h5>
                <p className="small text-slate-500 dark:text-slate-400 mb-4">
                  {language === 'id' 
                    ? `Instruksi pemulihan kata sandi telah dikirim ke ${forgotEmail}. Silakan periksa kotak masuk atau folder spam Anda.` 
                    : `Password recovery instructions have been sent to ${forgotEmail}. Please check your inbox or spam folder.`}
                </p>
                <button 
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotStatus('idle');
                    setForgotEmail('');
                  }} 
                  className="btn-auth-submit"
                >
                  {language === 'id' ? 'Selesai' : 'Done'}
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setForgotStatus('submitting');
                try {
                  const res = await fetch('/api/forgot-password', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail })
                  });
                  const responseText = await res.text();
                  let data: any = {};
                  try {
                    data = responseText ? JSON.parse(responseText) : {};
                  } catch (error) {
                    console.error("Gagal parse JSON Forgot Password:", responseText);
                    throw new Error(language === 'id' ? "Terjadi kesalahan pada server. Silakan coba lagi." : "Server error occurred. Please try again.");
                  }
                  if (!res.ok) {
                    toast.error(data.message || data.error || (language === 'id' ? 'Gagal mengirim email reset!' : 'Failed to send reset email!'));
                    setForgotStatus('idle');
                    return;
                  }
                  
                  if (data.debugResetUrl) {
                    console.log("DEBUG ONLY - Reset link:", data.debugResetUrl);
                  }
                  
                  setForgotStatus('success');
                } catch (err: any) {
                  toast.error(err.message || 'Error occurred');
                  setForgotStatus('idle');
                }
              }}>
                <p className="small text-slate-500 dark:text-slate-400 mb-4">
                  {language === 'id' 
                    ? 'Masukkan email Anda yang terdaftar. Kami akan mengirimkan tautan pemulihan aman.' 
                    : 'Enter your registered email address. We will send you a secure recovery link.'}
                </p>
                <div className="mb-4">
                  <label className="auth-input-label">
                    {language === 'id' ? 'Alamat Email' : 'Email Address'}
                  </label>
                  <div className="auth-input-group">
                    <span className="auth-input-addon">
                      <Mail size={18} className="text-slate-400 dark:text-slate-500" />
                    </span>
                    <input 
                      type="email" 
                      className="auth-input-field" 
                      placeholder="nama@email.com" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={forgotStatus === 'submitting'}
                  className="btn-auth-submit"
                >
                  {forgotStatus === 'submitting' 
                    ? (language === 'id' ? 'Mengirim...' : 'Sending...') 
                    : (language === 'id' ? 'Kirim Tautan Atur Ulang' : 'Send Reset Link')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
