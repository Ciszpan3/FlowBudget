export type Account = {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'SAVINGS';
  currency: string;
  openingBalance: string;
  balance: string;
};
export type Category = { id: string; name: string; color: string; icon: string; isIncome: boolean };
export type Transaction = {
  id: string;
  accountId: string;
  categoryId?: string | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: string;
  description: string;
  bookedAt: string;
  account: { id?: string; name: string };
  category?: { name: string; color: string } | null;
};
export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  limit: string;
  spent: string;
  category: Category;
};
