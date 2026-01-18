import React, { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, PackageCheck, Activity, X, Coins, Percent, ClipboardCheck, AlertOctagon, Layers } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorMap: Record<string, { bg: string; text: string; valueText: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', valueText: 'text-gray-800' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', valueText: 'text-gray-800' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', valueText: 'text-orange-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', valueText: 'text-purple-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600', valueText: 'text-red-800' },
    green: { bg: 'bg-green-100', text: 'text-green-600', valueText: 'text-green-800' },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 h-full">
      <div>
        <p className="text-sm text-gray-500 mb-1 font-medium">{title}</p>
        <h3 className={`text-2xl font-bold ${theme.valueText}`}>{value}</h3>
      </div>
      <div className={`${theme.bg} p-3 rounded-full ${theme.text}`}>
        <Icon size={20} />
      </div>
    </div>
  );
};

const KPIProgress: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div 
        className={`h-2.5 rounded-full transition-all duration-1000 ${color}`} 
        style={{ width: `${clamped}%` }}
      ></div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { items, transactions } = useInventory();
  const { t } = useLanguage();
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  // --- Basic Stats Calculations ---
  const totalItems = items.length;
  const totalStock = items.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minLevel);
  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const recentTransactions = transactions.slice(0, 5);

  // --- Advanced KPI Calculations (Based on User Requirements) ---

  // 1. Service Level = 1 - (B + C) / (A + B)
  // A = Total Material Requests (OUT transactions)
  // B = Not Available (Items with 0 stock, Proxy for failed request)
  // C = Bad Quality (Assumed 0 as not tracked)
  const kpiServiceLevel = useMemo(() => {
    const A = transactions.filter(t => t.type === 'OUT').length;
    // Proxy: Count how many items are currently at 0 (Potential stockout events)
    const B = items.filter(i => i.quantity === 0).length; 
    const C = 0; // Quality not tracked yet
    const denominator = A + B;
    if (denominator === 0) return 100;
    
    const result = 1 - ((B + C) / denominator);
    return Math.round(result * 100);
  }, [items, transactions]);

  // 2. Cycle Counting Completion = B / A
  // A = Sites created > 1 year ago
  // B = Sites NOT counted in last 12 months
  const kpiCycleCounting = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    
    // Find creation date (first NEW_ITEM trx) for each item
    const oldItems = items.filter(item => {
      const creationTrx = transactions.slice().reverse().find(t => t.itemId === item.id && t.type === 'NEW_ITEM');
      if (!creationTrx) return false; // Assume new if no log
      return new Date(creationTrx.timestamp) < oneYearAgo;
    });

    const A = oldItems.length;
    if (A === 0) return 0; // No old items

    // Count items with NO transaction in last 12 months (Proxy for not counted/audited)
    const B = oldItems.filter(item => {
      const lastTrx = transactions.find(t => t.itemId === item.id);
      if (!lastTrx) return true; // Never touched
      return new Date(lastTrx.timestamp) < oneYearAgo;
    }).length;

    // Ideally we want this close to 0 (all counted). Formula asks for B/A
    return Math.round((B / A) * 100);
  }, [items, transactions]);

  // 3. Inventory Accuracy = 1 - B / A
  // A = Total Docs
  // B = Adjustments (Using a proxy or 0 if perfect)
  const kpiAccuracy = useMemo(() => {
    const A = transactions.length;
    if (A === 0) return 100;
    const B = 0; // Assuming perfect entry for now as we lack 'ADJUSTMENT' type
    return 100; 
  }, [transactions]);

  // 4. Non-Used Materials = B / A
  // A = Total Items
  // B = Out of stock > 3 months (Actually prompt says "Materials ran out and stayed out 3 months")
  // Let's interpret as: Items with 0 quantity and last OUT transaction > 3 months ago
  const kpiNonUsed = useMemo(() => {
    const A = items.length;
    if (A === 0) return 0;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const B = items.filter(item => {
      if (item.quantity > 0) return false; // Has stock
      const lastOut = transactions.find(t => t.itemId === item.id && t.type === 'OUT');
      // If no OUT ever, or last OUT was long ago
      if (!lastOut) return true; 
      return new Date(lastOut.timestamp) < threeMonthsAgo;
    }).length;

    return Math.round((B / A) * 100);
  }, [items, transactions]);

  // 5. Obsolete Materials = (B - C) / A
  // A = Total Items
  // B = No movement 3 years
  // C = Classified A or Z (in BOM)
  const kpiObsolete = useMemo(() => {
    const A = items.length;
    if (A === 0) return 0;

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const stagnantItems = items.filter(item => {
       const lastTrx = transactions.find(t => t.itemId === item.id);
       if (!lastTrx) return true; // No movement ever recorded
       return new Date(lastTrx.timestamp) < threeYearsAgo;
    });

    const B = stagnantItems.length;
    // C = Items in B that are Category A or Z
    const C = stagnantItems.filter(item => item.category === 'A' || item.category === 'Z').length;

    return Math.round(((B - C) / A) * 100);
  }, [items, transactions]);

  // 6. BOM Completion = B / A
  // A = Total Items
  // B = Items linked to BOM (We use `specifications` presence as proxy)
  const kpiBOM = useMemo(() => {
    const A = items.length;
    if (A === 0) return 0;
    const B = items.filter(i => i.specifications && i.specifications.length > 5).length;
    return Math.round((B / A) * 100);
  }, [items]);

  // 7. ABCZ Completion = B / A
  // A = Total Items
  // B = Items with valid category
  const kpiABCZ = useMemo(() => {
    const A = items.length;
    if (A === 0) return 0;
    const B = items.filter(i => ['A', 'B', 'C', 'Z'].includes(i.category)).length;
    return Math.round((B / A) * 100);
  }, [items]);


  // --- Graph Data ---
  const categoryData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, Z: 0 };
    items.forEach(item => {
      if (counts[item.category] !== undefined) counts[item.category]++;
    });
    return Object.keys(counts).map(key => ({ name: `${t.dashboard.category} ${key}`, value: counts[key as keyof typeof counts] }));
  }, [items, t]);

  const stockLevelData = useMemo(() => {
    return items.slice(0, 10).map(item => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + '..' : item.name,
      quantity: item.quantity,
      min: item.minLevel
    }));
  }, [items]);

  const topTransactedItems = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      counts[t.itemName] = (counts[t.itemName] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ 
        name: name.length > 12 ? name.substring(0, 12) + '..' : name, 
        count 
      }));
  }, [transactions]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.dashboard.title}</h2>

      {/* Low Stock Notification Banner */}
      {isAlertVisible && lowStockItems.length > 0 && (
        <div className="bg-red-50 border-r-4 border-l-4 border-l-transparent border-r-red-500 rtl:border-r-red-500 rtl:border-l-transparent ltr:border-l-red-500 ltr:border-r-transparent p-4 rounded-lg shadow-sm relative mb-6 animate-pulse-slow">
          <div className="flex items-start">
            <div className="flex-shrink-0 mx-3">
              <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800">{t.dashboard.alertTitle}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  <span className="font-bold text-red-900">{lowStockItems.length}</span> {t.dashboard.alertBody}
                </p>
                <div className="bg-white/50 rounded-md p-3 mt-2 border border-red-100">
                  <ul className="list-disc list-inside space-y-1">
                    {lowStockItems.slice(0, 3).map(item => (
                      <li key={item.id} className="text-red-800 font-medium">
                        {item.name} <span className="text-red-500 text-xs">({t.dashboard.current}: {item.quantity} / {t.dashboard.min}: {item.minLevel})</span>
                      </li>
                    ))}
                  </ul>
                  {lowStockItems.length > 3 && (
                    <p className="text-xs text-red-500 mt-2 mx-4">... {lowStockItems.length - 3} more</p>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setIsAlertVisible(false)}
                  type="button"
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.dashboard.totalItems} 
          value={totalItems} 
          icon={PackageCheck} 
          color="blue" 
        />
        <StatCard 
          title={t.dashboard.totalStock} 
          value={totalStock} 
          icon={TrendingUp} 
          color="teal" 
        />
        <StatCard 
          title={t.dashboard.lowStock} 
          value={lowStockItems.length} 
          icon={AlertTriangle} 
          color="orange" 
        />
        <StatCard 
          title={t.dashboard.totalValue} 
          value={totalValue.toLocaleString()} 
          icon={Coins} 
          color="purple" 
        />
      </div>

      {/* KPI Section - Performance Monitoring */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
           <Percent className="text-blue-600" />
           {t.dashboard.kpiTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {/* Service Level */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.serviceLevel}</span>
                <Activity size={18} className="text-green-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiServiceLevel}%</div>
              <KPIProgress percentage={kpiServiceLevel} color="bg-green-500" />
              <p className="text-xs text-gray-400 mt-2">Target: &gt;95%</p>
           </div>

           {/* Cycle Counting */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.cycleCount}</span>
                <ClipboardCheck size={18} className="text-orange-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiCycleCounting}%</div>
              <KPIProgress percentage={kpiCycleCounting} color="bg-orange-500" />
              <p className="text-xs text-gray-400 mt-2">Uncounted (Yearly): {kpiCycleCounting}%</p>
           </div>

           {/* Accuracy */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.accuracy}</span>
                <PackageCheck size={18} className="text-blue-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiAccuracy}%</div>
              <KPIProgress percentage={kpiAccuracy} color="bg-blue-500" />
           </div>

           {/* Non-Used Materials */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.nonUsed}</span>
                <AlertOctagon size={18} className="text-red-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiNonUsed}%</div>
              <KPIProgress percentage={kpiNonUsed} color="bg-red-500" />
              <p className="text-xs text-gray-400 mt-2">Idle &gt; 3 Months</p>
           </div>

           {/* Obsolete Materials */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.obsolete}</span>
                <X size={18} className="text-slate-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiObsolete}%</div>
              <KPIProgress percentage={kpiObsolete} color="bg-slate-500" />
              <p className="text-xs text-gray-400 mt-2">Idle &gt; 3 Years (Excl. A/Z)</p>
           </div>

           {/* BOM Completion */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.bom}</span>
                <Layers size={18} className="text-teal-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiBOM}%</div>
              <KPIProgress percentage={kpiBOM} color="bg-teal-500" />
           </div>

           {/* ABCZ Completion */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600">{t.dashboard.kpis.abcz}</span>
                <TrendingUp size={18} className="text-indigo-500"/>
              </div>
              <div className="text-3xl font-bold text-gray-800">{kpiABCZ}%</div>
              <KPIProgress percentage={kpiABCZ} color="bg-indigo-500" />
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t.dashboard.stockDistribution}</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t.dashboard.topStock}</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockLevelData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                <Bar dataKey="quantity" name={t.dashboard.current} fill="#0d9488" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="min" name={t.dashboard.min} fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
             <Activity className="text-purple-600" size={20} />
             <h3 className="text-lg font-bold text-gray-800">{t.dashboard.topMovers}</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
             {topTransactedItems.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTransactedItems} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" name="Count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm">{t.common.noData}</div>
             )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t.dashboard.recentTrx}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">{t.dashboard.table.date}</th>
                  <th className="px-6 py-3">{t.dashboard.table.type}</th>
                  <th className="px-6 py-3">{t.dashboard.table.item}</th>
                  <th className="px-6 py-3">{t.dashboard.table.qty}</th>
                  <th className="px-6 py-3">{t.dashboard.table.supervisor}</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((trx) => (
                  <tr key={trx.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{new Date(trx.timestamp).toLocaleDateString(t.lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trx.type === 'IN' || trx.type === 'NEW_ITEM' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trx.type === 'NEW_ITEM' ? t.dashboard.types.new : trx.type === 'OUT' ? t.dashboard.types.out : t.dashboard.types.in}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{trx.itemName}</td>
                    <td className="px-6 py-4">{trx.quantity}</td>
                    <td className="px-6 py-4">{trx.supervisorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;