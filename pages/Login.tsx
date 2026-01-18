import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Package, Mail, Lock, User as UserIcon, ArrowRight, Loader2, Languages } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let success;
      if (isLogin) {
        success = await login(email, password);
        if (!success) setError(t.login.errorCredentials);
      } else {
        success = await register(name, email, password);
        if (!success) setError(t.login.errorExists);
      }
    } catch (err) {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      await loginWithGoogle();
      setLoading(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Branding Side */}
        <div className="md:w-1/2 bg-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
           {/* Language Toggle Absolute */}
          <div className="absolute top-4 right-4 z-20">
             <button onClick={toggleLanguage} className="flex items-center gap-1 text-xs bg-slate-800 p-2 rounded text-slate-300 hover:text-white">
                <Languages size={14}/> {language === 'ar' ? 'EN' : 'عربي'}
             </button>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-teal-500/20 p-2 rounded-lg">
                 <Package className="w-8 h-8 text-teal-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-wider">{t.common.appName}</h1>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-4">
              {isLogin ? t.login.welcomeBack : t.login.joinUs}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {t.login.systemName}
            </p>
          </div>

          <div className="relative z-10 text-sm text-slate-500">
            {t.common.copyright}
          </div>

          {/* Decorative Circles */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-teal-600 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
        </div>

        {/* Form Side */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center bg-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {isLogin ? t.login.loginTitle : t.login.signupTitle}
            </h3>
            <p className="text-gray-500 text-sm">{t.login.enterDetails}</p>
          </div>

          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all mb-6 group"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{t.login.googleBtn}</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-gray-400 text-sm">{t.login.or}</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className={`absolute top-3.5 ${language === 'ar' ? 'right-4' : 'left-4'} text-gray-400`}>
                  <UserIcon size={20} />
                </div>
                <input 
                  type="text" 
                  required={!isLogin}
                  placeholder={t.login.fullName}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all`}
                />
              </div>
            )}

            <div className="relative">
              <div className={`absolute top-3.5 ${language === 'ar' ? 'right-4' : 'left-4'} text-gray-400`}>
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                required
                placeholder={t.login.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all`}
              />
            </div>

            <div className="relative">
              <div className={`absolute top-3.5 ${language === 'ar' ? 'right-4' : 'left-4'} text-gray-400`}>
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                required
                placeholder={t.login.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all`}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg text-center animate-fade-in">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t.login.signIn : t.login.createAccount}</span>
                  <ArrowRight size={18} className="group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              {isLogin ? t.login.noAccount : t.login.haveAccount}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-teal-600 font-bold hover:underline mx-1"
              >
                {isLogin ? t.login.createAccount : t.login.signIn}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;