import React, { useState } from 'react';
import { Plus, Trash2, FileText, Send, AlertTriangle } from 'lucide-react';
import { InvoiceItem } from '../../types/customer';

export const InvoiceCreate: React.FC = () => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [creditLimit] = useState(5000); 
  const [currentOutstanding] = useState(4200); 

  const addItem = () => {
    setItems([...items, { itemId: Date.now().toString(), description: '', quantity: 1, rate: 0, discount: 0, lineTotal: 0 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    item.lineTotal = (item.quantity * item.rate) - item.discount;
    updated[index] = item;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const projectedTotal = currentOutstanding + subTotal;
  const isCreditExceeded = projectedTotal > creditLimit;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" /> Create Sales Invoice
      </h2>

      {isCreditExceeded && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span><strong>Credit Limit Warning:</strong> Projected total (${projectedTotal}) exceeds customer credit limit (${creditLimit})!</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <select className="p-2 border rounded-lg" value={customer} onChange={(e) => setCustomer(e.target.value)}>
          <option value="">Select Customer...</option>

        </select>
        <input type="date" className="p-2 border rounded-lg" defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.itemId} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Item Description"
              className="p-2 border rounded-lg flex-grow"
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
            />
            <input
              type="number"
              placeholder="Qty"
              className="p-2 border rounded-lg w-20"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
            />
            <input
              type="number"
              placeholder="Rate"
              className="p-2 border rounded-lg w-28"
              value={item.rate || ''}
              onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
            />
            <input
              type="number"
              placeholder="Discount"
              className="p-2 border rounded-lg w-28"
              value={item.discount || ''}
              onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
            />
            <span className="w-28 font-semibold text-right">${item.lineTotal.toFixed(2)}</span>
            <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button onClick={addItem} className="flex items-center gap-2 text-indigo-600 font-semibold p-2 hover:bg-indigo-50 rounded-lg">
          <Plus className="w-4 h-4" /> Add Item Line
        </button>
      </div>

      <div className="border-t pt-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Subtotal: ${subTotal.toFixed(2)}</p>
          <p className="text-xl font-bold">Grand Total: ${subTotal.toFixed(2)}</p>
        </div>
        <button
          disabled={isCreditExceeded || items.length === 0}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium ${
            isCreditExceeded ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Send className="w-4 h-4" /> Post Invoice
        </button>
      </div>
    </div>
  );
};