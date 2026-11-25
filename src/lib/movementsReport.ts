import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Movement, MovementsReport } from '../types/index';
import { formatCurrency } from './utils';

const MARGIN = 12; // mm
const ESTADOS: Record<string, string> = { todos: 'Todos', activos: 'Solo activos', cerrados: 'Solo cerrados' };

const pad = (n: number) => String(n).padStart(2, '0');

function formatDateTime(value?: string | null): string {
  if (!value || value.startsWith('0001')) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "2026-11-24 15:00:01" (server local time) -> "24/11/2026 15:00:01", without timezone conversion.
function formatServerDateTime(value: string): string {
  const [date, time = ''] = value.split(' ');
  const [y, m, d] = date.split('-');
  return d && m && y ? `${d}/${m}/${y} ${time}`.trim() : value;
}

function formatServerDate(value: string): string {
  return formatServerDateTime(value).split(' ')[0];
}

export function formatMinutes(total: number): string {
  const minutes = Math.round(total);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function movementState(m: Movement): 'Anulado' | 'Activo' | 'Cerrado' {
  if (m.fecha_hora_anula && !m.fecha_hora_anula.startsWith('0001')) return 'Anulado';
  if (!m.fecha_hora_sale || m.fecha_hora_sale.startsWith('0001')) return 'Activo';
  return 'Cerrado';
}

function stay(m: Movement): string {
  if (movementState(m) !== 'Cerrado') return '—';
  if (m.tiempo_minutos != null) return formatMinutes(m.tiempo_minutos);
  const minutes = (new Date(m.fecha_hora_sale!).getTime() - new Date(m.fecha_hora_entra).getTime()) / 60000;
  return Number.isFinite(minutes) ? formatMinutes(minutes) : '—';
}

function series(m: Movement): string {
  const exit = m.serie_salida?.trim();
  return exit && exit !== m.serie_entrada.trim() ? `${m.serie_entrada} / ${exit}` : m.serie_entrada;
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };
const lastY = (doc: jsPDF, fallback: number) => (doc as DocWithTable).lastAutoTable?.finalY ?? fallback;

/** Builds the letter-size movements report: header, summary on the first page, detail table and page footers. */
export function buildMovementsReport(report: MovementsReport): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const s = report.resumen;
  const institucion = report.institucion || 'Institución';
  const ubicacion = report.ubicacion || 'Ubicación';
  let y = MARGIN + 4;

  // Header: institution (H1) and location (H2).
  doc.setFont('helvetica', 'bold').setFontSize(16).text(institucion, MARGIN, y);
  y += 7;
  doc.setFontSize(12).text(ubicacion, MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal').setFontSize(10).text('Informe de movimientos', MARGIN, y);
  y += 5;
  doc.setFontSize(8).setTextColor(90);
  const days = report.fecha_inicio === report.fecha_fin
    ? `Jornada del ${formatServerDate(report.fecha_inicio)}`
    : `Jornadas del ${formatServerDate(report.fecha_inicio)} al ${formatServerDate(report.fecha_fin)}`;
  doc.text(`${days}: de ${formatServerDateTime(report.jornada_inicio)} a ${formatServerDateTime(report.jornada_fin)} (hora de corte ${report.hora_corte})`, MARGIN, y);
  y += 4;
  doc.text(`Estado: ${ESTADOS[report.estado] ?? report.estado} · Generado por ${report.generado_por} el ${formatServerDateTime(report.generado_en)}`, MARGIN, y);
  doc.setTextColor(0);
  y += 5;

  // Summary.
  const half = (pageWidth - MARGIN * 2 - 6) / 2;
  const compact = { fontSize: 8, cellPadding: 1.5 };
  doc.setFont('helvetica', 'bold').setFontSize(10).text('Resumen', MARGIN, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: compact,
    margin: { left: MARGIN, right: MARGIN + half + 6 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    body: [
      ['Movimientos', String(s.movimientos)],
      ['Cerrados', String(s.cerrados)],
      ['En parqueo', String(s.activos)],
      ['Anulados', String(s.anulados)],
    ],
  });
  const leftY = lastY(doc, y);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: compact,
    margin: { left: MARGIN + half + 6, right: MARGIN },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    body: [
      ['Tickets utilizados', `${s.tickets_utilizados} (${s.tickets_entrada} entrada + ${s.tickets_salida} salida)`],
      ['Ingresos', formatCurrency(s.ingresos)],
      ['Tiempo promedio de estadía', s.cerrados > 0 ? formatMinutes(s.tiempo_promedio_minutos) : '—'],
      ['Ticket promedio', s.cerrados > 0 ? formatCurrency(s.ingresos / s.cerrados) : '—'],
    ],
  });
  y = Math.max(leftY, lastY(doc, y)) + 4;

  const breakdownHead = { fillColor: [241, 245, 249] as [number, number, number], textColor: 30, fontStyle: 'bold' as const };
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: compact,
    headStyles: breakdownHead,
    margin: { left: MARGIN, right: MARGIN + half + 6 },
    head: [['Por tarifa', 'Mov.', 'Ingresos']],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    body: s.por_tarifa.length
      ? s.por_tarifa.map(r => [r.tarifa || String(r.codigo_presup), String(r.movimientos), formatCurrency(r.ingresos)])
      : [['Sin movimientos', '', '']],
  });
  const rateY = lastY(doc, y);
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: compact,
    headStyles: breakdownHead,
    margin: { left: MARGIN + half + 6, right: MARGIN },
    head: [['Por operador (salida)', 'Cobros', 'Ingresos']],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    body: s.por_operador.length
      ? s.por_operador.map(o => [o.usuario || 'Sin usuario', String(o.cobros), formatCurrency(o.ingresos)])
      : [['Sin cobros', '', '']],
  });
  y = Math.max(rateY, lastY(doc, y)) + 6;

  // Detail.
  doc.setFont('helvetica', 'bold').setFontSize(10).text('Detalle', MARGIN, y);
  autoTable(doc, {
    startY: y + 2,
    theme: 'striped',
    margin: { left: MARGIN, right: MARGIN, bottom: MARGIN + 6 },
    styles: { fontSize: 7, cellPadding: 1.2, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 64, 175], fontSize: 7 },
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold', fontSize: 7 },
    head: [['#', 'Placa', 'Ticket', 'Tarifa', 'Entrada', 'Salida', 'Tiempo', 'Series', 'Monto', 'Estado']],
    columnStyles: { 0: { halign: 'right', cellWidth: 8 }, 8: { halign: 'right' } },
    body: report.movements.map((m, i) => [
      String(i + 1),
      m.placa,
      m.pago_id,
      m.tarifa_descripcion || String(m.codigo_presup),
      formatDateTime(m.fecha_hora_entra),
      movementState(m) === 'Activo' ? '—' : formatDateTime(m.fecha_hora_sale),
      stay(m),
      series(m),
      movementState(m) === 'Cerrado' ? formatCurrency(m.monto_total) : '—',
      movementState(m),
    ]),
    foot: [['', '', '', '', '', '', '', 'Total', { content: formatCurrency(s.ingresos), styles: { halign: 'right' } }, '']],
    showFoot: 'lastPage',
    didParseCell: data => {
      if (data.section === 'body' && data.column.index === 9 && data.cell.raw === 'Anulado') {
        data.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(120);
    doc.text(`${institucion} · ${ubicacion}`, MARGIN, pageHeight - MARGIN / 2);
    doc.text(`Página ${page} de ${pages}`, pageWidth - MARGIN, pageHeight - MARGIN / 2, { align: 'right' });
  }
  doc.setTextColor(0);
  return doc;
}

export function reportFileName(report: Pick<MovementsReport, 'fecha_inicio' | 'fecha_fin'>): string {
  return report.fecha_inicio === report.fecha_fin
    ? `informe-movimientos_${report.fecha_inicio}.pdf`
    : `informe-movimientos_${report.fecha_inicio}_${report.fecha_fin}.pdf`;
}
