import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../insights/insights_repository.dart';
import 'report_repository.dart';

/// One-page A4 monthly report for sharing (WhatsApp, email, print).
Future<Uint8List> buildReportPdf(MonthlyReport r) async {
  final logo = pw.MemoryImage((await rootBundle.load('assets/brand/logo.png')).buffer.asUint8List());
  final regular = pw.Font.ttf(await rootBundle.load('assets/fonts/PlusJakartaSans-Medium.ttf'));
  final bold = pw.Font.ttf(await rootBundle.load('assets/fonts/PlusJakartaSans-ExtraBold.ttf'));

  const violet = PdfColor.fromInt(0xFF6334E2);
  const ink = PdfColor.fromInt(0xFF16112E);
  const muted = PdfColor.fromInt(0xFF5B5577);
  const line = PdfColor.fromInt(0xFFE4E1F2);
  const soft = PdfColor.fromInt(0xFFF5F2FC);

  pw.TextStyle t(double size, {bool b = false, PdfColor color = ink}) => pw.TextStyle(font: b ? bold : regular, fontSize: size, color: color);

  String change(int now, int? before) {
    if (before == null) return '';
    final p = percentChange(now, before);
    return p == null ? '' : ' (${p >= 0 ? '+' : ''}$p% vs last month)';
  }

  pw.Widget section(String title, List<pw.Widget> rows) => pw.Container(
        margin: const pw.EdgeInsets.only(top: 14),
        padding: const pw.EdgeInsets.all(14),
        decoration: pw.BoxDecoration(border: pw.Border.all(color: line), borderRadius: pw.BorderRadius.circular(12)),
        child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          pw.Text(title.toUpperCase(), style: t(9, b: true, color: muted)),
          pw.SizedBox(height: 8),
          ...rows,
        ]),
      );

  pw.Widget row(String label, String value, [String note = '']) => pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 3),
        child: pw.Row(children: [
          pw.Expanded(child: pw.Text(label, style: t(11, color: muted))),
          pw.Text(value, style: t(12, b: true)),
          if (note.isNotEmpty) pw.Text(note, style: t(9, color: muted)),
        ]),
      );

  final g = r.google;
  final pg = r.previousGoogle;
  final doc = pw.Document(title: '${r.businessName} — ${monthLabel(r.month)}', author: 'RevYne');
  doc.addPage(pw.Page(
    pageFormat: PdfPageFormat.a4,
    margin: const pw.EdgeInsets.all(36),
    build: (_) => pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
      pw.Row(children: [
        pw.ClipRRect(horizontalRadius: 6, verticalRadius: 6, child: pw.Image(logo, width: 26, height: 26)),
        pw.SizedBox(width: 8),
        pw.Text('RevYne monthly report', style: t(12, b: true, color: violet)),
      ]),
      pw.SizedBox(height: 14),
      pw.Text(r.businessName, style: t(22, b: true)),
      pw.Text('${monthLabel(r.month)}${r.city == null ? '' : ' · ${r.city}'}${r.complete ? '' : ' · so far'}', style: t(12, color: muted)),
      if (g != null)
        section('On Google', [
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: pw.BoxDecoration(color: soft, borderRadius: pw.BorderRadius.circular(8)),
            child: pw.Row(children: [
              pw.Text('${g.views}', style: t(26, b: true, color: violet)),
              pw.SizedBox(width: 8),
              pw.Text('people saw your profile${change(g.views, pg?.views)}', style: t(11, color: muted)),
            ]),
          ),
          pw.SizedBox(height: 6),
          row('From Google Search', '${g.searchViews}'),
          row('From Google Maps', '${g.mapsViews}'),
          row('Calls', '${g.calls}', change(g.calls, pg?.calls)),
          row('Direction requests', '${g.directions}', change(g.directions, pg?.directions)),
          row('Website clicks', '${g.websiteClicks}'),
          row('Chats', '${g.chats}'),
        ]),
      if (r.reviews != null)
        section('Reviews', [
          row('New Google reviews', '${r.reviews!.received}'),
          if (r.reviews!.averageRating != null) row('Average rating this month', '${r.reviews!.averageRating} / 5'),
          row('Replied', '${r.reviews!.replied} of ${r.reviews!.received}'),
          if (r.ratingAverage != null) row('Overall Google rating now', '${r.ratingAverage!.toStringAsFixed(1)} from ${r.ratingTotal} reviews'),
        ]),
      if (r.pageVisits != null)
        section('RevYne review page', [
          row('Customers who opened your review link', '${r.pageVisits}'),
          row('Went on to Google', '${r.wentToGoogle}'),
          row('Private messages to you', '${r.privateMessages}'),
        ]),
      if (r.postsPublished != null)
        section('Posts', [row('Posts published', '${r.postsPublished}', r.offers + r.events > 0 ? ' (${r.offers} offers, ${r.events} events)' : '')]),
      if (r.searches.isNotEmpty) section('Top searches', [for (final k in r.searches) row(k.keyword, k.label)]),
      pw.Spacer(),
      pw.Text(
        'Google figures are from your Google Business Profile${r.statsThrough == null ? '' : ', up to ${r.statsThrough!.day} ${monthNames[r.statsThrough!.month - 1]}'}. Small search counts show as "< N".',
        style: t(8.5, color: muted),
      ),
    ]),
  ));
  return doc.save();
}
