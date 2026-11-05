import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../../core/config/env.dart';
import '../business/business.dart';

/// Printable counter poster (A5/A4) for a business's review link.
/// Asks customers to share their experience — never for a rating or "5 stars".
Future<Uint8List> buildReviewPoster(Business business, {PdfPageFormat format = PdfPageFormat.a5}) async {
  final logo = pw.MemoryImage((await rootBundle.load('assets/brand/logo.png')).buffer.asUint8List());
  final link = Env.reviewLink(business.publicSlug);

  const magenta = PdfColor.fromInt(0xFFB02FE5);
  const violet = PdfColor.fromInt(0xFF6334E2);
  const indigo = PdfColor.fromInt(0xFF363DDD);
  const ink = PdfColor.fromInt(0xFF16112E);
  const muted = PdfColor.fromInt(0xFF5B5577);

  final doc = pw.Document(title: '${business.name} review poster', author: 'RevYne');
  doc.addPage(
    pw.Page(
      pageFormat: format,
      margin: pw.EdgeInsets.zero,
      build: (context) => pw.Container(
        decoration: const pw.BoxDecoration(
          gradient: pw.LinearGradient(begin: pw.Alignment.topLeft, end: pw.Alignment.bottomRight, colors: [magenta, violet, indigo]),
        ),
        padding: const pw.EdgeInsets.all(28),
        child: pw.Container(
          decoration: pw.BoxDecoration(color: PdfColors.white, borderRadius: pw.BorderRadius.circular(22)),
          padding: const pw.EdgeInsets.symmetric(horizontal: 28, vertical: 32),
          child: pw.Column(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Column(children: [
                pw.Text(business.name, textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 26, fontWeight: pw.FontWeight.bold, color: ink)),
                if (business.city != null) ...[
                  pw.SizedBox(height: 4),
                  pw.Text(business.city!, style: const pw.TextStyle(fontSize: 13, color: muted)),
                ],
                pw.SizedBox(height: 22),
                pw.Text('Share your experience', style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: violet)),
                pw.Text('on Google', style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: violet)),
              ]),
              pw.Container(
                padding: const pw.EdgeInsets.all(14),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: const PdfColor.fromInt(0xFFE4E1F2), width: 1.5),
                  borderRadius: pw.BorderRadius.circular(18),
                ),
                child: pw.BarcodeWidget(barcode: pw.Barcode.qrCode(), data: link, width: 190, height: 190, color: ink),
              ),
              pw.Column(children: [
                pw.Text('Scan with your phone camera', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: ink)),
                pw.SizedBox(height: 4),
                pw.Text(link, style: const pw.TextStyle(fontSize: 10, color: muted)),
                pw.SizedBox(height: 18),
                pw.Row(mainAxisAlignment: pw.MainAxisAlignment.center, children: [
                  pw.ClipRRect(horizontalRadius: 5, verticalRadius: 5, child: pw.Image(logo, width: 18, height: 18)),
                  pw.SizedBox(width: 6),
                  pw.Text('Powered by RevYne', style: const pw.TextStyle(fontSize: 10, color: muted)),
                ]),
              ]),
            ],
          ),
        ),
      ),
    ),
  );
  return doc.save();
}
