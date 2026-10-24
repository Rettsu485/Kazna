// ===== Основные типы данных =====

export type AccountType = 'cash' | 'debit_card' | 'checking' | 'deposit' | 'credit_card' | 'wallet' | 'business' | 'other';
export type OwnerType = 'personal' | 'business' | 'other_person';
export type TransactionType = 'expense' | 'income' | 'transfer' | 'debt_payment' | 'debt_given' | 'debt_received' | 'investment' | 'savings' | 'correction';
export type TransactionStatus = 'imported' | 'confirmed' | 'needs_review' | 'archived';
export type DebtType = 'credit_card' | 'loan' | 'personal_debt' | 'business_debt' | 'receivable';
export type DebtDirection = 'liability' | 'receivable';
export type DebtStatus = 'active' | 'paid_off';
export type BudgetPeriod = 'month' | 'week';
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type CategoryKind = 'expense' | 'income' | 'transfer' | 'debt_payment' | 'system';
export type ActorType = 'person' | 'organization' | 'project' | 'business' | 'bank' | 'service';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  ownerType: OwnerType;
  ownerName: string;
  currency: string;
  openingBalanceMinor: number;
  currentBalanceMinor: number;
  creditLimitMinor: number;
  debtBalanceMinor: number;
  interestRate: number;
  paymentDay: number;
  graceDays: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  role: string;
  color: string;
  notes: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  kind: CategoryKind;
  budgetable: boolean;
  includeInExpense: boolean;
  icon: string;
  color: string;
  notes: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  weekNumber: number;
  monthNumber: number;
  monthName: string;
  year: number;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  actorId: string | null;
  note: string;
  status: TransactionStatus;
  isRecurring: boolean;
  amortizationEnabled: boolean;
  amortizationMonths: number;
  excludeFromBudget: boolean;
  externalId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string | null;
  actorId: string | null;
  tagId: string | null;
  period: BudgetPeriod;
  amountLimitMinor: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  direction: DebtDirection;
  principalBalanceMinor: number;
  interestRate: number;
  monthlyPaymentMinor: number;
  minPaymentMinor: number;
  paymentDay: number;
  dueDate: string;
  status: DebtStatus;
  accountId: string | null;
  notes: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  transactionId: string | null;
  date: string;
  amountMinor: number;
  interestPartMinor: number;
  principalPartMinor: number;
  paymentType: 'regular' | 'early' | 'minimum' | 'fee';
  notes: string;
}

export interface RecurringRule {
  id: string;
  name: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  interval: number;
  amountMinor: number;
  accountId: string | null;
  categoryId: string | null;
  actorId: string | null;
  nextDate: string;
  isActive: boolean;
  type: 'payment' | 'income' | 'subscription' | 'transfer' | 'goal_contribution';
}

export interface Goal {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  deadline: string;
  priority: number;
  status: GoalStatus;
}

export interface AppSettings {
  locale: string;
  timezone: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  userName: string;
  userEmail: string;
}

export interface AppState {
  accounts: Account[];
  actors: Actor[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  recurringRules: RecurringRule[];
  goals: Goal[];
  settings: AppSettings;
  isAuthenticated: boolean;
}
