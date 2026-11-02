package dev.hackathon.hub;

import static org.assertj.core.api.Assertions.*;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.service.ExportService;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;

class ExportTests {
  @Test
  void pdfPreservesUnicodeNamesAndPaginatesLongRankings() throws Exception {
    Instant now = Instant.now();
    var event =
        new HackathonView(
            1L,
            "Қазақша / Хакатон",
            "Report",
            now,
            now.plusSeconds(3600),
            now.plusSeconds(1800),
            HackathonStatus.JUDGING,
            StrategyType.WEIGHTED,
            now);
    List<Ranking> rankings = new ArrayList<>();
    for (int i = 1; i <= 60; i++)
      rankings.add(
          new Ranking(
              i,
              (long) i,
              (long) i,
              "Команда " + i,
              "Accessible campus project " + i,
              3,
              80,
              List.of(),
              80,
              true));
    var report =
        new ExportReport(
            now,
            event,
            List.of(),
            List.of(),
            List.of(),
            new Leaderboard(1L, StrategyType.WEIGHTED, rankings));
    byte[] bytes = new ExportService().pdf(report);
    try (PdfReader reader = new PdfReader(bytes)) {
      assertThat(reader.getNumberOfPages()).isGreaterThan(1);
      String firstPage = new PdfTextExtractor(reader).getTextFromPage(1);
      assertThat(firstPage).contains("Қазақша", "Команда", "Rank", "Judges");
      String lastPage = new PdfTextExtractor(reader).getTextFromPage(reader.getNumberOfPages());
      assertThat(lastPage).contains("Hackathon Hub");
    }
  }
}
