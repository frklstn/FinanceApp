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
      plan: json['plan'] ?? 'free',
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
      color: json['color'] ?? '#10B981',
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

  Transaction({
    required this.id,
    required this.walletId,
    required this.amount,
    required this.type,
    this.note,
    required this.date,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? '',
      walletId: json['wallet_id'] ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      type: json['type'] ?? 'expense',
      note: json['note'],
      date: DateTime.tryParse(json['date']?.toString() ?? '') ?? DateTime.now(),
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
      category: json['category'] ?? 'pinjol',
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
