export interface Customer {
  _id?: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string;
  creditLimit: number;
  creditDays: number;
}

export interface InvoiceItem {
  itemId: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  lineTotal: number;
}

export interface CustomerLedgerEntry {
  _id: string;
  transactionDate: string;
  entryType: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'CHEQUE_BOUNCE' | 'ADVANCE_RECEIVED';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  refDocNumber: string;
  balanceAfter: number;
  remarks?: string;
}