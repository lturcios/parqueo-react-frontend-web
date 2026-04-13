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
}

export interface Movement {
  pago_id: string;
  fecha_hora_entra: string;
  fecha_hora_sale?: string;
  placa: string;
  monto_total: number;
  serie_entrada: string;
  usuario_entrada: string;
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

export interface MovementsResponse {
  movements: Movement[];
  total_count: number;
  total_ingresos: number;
  page: number;
  page_size: number;
}
