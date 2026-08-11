import React, { useState } from 'react';
import { DollarSign, Layers, CheckCircle2 } from 'lucide-react';

export const PaymentAllocation: React.FC = () => {
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [mode, setMode] = useState<'FIFO' | 'MANUAL'>('FIFO');

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" /> Customer Payment Allocation
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-600 font-medium">Payment Amount ($)</label>
          <input
            type="number"
            className="p-2 border rounded-lg w-full mt-1"
            value={totalAmount || ''}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 font-medium">Allocation Mode</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setMode('FIFO')}
              className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-1 ${
                mode === 'FIFO' ? 'bg-green-50 border-green-600 text-green-700 font-bold' : ''
              }`}
            >
              <Layers className="w-4 h-4" /> FIFO Auto
            </button>
            <button
              onClick={() => setMode('MANUAL')}
              className={`flex-1 p-2 rounded-lg border ${
                mode === 'MANUAL' ? 'bg-green-50 border-green-600 text-green-700 font-bold' : ''
              }`}
            >
              Manual Selection
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-500">Unallocated Amount (Becomes Advance Balance):</span>
          <p className="text-lg font-bold text-green-600">${Math.max(0, totalAmount - 1000).toFixed(2)}</p>
        </div>
        <button className="bg-green-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <CheckCircle2 className="w-4 h-4" /> Process Payment
        </button>
      </div>
    </div>
  );
};