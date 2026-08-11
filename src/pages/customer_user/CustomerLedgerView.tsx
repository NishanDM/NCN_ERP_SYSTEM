import React from 'react';
import { BookOpen, ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react';

export const CustomerLedgerView: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" /> Customer Statement & Ledger
        </h2>
        <div className="flex gap-4">
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <span className="text-xs text-purple-600 font-bold block">TOTAL OUTSTANDING</span>
            <span className="text-lg font-extrabold text-purple-900">$1,000.00</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <span className="text-xs text-emerald-600 font-bold block">ADVANCE BALANCE</span>
            <span className="text-lg font-extrabold text-emerald-900">$200.00</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
              <Scale className="w-3 h-3" /> NET POSITION
            </span>
            <span className="text-lg font-extrabold text-blue-900">$800.00</span>
          </div>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b text-gray-600">
            <th className="p-3">Date</th>
            <th className="p-3">Type</th>
            <th className="p-3">Ref No</th>
            <th className="p-3">Debit (+ Owed)</th>
            <th className="p-3">Credit (- Paid)</th>
            <th className="p-3">Balance After</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b hover:bg-gray-50">
            <td className="p-3">2026-08-10</td>
            <td className="p-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">INVOICE</span></td>
            <td className="p-3 font-mono">INV-1001</td>
            <td className="p-3 text-red-600 font-semibold flex items-center gap-1"><ArrowUpRight className="w-4 h-4"/> $1,000.00</td>
            <td className="p-3 text-gray-400">-</td>
            <td className="p-3 font-bold">$1,000.00</td>
          </tr>
          <tr className="border-b hover:bg-gray-50">
            <td className="p-3">2026-08-11</td>
            <td className="p-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">PAYMENT</span></td>
            <td className="p-3 font-mono font-normal">PAY-5002</td>
            <td className="p-3 text-gray-400">-</td>
            <td className="p-3 text-green-600 font-semibold flex items-center gap-1"><ArrowDownLeft className="w-4 h-4"/> $1,200.00</td>
            <td className="p-3 font-bold">-$200.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};