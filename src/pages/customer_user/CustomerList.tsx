import React, { useState } from 'react';
import { UserPlus, Users, Search, DollarSign, Clock } from 'lucide-react';
import { Customer } from '../../types/customer';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<Customer>({
    customerCode: '',
    name: '',
    phone: '',
    email: '',
    creditLimit: 0,
    creditDays: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomers([...customers, { ...formData, _id: Date.now().toString() }]);
    setFormData({ customerCode: '', name: '', phone: '', email: '', creditLimit: 0, creditDays: 30 });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-blue-600" /> New Customer Entry
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Customer Code"
            className="p-2 border rounded-lg"
            value={formData.customerCode}
            onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Customer Name"
            className="p-2 border rounded-lg"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="p-2 border rounded-lg"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="p-2 border rounded-lg"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="number"
              placeholder="Credit Limit"
              className="p-2 pl-9 border rounded-lg w-full"
              value={formData.creditLimit || ''}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
            />
          </div>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="number"
              placeholder="Credit Days"
              className="p-2 pl-9 border rounded-lg w-full"
              value={formData.creditDays || ''}
              onChange={(e) => setFormData({ ...formData, creditDays: Number(e.target.value) })}
            />
          </div>
          <button type="submit" className="md:col-span-3 bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
            <UserPlus className="w-4 h-4" /> Save Customer
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-700" /> Customer List
        </h2>
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Credit Limit</th>
                <th className="p-3">Credit Terms</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{c.customerCode}</td>
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">${c.creditLimit.toLocaleString()}</td>
                  <td className="p-3">{c.creditDays} Days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};