import React from 'react';
import { CreditCard, Check, XOctagon, Clock } from 'lucide-react';

export const ChequeManagement: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-amber-600" /> Cheque Clearance & Bounce Management
      </h2>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b text-gray-600">
            <th className="p-3">Cheque No</th>
            <th className="p-3">Bank</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-3 font-mono">CHQ-88231</td>
            <td className="p-3">Commercial Bank</td>
            <td className="p-3 font-semibold">$1,200.00</td>
            <td className="p-3">
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                <Clock className="w-3 h-3" /> DEPOSITED
              </span>
            </td>
            <td className="p-3 flex justify-center gap-2">
              <button className="bg-green-600 text-white p-2 rounded-lg flex items-center gap-1 text-sm hover:bg-green-700">
                <Check className="w-4 h-4" /> Clear
              </button>
              <button className="bg-red-600 text-white p-2 rounded-lg flex items-center gap-1 text-sm hover:bg-red-700">
                <XOctagon className="w-4 h-4" /> Bounce
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};