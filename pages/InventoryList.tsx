import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Filter, List, Trash2, Download, Upload, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ItemType, ItemCategory, InventoryItem } from '../types';

const InventoryList: React.FC = () => {
  const { items, deleteItem, addItems } = useInventory();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.includes(searchTerm) || 
                          item.barcode.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t.common.confirmDelete} "${name}"?`)) {
      deleteItem(id);
      if (selectedItems.has(id)) {
        const newSet = new Set(selectedItems);
        newSet.delete(id);
        setSelectedItems(newSet);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const generatePrintWindow = (itemsToPrint: InventoryItem[]) => {
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) return;

    const htmlContent = itemsToPrint.map(item => `
      <div class="ticket">
        <h2>${item.name}</h2>
        <div style="font-size: 12px; color: #777;">${item.id}</div>
        <svg id="barcode-${item.id}"></svg>
        <div class="meta">
          <span>Shelf: ${item.shelfNumber || '-'}</span>
          <span>Cat: ${item.category}</span>
        </div>
      </div>
    `).join('');

    const jsScripts = itemsToPrint.map(item => `
      try {
        JsBarcode("#barcode-${item.id}", "${item.barcode}", {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 12,
          margin: 5
        });
      } catch(e) {}
    `).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background: #f9fafb; 
              padding: 20px; 
            }
            .container { 
              display: flex; 
              flex-wrap: wrap; 
              gap: 15px; 
              justify-content: center; 
            }
            .ticket {
              background: white;
              padding: 10px;
              border: 1px dashed #999;
              border-radius: 6px;
              text-align: center;
              width: 200px;
              height: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            h2 { 
              margin: 5px 0; 
              font-size: 14px; 
              color: #333; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              white-space: nowrap; 
              width: 100%; 
            }
            svg { max-width: 100%; height: auto; }
            .meta { 
              font-size: 11px; 
              color: #555; 
              width: 100%; 
              display: flex; 
              justify-content: space-between; 
              padding: 0 5px; 
              box-sizing: border-box; 
              margin-top: 5px;
            }
            @media print {
              body { background: white; padding: 0; }
              .ticket { border: 1px solid #ddd; margin: 0; box-shadow: none; }
              .container { gap: 10px; justify-content: flex-start; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${htmlContent}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              ${jsScripts}
              setTimeout(() => { window.print(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintSingle = (item: InventoryItem) => {
    generatePrintWindow([item]);
  };

  const handleBatchPrint = () => {
    const itemsToPrint = items.filter(item => selectedItems.has(item.id));
    if (itemsToPrint.length === 0) return;
    generatePrintWindow(itemsToPrint);
  };

  const handleExport = () => {
    const data = filteredItems.map(item => ({
      'ID': item.id,
      'Name': item.name,
      'Type': item.type,
      'Category': item.category,
      'Qty': item.quantity,
      'Unit': item.unit,
      'Price': item.price,
      'Shelf': item.shelfNumber,
      'Min': item.minLevel,
      'Max': item.maxLevel,
      'Specs': item.specifications,
      'Barcode': item.barcode
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const parsedItems: Omit<InventoryItem, 'id' | 'barcode'>[] = [];
      let skippedCount = 0;

      data.forEach((row: any) => {
        // Simple mapping, assumes user provides compatible columns or uses logic
        if (!row['اسم القطعة'] && !row['Name']) {
          skippedCount++;
          return;
        }

        const type: ItemType = (row['Type'] === 'NLAG' || row['النوع'] === 'NLAG') ? 'NLAG' : 'ERSA';
        const category: ItemCategory = ['A', 'B', 'C', 'Z'].includes(row['Category'] || row['الفئة']) ? (row['Category'] || row['الفئة']) : 'A';

        parsedItems.push({
          name: row['Name'] || row['اسم القطعة'] || 'Unnamed',
          specifications: row['Specs'] || row['المواصفات'] || '',
          type: type,
          category: category,
          image: 'https://via.placeholder.com/150?text=No+Image', 
          quantity: parseInt(row['Qty'] || row['الكمية']) || 0,
          unit: row['Unit'] || row['الوحدة'] || 'piece',
          shelfNumber: row['Shelf'] || row['رقم الرف'] || '-',
          minLevel: parseInt(row['Min'] || row['الحد الأدنى']) || 10,
          maxLevel: parseInt(row['Max'] || row['الحد الأعلى']) || 100,
          price: parseFloat(row['Price'] || row['السعر']) || 0,
        });
      });

      if (parsedItems.length > 0) {
        addItems(parsedItems);
        alert(t.inventoryList.importSuccess);
      } else {
        alert("No valid data found.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <List className="text-teal-600" />
          {t.inventoryList.title}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          
          {selectedItems.size > 0 && (
            <button 
              onClick={handleBatchPrint}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition whitespace-nowrap animate-fade-in"
            >
              <Printer size={18} />
              {t.inventoryList.printSelected} ({selectedItems.size})
            </button>
          )}

          <button 
            onClick={handleImportClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition whitespace-nowrap"
          >
            <Upload size={18} />
            {t.common.import}
          </button>

          <button 
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition whitespace-nowrap"
          >
            <Download size={18} />
            {t.common.export}
          </button>

          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder={t.inventoryList.searchPlaceholder}
              className={`w-full ${t.dir === 'rtl' ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className={`absolute ${t.dir === 'rtl' ? 'left-3' : 'right-3'} top-2.5 text-gray-400`} size={18} />
          </div>
          
          <div className="relative">
             <select 
              className={`w-full md:w-auto appearance-none border rounded-lg ${t.dir === 'rtl' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer`}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">{t.inventoryList.filterAll}</option>
              <option value="A">{t.inventoryList.filterA}</option>
              <option value="B">{t.inventoryList.filterB}</option>
              <option value="C">{t.inventoryList.filterC}</option>
              <option value="Z">{t.inventoryList.filterZ}</option>
            </select>
            <Filter className={`absolute ${t.dir === 'rtl' ? 'right-3' : 'left-3'} top-2.5 text-gray-400 pointer-events-none`} size={16} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${t.dir === 'rtl' ? 'text-right' : 'text-left'} text-gray-500`}>
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                  />
                </th>
                <th className="px-6 py-4">{t.common.image}</th>
                <th className="px-6 py-4">{t.inventoryList.table.def}</th>
                <th className="px-6 py-4">{t.inventoryList.table.typeCat}</th>
                <th className="px-6 py-4">{t.inventoryList.table.loc}</th>
                <th className="px-6 py-4">{t.common.quantity}</th>
                <th className="px-6 py-4">{t.inventoryList.table.specs}</th>
                <th className="px-6 py-4">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className={`border-b transition-colors ${selectedItems.has(item.id) ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'}`}>
                  <td className="px-4 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover border bg-gray-100" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-lg">{item.name}</div>
                    <div className="font-mono text-xs text-gray-500 mt-1">ID: {item.id}</div>
                    <div className="font-mono text-xs text-gray-400">Barcode: {item.barcode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded border border-gray-300">
                        Cat {item.category}
                      </span>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    <div className="font-mono text-sm font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block">
                      {item.shelfNumber || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-xl font-bold ${item.quantity <= item.minLevel ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity}
                    </div>
                    <div className="text-xs text-gray-500">{t.common.unit}: {item.unit}</div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-gray-600 line-clamp-2 max-w-xs">{item.specifications}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintSingle(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t.common.print}
                      >
                        <Printer size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-10 text-center flex flex-col items-center text-gray-400">
              <Search size={48} className="mb-2 opacity-20" />
              <p>{t.stockOut.noResults}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;