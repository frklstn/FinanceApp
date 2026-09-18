class Profile {
  final String id;
  final String email;
  final String? fullName;
  final String? avatarUrl;
  final String currency;
  final String plan;

  Profile({
    required this.id,
    required this.email,
    this.fullName,
    this.avatarUrl,
    required this.currency,
    required this.plan,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'],
      avatarUrl: json['avatar_url'],
      currency: json['currency'] ?? 'IDR',
      plan: json['plan'] ?? 'pro',
    );
  }
}

class Wallet {
  final String id;
  final String name;
  final String type;
  final double balance;
  final String color;
  final String icon;
  final bool isActive;

  Wallet({
    required this.id,
    required this.name,
    required this.type,
    required this.balance,
    required this.color,
    required this.icon,
    required this.isActive,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Dompet',
      type: json['type'] ?? 'cash',
      balance: double.tryParse(json['balance']?.toString() ?? '0') ?? 0.0,
      color: json['color'] ?? '#E2916A',
      icon: json['icon'] ?? 'wallet',
      isActive: json['is_active'] ?? true,
    );
  }
}

class Transaction {
  final String id;
  final String walletId;
  final double amount;
  final String type;
  final String? note;
  final DateTime date;
  final String? categoryName;

  Transaction({
    required this.id,
    required this.walletId,
    required this.amount,
    required this.type,
    this.note,
    required this.date,
    this.categoryName,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? '',
      walletId: json['wallet_id'] ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      type: json['type'] ?? 'expense',
      note: json['note'],
      date: DateTime.tryParse(json['date']?.toString() ?? '') ?? DateTime.now(),
      categoryName: json['categories'] != null ? json['categories']['name'] : null,
    );
  }
}

class DashboardSummary {
  final double totalBalance;
  final double totalIncome;
  final double totalExpense;
  final double netSavings;
  final int transactionCount;

  DashboardSummary({
    required this.totalBalance,
    required this.totalIncome,
    required this.totalExpense,
    required this.netSavings,
    required this.transactionCount,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalBalance: double.tryParse(json['total_balance']?.toString() ?? '0') ?? 0.0,
      totalIncome: double.tryParse(json['total_income']?.toString() ?? '0') ?? 0.0,
      totalExpense: double.tryParse(json['total_expense']?.toString() ?? '0') ?? 0.0,
      netSavings: double.tryParse(json['net_savings']?.toString() ?? '0') ?? 0.0,
      transactionCount: json['transaction_count'] ?? 0,
    );
  }
}

class CategorySpending {
  final String name;
  final double amount;
  final double share;

  CategorySpending({
    required this.name,
    required this.amount,
    required this.share,
  });

  factory CategorySpending.fromJson(Map<String, dynamic> json) {
    return CategorySpending(
      name: json['name'] ?? 'Lainnya',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      share: double.tryParse(json['share']?.toString() ?? '0') ?? 0.0,
    );
  }
}

class Budget {
  final String id;
  final String categoryId;
  final String categoryName;
  final double amount;
  final double spent;
  final int month;
  final int year;

  Budget({
    required this.id,
    required this.categoryId,
    required this.categoryName,
    required this.amount,
    required this.spent,
    required this.month,
    required this.year,
  });

  factory Budget.fromJson(Map<String, dynamic> json) {
    return Budget(
      id: json['id'] ?? '',
      categoryId: json['category_id'] ?? '',
      categoryName: json['category_name'] ?? 'Kategori',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      spent: double.tryParse(json['spent']?.toString() ?? '0') ?? 0.0,
      month: json['month'] ?? DateTime.now().month,
      year: json['year'] ?? DateTime.now().year,
    );
  }
}

class SavingsGoal {
  final String id;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final DateTime? targetDate;
  final String? icon;

  SavingsGoal({
    required this.id,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    this.targetDate,
    this.icon,
  });

  factory SavingsGoal.fromJson(Map<String, dynamic> json) {
    return SavingsGoal(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Target Tabungan',
      targetAmount: double.tryParse(json['target_amount']?.toString() ?? '0') ?? 0.0,
      currentAmount: double.tryParse(json['current_amount']?.toString() ?? '0') ?? 0.0,
      targetDate: json['target_date'] != null ? DateTime.tryParse(json['target_date']) : null,
      icon: json['icon'],
    );
  }
}

class DebtItem {
  final String id;
  final String personName;
  final double amount;
  final String type; // 'i_owe' (utang saya) or 'they_owe' (piutang saya)
  final String status;
  final DateTime? dueDate;
  final String? note;

  DebtItem({
    required this.id,
    required this.personName,
    required this.amount,
    required this.type,
    required this.status,
    this.dueDate,
    this.note,
  });

  factory DebtItem.fromJson(Map<String, dynamic> json) {
    return DebtItem(
      id: json['id'] ?? '',
      personName: json['person_name'] ?? 'Kontak',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      type: json['type'] ?? 'i_owe',
      status: json['status'] ?? 'active',
      dueDate: json['due_date'] != null ? DateTime.tryParse(json['due_date']) : null,
      note: json['note'],
    );
  }
}

class LoanTracker {
  final String id;
  final String category;
  final double amountReceived;
  final double totalRepayment;
  final double monthlyPayment;
  final int tenureMonths;
  final int dueDay;
  final String status;
  final String? notes;
  final double? totalRemainingBalance;

  LoanTracker({
    required this.id,
    required this.category,
    required this.amountReceived,
    required this.totalRepayment,
    required this.monthlyPayment,
    required this.tenureMonths,
    required this.dueDay,
    required this.status,
    this.notes,
    this.totalRemainingBalance,
  });

  factory LoanTracker.fromJson(Map<String, dynamic> json) {
    return LoanTracker(
      id: json['id'] ?? '',
      category: json['category'] ?? 'Pinjol',
      amountReceived: double.tryParse(json['amount_received']?.toString() ?? '0') ?? 0.0,
      totalRepayment: double.tryParse(json['total_repayment']?.toString() ?? '0') ?? 0.0,
      monthlyPayment: double.tryParse(json['monthly_payment']?.toString() ?? '0') ?? 0.0,
      tenureMonths: json['tenure_months'] ?? 1,
      dueDay: json['due_day'] ?? 1,
      status: json['status'] ?? 'active',
      notes: json['notes'],
      totalRemainingBalance: json['total_remaining_balance'] != null
          ? double.tryParse(json['total_remaining_balance'].toString())
          : null,
    );
  }
}
