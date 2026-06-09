import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app_mobile/main.dart';

void main() {
  testWidgets('App renders splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const FinanceApp());

    // Verify the splash screen is rendered with app title
    expect(find.text(kAppTitle), findsOneWidget);
    expect(find.text('Personal Finance & Debt Survival Planner'), findsOneWidget);
  });
}
