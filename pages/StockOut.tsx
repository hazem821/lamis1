import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { InventoryItem } from '../types';
import { Scan, Search, PackageMinus, X, Barcode, Camera, AlertCircle } from 'lucide-react';

const StockOut: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { items, processStockOut } = useInventory();
  const { t } = useLanguage();

  // Form State
  const [receiverName, setReceiverName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [qtyRequired, setQtyRequired] = useState(1);
  const [location, setLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  // Scanner State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found'>('idle');

  // Manual Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);

  // Validation State
  const isQuantityInvalid = selectedItem ? qtyRequired > selectedItem.quantity : false;

  // Effect for Manual Search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = items.filter(
        (item) =>
          item.name.includes(searchQuery) ||
          item.id.includes(searchQuery) ||
          item.barcode.includes(searchQuery) ||
          item.specifications.includes(searchQuery)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, items]);

  const handleStartCamera = async () => {
    try {
      setScanStatus('scanning');
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Error accessing camera.");
      setScanStatus('idle');
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setScanStatus('idle');
  };

  const simulateScan = () => {
    // Simulating a successful scan for demonstration
    if (items.length > 0) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      setSelectedItem(randomItem);
      handleStopCamera();
      setScanStatus('found');
    } else {
      alert("No items in inventory to scan");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (isQuantityInvalid) {
      alert(t.stockOut.qtyError);
      return;
    }

    processStockOut(selectedItem.id, qtyRequired, {
      receiverName,
      supervisorName,
      location,
      deliveryDate
    });

    // Reset Form
    alert(t.stockOut.successMsg);
    setSelectedItem(null);
    setReceiverName('');
    setSupervisorName('');
    setQtyRequired(1);
    setLocation('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setScanStatus('idle');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <PackageMinus className="text-red-500" />
        {t.stockOut.title}
      </h2>

      {/* Tabs */}
      <div className="flex mb-6 bg-white rounded-lg shadow-sm w-fit overflow-hidden border border-gray-200">
        <button
          onClick={() => { setActiveTab('scanner'); setSelectedItem(null); }}
          className={`px-6 py-3 flex items-center gap-2 ${activeTab === 'scanner' ? 'bg-teal-600 text-white' : 'hover:bg-gray-50'}`}
        >
          <Scan size={18} />
          {t.stockOut.tabScanner}
        </button>
        <button
          onClick={() => { setActiveTab('manual'); setSelectedItem(null); }}
          className={`px-6 py-3 flex items-center gap-2 ${activeTab === 'manual' ? 'bg-teal-600 text-white' : 'hover:bg-gray-50'}`}
        >
          <Search size={18} />
          {t.stockOut.tabManual}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Selection Method */}
        <div className="space-y-6">
          {activeTab === 'scanner' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 text-gray-700">{t.stockOut.scanTitle}</h3>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {!isCameraActive ? (
                  <button 
                    onClick={handleStartCamera}
                    className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Camera size={48} />
                    <span>{t.stockOut.cameraStart}</span>
                  </button>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80"></video>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-32 border-2 border-red-500 rounded-lg animate-pulse bg-transparent"></div>
                      <div className="absolute top-1/2 w-full h-0.5 bg-red-500"></div>
                    </div>
                  </>
                )}
              </div>
              
              {isCameraActive && (
                <div className="mt-4 flex gap-2">
                   <button 
                    type="button"
                    onClick={simulateScan}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {t.stockOut.simulate}
                  </button>
                   <button 
                    type="button"
                    onClick={handleStopCamera}
                    className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    {t.stockOut.cameraStop}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
               <h3 className="font-bold mb-4 text-gray-700">{t.stockOut.manualTitle}</h3>
               <div className="relative mb-4">
                 <input
                  type="text"
                  placeholder={t.stockOut.searchPlaceholder}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <Search className={`absolute ${t.dir === 'rtl' ? 'right-3' : 'left-3'} top-3.5 text-gray-400`} size={20} />
               </div>
               
               <div className="overflow-y-auto max-h-[400px] space-y-2">
                 {searchResults.length === 0 && searchQuery && (
                    <p className="text-center text-gray-500 py-4">{t.stockOut.noResults}</p>
                 )}
                 {searchResults.map((item) => (
                   <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 border rounded-lg cursor-pointer flex gap-3 hover:bg-teal-50 transition ${selectedItem?.id === item.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
                   >
                     <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover bg-gray-200" />
                     <div>
                       <p className="font-bold text-gray-800">{item.name}</p>
                       <p className="text-xs text-gray-500">#{item.id} | {item.quantity}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Right Side: Details & Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          {!selectedItem ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
               <PackageMinus size={64} className="mb-4 opacity-20" />
               <p>{t.stockOut.selectMsg}</p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                 <h3 className="text-xl font-bold text-teal-700">{t.stockOut.detailsTitle}</h3>
                 <button 
                  type="button" 
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-red-500"
                 >
                   <X size={24} />
                 </button>
               </div>

               {/* Item Info */}
               <div className="flex gap-4">
                 <img src={selectedItem.image} alt={selectedItem.name} className="w-24 h-24 rounded-lg object-cover bg-gray-100 border" />
                 <div className="flex-1 space-y-1">
                   <h4 className="font-bold text-lg">{selectedItem.name}</h4>
                   <p className="text-sm text-gray-600">#{selectedItem.id}</p>
                   <p className="text-sm text-gray-600">{selectedItem.specifications}</p>
                   <div className="flex items-center gap-2 mt-2">
                     <span className={`px-2 py-0.5 rounded text-xs ${selectedItem.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedItem.quantity > 0 ? t.stockOut.available : t.stockOut.unavailable}
                     </span>
                     <span className="text-sm font-bold">{t.stockOut.currentQty}: {selectedItem.quantity} {selectedItem.unit}</span>
                   </div>
                 </div>
                 <div className="flex flex-col items-center justify-center bg-white p-2 border rounded">
                    <Barcode size={32} />
                    <span className="text-xs mt-1 font-mono">{selectedItem.barcode}</span>
                 </div>
               </div>

               {/* Input Fields */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockOut.receiver}</label>
                   <input required type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)} className="w-full p-2 border rounded focus:ring-teal-500" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockOut.supervisor}</label>
                   <input required type="text" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} className="w-full p-2 border rounded focus:ring-teal-500" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockOut.location}</label>
                   <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded focus:ring-teal-500" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockOut.reqQty}</label>
                   <div className="relative">
                     <input 
                      required 
                      type="number" 
                      min="1" 
                      max={selectedItem.quantity} 
                      value={qtyRequired} 
                      onChange={e => setQtyRequired(parseInt(e.target.value) || 0)} 
                      className={`w-full p-2 border rounded focus:ring-teal-500 focus:outline-none ${isQuantityInvalid ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-300'}`}
                     />
                     {isQuantityInvalid && (
                       <div className="flex items-center gap-1 text-red-600 text-xs mt-1 animate-pulse">
                         <AlertCircle size={12} />
                         <span>{t.stockOut.qtyError} ({selectedItem.quantity})</span>
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockOut.delDate}</label>
                   <input 
                    required 
                    type="date" 
                    value={deliveryDate} 
                    onChange={e => setDeliveryDate(e.target.value)} 
                    className="w-full p-2 border rounded focus:ring-teal-500" 
                   />
                 </div>
               </div>

               <div className="pt-2 border-t border-gray-100">
                 <button 
                  type="submit"
                  disabled={selectedItem.quantity === 0 || isQuantityInvalid}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                 >
                   {isQuantityInvalid ? t.stockOut.qtyError : t.stockOut.confirmBtn}
                 </button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockOut;