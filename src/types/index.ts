export interface User {
  email: string;
  nombre: string;
  institucion_id: number;
  ubicacion_id: number;
}

export interface Location {
  id: number;
  descripcion: string;
  observacion?: string;
}

export interface Rate {
  id: number;
  codigo_presup: number;
  descripcion: string;
  precio_unitario: number;
  tiempo_minimo: number;
  tiempo_maximo: number;
  tiempo_tolerancia: number;
  icon_file?: number | null;
}

export interface Movement {
  pago_id: string;
  fecha_hora_entra: string;
  fecha_hora_sale?: string | null;
  fecha_hora_pago?: string | null;
  fecha_hora_anula?: string | null;
  placa: string;
  codigo_presup: number;
  monto_total: number;
  serie_entrada: string;
  serie_salida?: string | null;
  tiempo_minutos?: number | null;
  usuario_entrada: string;
  usuario_salida?: string | null;
  ubicacion_id: number;
  tarifa_descripcion?: string;
}

export interface DashboardStats {
  total: number;
  activos: number;
  ingresos: number;
}

export interface AnalyticsData {
  hour: number;
  count: number;
  ingresos: number;
}

export interface Features {
  cambio_tarifa: boolean;
}

export interface ReportSummary {
  movimientos: number;
  cerrados: number;
  activos: number;
  anulados: number;
  tickets_entrada: number;
  tickets_salida: number;
  tickets_utilizados: number;
  ingresos: number;
  tiempo_promedio_minutos: number;
  por_tarifa: { codigo_presup: number; tarifa: string; movimientos: number; ingresos: number }[];
  por_operador: { usuario: string; cobros: number; ingresos: number }[];
}

export interface MovementsReport {
  institucion: string;
  ubicacion: string;
  hora_corte: string;
  jornada_inicio: string;
  jornada_fin: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  generado_por: string;
  generado_en: string;
  movements: Movement[];
  resumen: ReportSummary;
}

export interface MovementsResponse {
  movements: Movement[];
  total_count: number;
  total_ingresos: number;
  page: number;
  page_size: number;
}
