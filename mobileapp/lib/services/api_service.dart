import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'https://fin.llvy.space/api/v1';
  static const _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _apiKey = 'api_key';

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> setToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<void> saveJwtToken(String token) async {
    await setToken(token);
  }

  static Future<String?> getApiKey() async {
    return await _storage.read(key: _apiKey);
  }

  static Future<void> setApiKey(String key) async {
    await _storage.write(key: _apiKey, value: key);
  }

  static Future<void> clearAuth() async {
    await _storage.deleteAll();
  }

  static Future<Map<String, String>> _headers() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    final apiKey = await getApiKey();
    if (apiKey != null && apiKey.isNotEmpty) {
      headers['X-API-Key'] = apiKey;
      return headers;
    }

    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  // --- Auth ---
  static Future<bool> googleLogin({
    required String email,
    String? name,
    String? avatarUrl,
    String? idToken,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'name': name,
          'avatar_url': avatarUrl,
          'id_token': idToken,
        }),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] != null) {
          final token = json['data']['token'];
          if (token != null) {
            await setToken(token);
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  }

  static Future<bool> login(String identifier, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );

    if (res.statusCode == 200) {
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        final token = json['data']['token'];
        if (token != null) {
          await setToken(token);
          return true;
        }
      }
    }
    return false;
  }

  static Future<Profile?> getProfile() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] != null) {
          return Profile.fromJson(json['data']);
        }
      }
    } catch (_) {}
    return null;
  }

  // --- Dashboard Aggregations ---
  static Future<DashboardSummary?> getSummary() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/dashboard/summary'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] != null) {
          return DashboardSummary.fromJson(json['data']);
        }
      }
    } catch (_) {}
    return null;
  }

  static Future<List<CategorySpending>> getCategorySpending() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/dashboard/categories'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((c) => CategorySpending.fromJson(c)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  // --- Wallets ---
  static Future<List<Wallet>> getWallets() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/wallets'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((w) => Wallet.fromJson(w)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> createWallet(String name, double balance, String type, String color) async {
    final res = await http.post(
      Uri.parse('$baseUrl/wallets'),
      headers: await _headers(),
      body: jsonEncode({
        'name': name,
        'balance': balance,
        'type': type,
        'color': color,
        'icon': type == 'bank' ? 'bank' : 'wallet',
      }),
    );

    return res.statusCode == 201;
  }

  // --- Transactions ---
  static Future<List<Transaction>> getTransactions({int limit = 25}) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/transactions?limit=$limit'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((t) => Transaction.fromJson(t)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> createTransaction({
    required String walletId,
    required double amount,
    required String type,
    String? note,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/transactions'),
      headers: await _headers(),
      body: jsonEncode({
        'wallet_id': walletId,
        'amount': amount,
        'type': type,
        'note': note,
      }),
    );

    return res.statusCode == 201;
  }

  static Future<bool> deleteTransaction(String id) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/transactions/$id'),
      headers: await _headers(),
    );
    return res.statusCode == 200;
  }

  // --- Budgets (Anggaran) ---
  static Future<List<Budget>> getBudgets() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/budgets'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((b) => Budget.fromJson(b)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> setBudget({
    required String categoryId,
    required double amount,
    required int month,
    required int year,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/budgets'),
      headers: await _headers(),
      body: jsonEncode({
        'category_id': categoryId,
        'amount': amount,
        'month': month,
        'year': year,
      }),
    );
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // --- Savings (Tabungan) ---
  static Future<List<SavingsGoal>> getSavings() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/savings'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((s) => SavingsGoal.fromJson(s)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> createSavings({
    required String name,
    required double targetAmount,
    DateTime? targetDate,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/savings'),
      headers: await _headers(),
      body: jsonEncode({
        'name': name,
        'target_amount': targetAmount,
        'target_date': targetDate?.toIso8601String(),
      }),
    );
    return res.statusCode == 201;
  }

  static Future<bool> contributeSavings({
    required String savingsGoalId,
    required String walletId,
    required double amount,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/savings/contribute'),
      headers: await _headers(),
      body: jsonEncode({
        'savings_goal_id': savingsGoalId,
        'wallet_id': walletId,
        'amount': amount,
      }),
    );
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // --- Debts (Utang Piutang) ---
  static Future<List<DebtItem>> getDebts() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/debts'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((d) => DebtItem.fromJson(d)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> payDebt({
    required String debtId,
    required String walletId,
    required double amount,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/debts/pay'),
      headers: await _headers(),
      body: jsonEncode({
        'debt_id': debtId,
        'wallet_id': walletId,
        'amount': amount,
      }),
    );
    return res.statusCode == 200 || res.statusCode == 201;
  }

  // --- Loans / Pinjol ---
  static Future<List<LoanTracker>> getLoans() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/pinjol/loans'),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['success'] == true && json['data'] is List) {
          return (json['data'] as List).map((l) => LoanTracker.fromJson(l)).toList();
        }
      }
    } catch (_) {}
    return [];
  }
}
