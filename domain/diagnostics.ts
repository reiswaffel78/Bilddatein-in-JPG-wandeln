import type { Capability, ConvertOptions } from './types';

/**
 * Diagnosebericht zum manuellen Kopieren (Kap. 11): Browser, Engine-Versionen,
 * Capability-Matrix, Fehlercode, Job-Parameter. Ausdrücklich KEINE Dateinamen,
 * Dateiinhalte oder Vorschaubilder — nichts wird automatisch gesendet.
 */
export interface DiagnosticContext {
  errorCode?: string;
  errorMessage?: string;
  jobOptions?: ConvertOptions;
  matrix: Capability[] | null;
}

export function buildDiagnosticReport(ctx: DiagnosticContext): string {
  const lines: string[] = [];
  lines.push('=== Diagnosebericht (lokaler Datei-Converter) ===');
  lines.push(`Zeitpunkt: ${new Date().toISOString()}`);
  lines.push(`User-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unbekannt'}`);
  lines.push(`hardwareConcurrency: ${typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'unbekannt'}`);

  if (ctx.errorCode) {
    lines.push('');
    lines.push(`Fehlercode: ${ctx.errorCode}`);
    lines.push(`Fehlermeldung: ${ctx.errorMessage ?? ''}`);
  }

  if (ctx.jobOptions) {
    lines.push('');
    lines.push('Job-Parameter (ohne Dateiname/-inhalt):');
    lines.push(JSON.stringify(ctx.jobOptions, null, 2));
  }

  lines.push('');
  lines.push(`Capability-Matrix-Größe: ${ctx.matrix?.length ?? 0} Einträge`);
  if (ctx.matrix) {
    lines.push(JSON.stringify(ctx.matrix, null, 2));
  }

  return lines.join('\n');
}
