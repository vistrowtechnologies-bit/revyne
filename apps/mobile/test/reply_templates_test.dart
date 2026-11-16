import 'package:flutter_test/flutter_test.dart';
import 'package:revyne_app/features/templates/reply_templates.dart';

void main() {
  test('fills {name} with the first name and {business} with the business', () {
    expect(fillTemplate('Thank you, {name}! We love {business}.', reviewer: 'Priya Sharma', business: 'Sharma Sweets'),
        'Thank you, Priya! We love Sharma Sweets.');
  });

  test('drops {name} cleanly when there is no usable name', () {
    expect(fillTemplate('Thank you, {name}!', reviewer: null, business: 'X'), 'Thank you!');
    expect(fillTemplate('Thanks {name} for visiting', reviewer: 'A Google User', business: 'X'), 'Thanks for visiting');
    expect(fillTemplate('Hi {name}, thanks', reviewer: '98765', business: 'X'), 'Hi, thanks');
  });

  test('starter templates use the placeholders', () {
    expect(starterTemplates.length, 3);
    expect(starterTemplates.every((t) => t.$2.contains('{name}')), isTrue);
  });
}
