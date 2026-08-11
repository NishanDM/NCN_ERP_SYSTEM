import React, { useState } from 'react';
import { CustomerList } from './CustomerList';
import { InvoiceCreate } from './InvoiceCreate';
import { PaymentAllocation } from './PaymentAllocation';
import { ChequeManagement } from './ChequeManagement';
import { CustomerLedgerView } from './CustomerLedgerView';

export const CustomerUserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoice' | 'payment' | 'cheques' | 'ledger'>('customers');

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex gap-2 border-b bg-white p-2 rounded-xl shadow-sm">
        {(['customers', 'invoice', 'payment', 'cheques', 'ledger'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize text-sm transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'customers' && <CustomerList />}
      {activeTab === 'invoice' && <InvoiceCreate />}
      {activeTab === 'payment' && <PaymentAllocation />}
      {activeTab === 'cheques' && <ChequeManagement />}
      {activeTab === 'ledger' && <CustomerLedgerView />}
    </div>
  );
};