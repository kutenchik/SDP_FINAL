package dev.hackathon.hub.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import dev.hackathon.hub.dto.Views.*;
import java.awt.Color;
import java.io.*;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ExportService {
  private static final Color INK = new Color(25, 34, 53), BLUE = new Color(37, 78, 216);
  private final BaseFont pdfFont;

  public ExportService() {
    try (InputStream stream = getClass().getResourceAsStream("/fonts/NotoSans-Regular.ttf")) {
      if (stream == null) throw new IllegalStateException("The bundled report font is missing.");
      pdfFont =
          BaseFont.createFont(
              "NotoSans-Regular.ttf",
              BaseFont.IDENTITY_H,
              BaseFont.EMBEDDED,
              true,
              stream.readAllBytes(),
              null);
    } catch (Exception ex) {
      throw new IllegalStateException("Could not load the report font.", ex);
    }
  }

  private Font font(float size, int style, Color color) {
    return new Font(pdfFont, size, style, color);
  }

  public byte[] pdf(ExportReport report) {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    Document doc = new Document(PageSize.A4, 44, 44, 44, 44);
    PdfWriter writer = PdfWriter.getInstance(doc, out);
    writer.setPageEvent(
        new PdfPageEventHelper() {
          @Override
          public void onEndPage(PdfWriter current, Document document) {
            ColumnText.showTextAligned(
                current.getDirectContent(),
                Element.ALIGN_RIGHT,
                new Phrase(
                    "Hackathon Hub  /  " + current.getPageNumber(), font(8, Font.NORMAL, INK)),
                document.right(),
                24,
                0);
          }
        });
    doc.open();
    Font brand = font(11, Font.BOLD, BLUE);
    Font title = font(24, Font.BOLD, INK);
    Font body = font(10, Font.NORMAL, INK);
    doc.add(new Paragraph("HACKATHON HUB / RESULTS REPORT", brand));
    Paragraph heading = new Paragraph(report.hackathon().name(), title);
    heading.setSpacingBefore(18);
    heading.setSpacingAfter(12);
    doc.add(heading);
    doc.add(
        new Paragraph(
            "Generated: "
                + java.time.format.DateTimeFormatter.ofPattern(
                        "dd MMM uuuu, HH:mm 'UTC'", Locale.ENGLISH)
                    .withZone(java.time.ZoneOffset.UTC)
                    .format(report.generatedAt()),
            body));
    doc.add(new Paragraph("Scoring strategy: " + report.leaderboard().strategy(), body));
    doc.add(
        new Paragraph(
            "Teams: " + report.teams().size() + "   |   Projects: " + report.submissions().size(),
            body));
    var scored = report.leaderboard().rankings().stream().filter(Ranking::scored).toList();
    doc.add(
        new Paragraph(
            "Average final score: "
                + String.format(
                    Locale.ROOT,
                    "%.2f",
                    scored.stream().mapToDouble(Ranking::finalScore).average().orElse(0))
                + " / 100",
            body));
    doc.add(
        new Paragraph(
            scored.isEmpty()
                ? "Winner: awaiting evaluations"
                : "Leading project(s): "
                    + String.join(
                        ", ",
                        scored.stream()
                            .filter(r -> r.rank() == 1)
                            .map(r -> r.teamName() + " / " + r.title())
                            .toList()),
            brand));
    PdfPTable table = new PdfPTable(new float[] {0.8f, 2.1f, 2.6f, 1.1f, 1f, 1f});
    table.setWidthPercentage(100);
    table.setSpacingBefore(22);
    table.setHeaderRows(1);
    for (String s : new String[] {"Rank", "Team", "Project", "Judges", "Base", "Final"}) {
      PdfPCell cell = new PdfPCell(new Phrase(s, font(9, Font.BOLD, Color.WHITE)));
      cell.setBackgroundColor(BLUE);
      cell.setPadding(8);
      table.addCell(cell);
    }
    for (Ranking r : report.leaderboard().rankings())
      for (String s :
          new String[] {
            r.scored() ? "" + r.rank() : "-",
            r.teamName(),
            r.title(),
            "" + r.judgeCount(),
            String.format(Locale.ROOT, "%.2f", r.baseScore()),
            r.scored() ? String.format(Locale.ROOT, "%.2f", r.finalScore()) : "Pending"
          }) {
        PdfPCell cell = new PdfPCell(new Phrase(s, body));
        cell.setPadding(9);
        cell.setBorderColor(new Color(222, 228, 237));
        table.addCell(cell);
      }
    doc.add(table);
    Paragraph note =
        new Paragraph(
            "Scores are normalized to 100. Standard averages judge totals; Olympic trims one"
                + " highest and lowest total with 3+ judges; Weighted applies criterion weights."
                + " Final scores include configured modifiers and are bounded to 0-100. Unscored"
                + " projects are not ranked. Ties share a rank.",
            body);
    note.setSpacingBefore(16);
    doc.add(note);
    for (Ranking r : report.leaderboard().rankings())
      if (!r.adjustments().isEmpty())
        doc.add(
            new Paragraph(
                r.teamName()
                    + " / "
                    + r.title()
                    + ": "
                    + String.join(
                        ", ",
                        r.adjustments().stream()
                            .map(a -> a.label() + " " + (a.amount() > 0 ? "+" : "") + a.amount())
                            .toList()),
                body));
    doc.close();
    return out.toByteArray();
  }
}
