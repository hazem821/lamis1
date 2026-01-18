import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { History as HistoryIcon, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const History: React.FC = () => {
  const { transactions, deleteTransaction } = useInventory();
  const { t } = useLanguage();

  const handleExport = () => {
    // Prepare data for Excel
    const data = transactions.map(t => ({
      'ID': t.id,
      'Date': new Date(t.timestamp).toLocaleDateString(),
      'Time': new Date(t.timestamp).toLocaleTimeString(),
      'Type': t.type,
      'Item ID': t.itemId,
      'Item Name': t.itemName,
      'Qty': t.quantity,
      'Supervisor': t.supervisorName || '-',
      'Receiver': t.receiverName || '-',
      'Location': t.location || '-',
      'Delivery Date': t.deliveryDate ? new Date(t.deliveryDate).toLocaleDateString() : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, `Lamis_Inventory_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = (id: string, itemName: string, type: string) => {
    if (window.confirm(`${t.common.confirmDelete}`)) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <HistoryIcon className="text-teal-600" />
          {t.history.title}
        </h2>
        <button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
        >
          <Download size={18} />
          {t.history.exportBtn}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${t.dir === 'rtl' ? 'text-right' : 'text-left'} text-gray-500`}>
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4">{t.history.table.id}</th>
                <th className="px-6 py-4">{t.history.table.dateTime}</th>
                <th className="px-6 py-4">{t.history.table.type}</th>
                <th className="px-6 py-4">{t.history.table.item}</th>
                <th className="px-6 py-4">{t.history.table.qty}</th>
                <th className="px-6 py-4">{t.history.table.details}</th>
                <th className="px-6 py-4">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    {t.history.empty}
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono">{trx.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {new Date(trx.timestamp).toLocaleDateString(t.lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5" dir="ltr">
                        {new Date(trx.timestamp).toLocaleTimeString(t.lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trx.type === 'NEW_ITEM' ? 'bg-blue-100 text-blue-800' :
                        trx.type === 'IN' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                         {trx.type === 'NEW_ITEM' ? t.history.types.new : trx.type === 'OUT' ? t.history.types.out : t.history.types.in}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{trx.itemName}</div>
                      <div className="text-xs text-gray-500">#{trx.itemId}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">{trx.quantity}</td>
                    <td className="px-6 py-4 text-xs">
                      {trx.supervisorName && <div><span className="font-bold">{t.history.labels.supervisor}:</span> {trx.supervisorName}</div>}
                      {trx.receiverName && <div><span className="font-bold">{t.history.labels.receiver}:</span> {trx.receiverName}</div>}
                      {trx.location && <div><span className="font-bold">{t.history.labels.location}:</span> {trx.location}</div>}
                      {trx.deliveryDate && <div><span className="font-bold">{t.history.labels.date}:</span> {new Date(trx.deliveryDate).toLocaleDateString(t.lang === 'ar' ? 'ar-EG' : 'en-US')}</div>}
                      {trx.signature && <div className="mt-1"><span className="font-bold text-green-600 text-[10px] border border-green-200 bg-green-50 px-1 rounded">{t.history.labels.signed}</span></div>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(trx.id, trx.itemName, trx.type)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;