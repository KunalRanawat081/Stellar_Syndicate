export interface Member {
  id: string;
  address: string;
  name: string;
  orderAmount: number; // The amount of goods this member ordered
  hasPaid: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  isFixed: boolean; // Fixed costs are split evenly, variable are split proportionally
}

export interface Group {
  id: string;
  title: string;
  description: string;
  leadBuyer: string;
  totalGoodsTarget: number;
  status: 'Open' | 'Ordered' | 'Delivered' | 'Settled';
  members: Member[];
  expenses: Expense[];
  createdAt: number;
}
