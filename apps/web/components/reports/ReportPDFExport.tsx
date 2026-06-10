'use client';

import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Use built-in Helvetica as a Space-Grotesk stand-in (no external fonts needed for PDF)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    backgroundColor: '#FFFFFF',
    color: '#0C1A2E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#1E6BE6',
    paddingBottom: 12,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0A1B3D',
    letterSpacing: 1.5,
  },
  meta: {
    fontSize: 8,
    color: '#5A6B82',
    textAlign: 'right',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0A1B3D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#5A6B82',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0A1B3D',
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF3',
    paddingBottom: 4,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#0C1A2E',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF3',
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1E6BE6',
    paddingVertical: 5,
    backgroundColor: '#F5F8FC',
  },
  colName: { width: '20%', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  colScore: { width: '20%', fontSize: 9 },
  colConf: { width: '15%', fontSize: 9 },
  colRationale: { width: '45%', fontSize: 9, color: '#5A6B82' },
  bullet: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletDot: {
    width: 14,
    fontSize: 10,
    color: '#0A1B3D',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  flagCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#D9962B',
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 6,
    backgroundColor: '#FEF8EC',
  },
  flagCardHigh: {
    borderLeftColor: '#E0524D',
    backgroundColor: '#FEF2F2',
  },
  flagText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  candidateHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0A1B3D',
    marginTop: 12,
    marginBottom: 4,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#D9962B',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#FEF8EC',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#8A99AD',
    borderTopWidth: 1,
    borderTopColor: '#E4EBF3',
    paddingTop: 8,
  },
});

export interface ReportData {
  project_name: string;
  indication: string;
  stage: string;
  candidate_ids: string[];
  sections: {
    executive_summary?: string;
    candidate_ranking?: Array<{
      id: string;
      name: string;
      stage?: string;
      overall_score?: { mean: number; ci_low: number; ci_high: number };
      confidence_label?: string;
      properties?: Record<string, { mean: number; ci_low: number; ci_high: number }>;
      rationale?: string;
      error?: string;
    }>;
    safety_flags?: Record<string, Array<{
      property: string;
      value?: number;
      axis_score?: number;
      threshold: number;
      severity: string;
      description: string;
    }>>;
    trial_landscape?: string;
    recommendations?: string[];
    metadata?: {
      project_name: string;
      indication: string;
      stage: string;
      generated_at: string;
      engine_version: string;
      data_sources: string[];
    };
  };
}

function ReportDocument({ report }: { report: ReportData }) {
  const meta = report.sections.metadata;
  const generatedAt = meta
    ? new Date(meta.generated_at).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>ANTARIA</Text>
          <View>
            <Text style={styles.meta}>Decision Intelligence Report</Text>
            <Text style={styles.meta}>Generated {generatedAt}</Text>
            {meta && <Text style={styles.meta}>Engine {meta.engine_version}</Text>}
          </View>
        </View>

        {/* Title block */}
        <Text style={styles.title}>{report.project_name}</Text>
        <Text style={styles.subtitle}>
          {report.indication}  |  {report.stage}
        </Text>

        {/* Executive Summary */}
        {report.sections.executive_summary && (
          <View>
            <Text style={styles.sectionHeading}>Executive Summary</Text>
            <Text style={styles.paragraph}>{report.sections.executive_summary}</Text>
          </View>
        )}

        {/* Candidate Ranking */}
        {report.sections.candidate_ranking && report.sections.candidate_ranking.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Candidate Ranking</Text>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={styles.colName}>Candidate</Text>
              <Text style={styles.colScore}>Overall Score</Text>
              <Text style={styles.colConf}>Confidence</Text>
              <Text style={styles.colRationale}>Rationale</Text>
            </View>
            {report.sections.candidate_ranking.map((c, i) => (
              <View key={c.id} style={styles.tableRow}>
                <Text style={styles.colName}>{c.name}</Text>
                <Text style={styles.colScore}>
                  {c.overall_score
                    ? `${c.overall_score.mean.toFixed(2)} (${c.overall_score.ci_low.toFixed(2)}–${c.overall_score.ci_high.toFixed(2)})`
                    : 'N/A'}
                </Text>
                <Text style={styles.colConf}>{c.confidence_label ?? 'N/A'}</Text>
                <Text style={styles.colRationale}>{c.rationale ?? c.error ?? ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safety Flags */}
        {report.sections.safety_flags && Object.keys(report.sections.safety_flags).length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Safety Flags</Text>
            {Object.entries(report.sections.safety_flags).map(([name, flags]) => (
              <View key={name}>
                <Text style={styles.candidateHeading}>{name}</Text>
                {flags.length === 0 ? (
                  <Text style={[styles.paragraph, { color: '#16A375' }]}>No flags raised.</Text>
                ) : (
                  flags.map((flag, i) => (
                    <View
                      key={i}
                      style={[styles.flagCard, flag.severity === 'high' ? styles.flagCardHigh : {}]}
                    >
                      <Text style={styles.flagText}>{flag.description}</Text>
                    </View>
                  ))
                )}
              </View>
            ))}
          </View>
        )}

        {/* Trial Landscape */}
        {report.sections.trial_landscape && (
          <View>
            <Text style={styles.sectionHeading}>Trial Landscape</Text>
            <View style={styles.infoCard}>
              <Text style={styles.paragraph}>{report.sections.trial_landscape}</Text>
            </View>
          </View>
        )}

        {/* Recommendations */}
        {report.sections.recommendations && report.sections.recommendations.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Recommendations</Text>
            {report.sections.recommendations.map((rec, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>{i + 1}.</Text>
                <Text style={styles.bulletText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Data sources */}
        {meta && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.paragraph, { color: '#8A99AD', fontSize: 8 }]}>
              Data sources: {meta.data_sources.join(' | ')}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>ANTARIA — Confidential</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function generateReportPDF(report: ReportData): Promise<void> {
  const blob = await pdf(<ReportDocument report={report} />).toBlob();
  const url = URL.createObjectURL(blob);
  const meta = report.sections.metadata;
  const date = meta
    ? meta.generated_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const filename = `antaria-report-${slugify(report.project_name)}-${date}.pdf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
