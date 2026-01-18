import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StockOut from './pages/StockOut';
import NewItem from './pages/NewItem';
import History from './pages/History';
import InventoryList from './pages/InventoryList';
import Login from './pages/Login';
import { Menu, Package, LogOut } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protected Route Logic
  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory-list': return <InventoryList />;
      case 'stock-out': return <StockOut />;
      case 'new-item': return <NewItem />;
      case 'history': return <History />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-30 p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <Package className="text-teal-400" />
            <h1 className="font-bold text-lg">{t.common.appName}</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu />
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-40 p-10 flex flex-col gap-6 md:hidden">
          <button onClick={() => setMobileMenuOpen(false)} className="self-end text-white text-xl">X</button>
          
          <div className="border-b border-slate-700 pb-4 mb-2">
             <p className="text-teal-400 font-bold text-lg">{user.name}</p>
             <p className="text-slate-400 text-sm">{user.email}</p>
          </div>

          <button onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} className="text-white text-xl font-bold">{t.sidebar.dashboard}</button>
          <button onClick={() => { setActiveTab('inventory-list'); setMobileMenuOpen(false); }} className="text-white text-xl font-bold">{t.sidebar.inventory}</button>
          <button onClick={() => { setActiveTab('stock-out'); setMobileMenuOpen(false); }} className="text-white text-xl font-bold">{t.sidebar.stockOut}</button>
          <button onClick={() => { setActiveTab('new-item'); setMobileMenuOpen(false); }} className="text-white text-xl font-bold">{t.sidebar.newItem}</button>
          <button onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }} className="text-white text-xl font-bold">{t.sidebar.history}</button>
          
          <button onClick={logout} className="text-red-400 text-xl font-bold mt-auto flex items-center gap-2">
             <LogOut size={20} />
             {t.sidebar.logout}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative pt-20 md:pt-0">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-2 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <InventoryProvider>
           <MainLayout />
        </InventoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;