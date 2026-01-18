import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { ItemType, ItemCategory } from '../types';
import { PlusCircle, Camera, CheckCircle } from 'lucide-react';

const NewItem: React.FC = () => {
  const { addItem } = useInventory();
  const { t } = useLanguage();
  
  // Form State
  const [name, setName] = useState('');
  const [specs, setSpecs] = useState('');
  const [type, setType] = useState<ItemType>('ERSA');
  const [category, setCategory] = useState<ItemCategory>('A');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('قطعة');
  const [shelfNumber, setShelfNumber] = useState('');
  
  const [minLevel, setMinLevel] = useState<string | number>('');
  const [maxLevel, setMaxLevel] = useState<string | number>('');
  const [price, setPrice] = useState<string | number>('');
  
  const [image, setImage] = useState<string | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Dynamic Categories based on Type
  const availableCategories: ItemCategory[] = type === 'NLAG' ? ['C'] : ['A', 'Z', 'B'];

  const handleTypeChange = (newType: ItemType) => {
    setType(newType);
    if (newType === 'NLAG') setCategory('C');
    else setCategory('A');
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Error accessing camera");
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalMin = minLevel === '' ? 0 : Number(minLevel);
    const finalMax = maxLevel === '' ? 0 : Number(maxLevel);
    const finalPrice = price === '' ? 0 : Number(price);

    if (finalMax > 0 && finalMin > 0 && finalMin >= finalMax) {
      alert(t.newItem.validationMinMax);
      return;
    }

    const finalImage = image || 'https://via.placeholder.com/300?text=No+Image';

    addItem({
      name,
      specifications: specs,
      type,
      category,
      image: finalImage,
      quantity,
      unit,
      shelfNumber: shelfNumber || '-',
      minLevel: finalMin,
      maxLevel: finalMax,
      price: finalPrice
    });

    alert(t.newItem.successMsg);
    // Reset
    setName('');
    setSpecs('');
    setQuantity(1);
    setUnit('قطعة');
    setShelfNumber('');
    setMinLevel('');
    setMaxLevel('');
    setPrice('');
    setImage(null);
    setType('ERSA');
    setCategory('A');
  };

  return (
    <div className="p-6">
       <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <PlusCircle className="text-teal-600" />
        {t.newItem.title}
      </h2>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Image Section */}
          <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-l border-gray-100">
             <h3 className="font-bold text-gray-700 mb-4">{t.newItem.cameraBtn}</h3>
             
             <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
               {isCameraOpen ? (
                 <>
                  <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                 </>
               ) : image ? (
                 <img src={image} alt="Captured" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-gray-400 text-center p-4">
                   <Camera size={48} className="mx-auto mb-2" />
                   <span className="text-sm">{t.newItem.noImage}</span>
                 </div>
               )}
             </div>

             {isCameraOpen ? (
               <button onClick={captureImage} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
                 {t.newItem.capture}
               </button>
             ) : (
               <button onClick={startCamera} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2">
                 <Camera size={18} />
                 {t.newItem.openCamera}
               </button>
             )}
          </div>

          {/* Form Section */}
          <div className="md:col-span-2 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.autoId}</label>
                   <input disabled value={t.newItem.generated} className="w-full p-2 bg-gray-100 border rounded text-gray-500 text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.itemName}</label>
                   <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded focus:ring-teal-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.initialQty}</label>
                  <input required type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-2 border rounded focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.common.unit}</label>
                  <select 
                    value={unit} 
                    onChange={e => setUnit(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-teal-500 bg-white"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كغ">كغ</option>
                    <option value="لتر">لتر</option>
                    <option value="متر">متر</option>
                    <option value="علبة">علبة</option>
                    <option value="طقم">طقم</option>
                    <option value="طن">طن</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.shelf}</label>
                  <input 
                    type="text" 
                    value={shelfNumber} 
                    onChange={e => setShelfNumber(e.target.value)} 
                    className="w-full p-2 border rounded focus:ring-teal-500" 
                    placeholder="A-01" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.specs}</label>
                  <textarea required rows={3} value={specs} onChange={e => setSpecs(e.target.value)} className="w-full p-2 border rounded focus:ring-teal-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.minLevel}</label>
                   <input 
                      type="number" 
                      min="0" 
                      value={minLevel} 
                      onChange={e => setMinLevel(e.target.value)} 
                      className="w-full p-2 border rounded focus:ring-teal-500" 
                      placeholder={t.common.optional}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.maxLevel}</label>
                   <input 
                      type="number" 
                      min="0" 
                      value={maxLevel} 
                      onChange={e => setMaxLevel(e.target.value)} 
                      className="w-full p-2 border rounded focus:ring-teal-500" 
                      placeholder={t.common.optional}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.unitPrice}</label>
                   <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      className="w-full p-2 border rounded focus:ring-teal-500" 
                      placeholder={t.common.optional}
                   />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.itemType}</label>
                  <select 
                    value={type} 
                    onChange={e => handleTypeChange(e.target.value as ItemType)}
                    className="w-full p-2 border rounded focus:ring-teal-500 bg-white"
                  >
                    <option value="ERSA">ERSA</option>
                    <option value="NLAG">NLAG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.newItem.itemCategory}</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value as ItemCategory)}
                    className="w-full p-2 border rounded focus:ring-teal-500 bg-white"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  {t.newItem.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewItem;