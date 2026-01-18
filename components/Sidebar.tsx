import React from 'react';
import { LayoutDashboard, LogOut, PlusCircle, History, List, Package, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t.sidebar.dashboard, icon: LayoutDashboard },
    { id: 'inventory-list', label: t.sidebar.inventory, icon: List },
    { id: 'stock-out', label: t.sidebar.stockOut, icon: LogOut },
    { id: 'new-item', label: t.sidebar.newItem, icon: PlusCircle },
    { id: 'history', label: t.sidebar.history, icon: History },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <Package className="w-8 h-8 text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-teal-400">{t.common.appName}</h1>
          <p className="text-xs text-slate-400">{t.common.appDesc}</p>
        </div>
      </div>
      
      {user && (
        <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800">
           {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-teal-500" />
           ) : (
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
           )}
           <div className="overflow-hidden">
             <p className="text-sm font-medium truncate">{user.name}</p>
             <p className="text-xs text-slate-500 truncate">{user.email}</p>
           </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-2 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-lg translate-x-1' // Note: In RTL, translate-x-1 might move left, usually fine or needs dir awareness
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700 space-y-3">
        <button 
          onClick={toggleLanguage}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-teal-700 text-teal-100 p-2 rounded-lg transition-all border border-slate-700"
        >
           <Languages size={18} />
           <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-400 p-3 rounded-lg transition-all"
        >
           <LogOut size={18} />
           <span>{t.sidebar.logout}</span>
        </button>

        <div className="bg-slate-800 rounded-lg p-3 text-center text-xs text-slate-400">
          {t.common.version}
          <br />
          {t.common.copyright}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;