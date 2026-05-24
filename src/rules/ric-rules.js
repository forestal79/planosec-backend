// ============================================================
// MOTOR DE REGLAS RIC — PlanoSEC · Voltum SpA
// Basado en los 19 Pliegos Técnicos Normativos SEC
// RIC N°01 al N°19 — Resolución Exenta N°33.877 / 30.12.2020
// ============================================================

// ─────────────────────────────────────────────
// RIC N°03 — FACTORES DE DEMANDA
// ─────────────────────────────────────────────
const FACTORES_DEMANDA = {
  casa_habitacion: [
    { hasta: 3000, factor: 1.0 },
    { hasta: 120000, factor: 0.35 },
    { sobre: 120000, factor: 0.25 }
  ],
  hospital: [
    { hasta: 50000, factor: 0.4 },
    { sobre: 50000, factor: 0.2 }
  ],
  hotel_motel: [
    { hasta: 20000, factor: 0.5 },
    { hasta: 100000, factor: 0.4 },
    { sobre: 100000, factor: 0.3 }
  ],
  bodega: [
    { hasta: 12500, factor: 1.0 },
    { sobre: 12500, factor: 0.5 }
  ],
  servicios_comunes: [{ toda: true, factor: 1.0 }],
  local_comercial_oficina: [
    { hasta: 50000, factor: 1.0 },
    { sobre: 50000, factor: 0.8 }
  ],
  otro: [{ toda: true, factor: 1.0 }]
};

// RIC N°03 Tabla 3.2 — Factores de simultaneidad conjuntos de viviendas
const FACTORES_SIMULTANEIDAD = {
  1: 1, 2: 1, 3: 1, 4: 0.95, 5: 0.92,
  6: 0.90, 7: 0.89, 8: 0.88, 9: 0.87, 10: 0.85,
  11: 0.84, 12: 0.83, 13: 0.82, 14: 0.81, 15: 0.79,
  16: 0.78, 17: 0.77, 18: 0.76, 19: 0.75, 20: 0.74,
  21: 0.73
};

function factorSimultaneidad(n) {
  if (n <= 21) return FACTORES_SIMULTANEIDAD[n] || 1;
  return (15.3 + (n - 21) * 0.5) / n;
}

// ─────────────────────────────────────────────
// RIC N°04 — SECCIONES MÍNIMAS DE CONDUCTORES
// ─────────────────────────────────────────────
const SECCIONES_MINIMAS = {
  iluminacion: 1.5,        // mm²
  enchufes: 2.5,           // mm²
  mixto: 2.5,              // mm²
  subalimentador: 2.5,     // mm²
  alimentador: 4.0,        // mm²
  motor_mayor_3hp: 2.5,    // mm² (RIC N°07)
  tierra_proteccion: 4.0   // mm² mínimo (RIC N°06)
};

// RIC N°04 Tabla 4.4 — Capacidad de transporte (método B, conductor THHN cobre)
// Valores en Ampers para temperatura ambiente 30°C
const CAPACIDAD_CONDUCTOR = {
  1.5:  { metodo_a: 14.5, metodo_b: 13.5, metodo_c: 15.5 },
  2.5:  { metodo_a: 19.5, metodo_b: 18.0, metodo_c: 21.0 },
  4.0:  { metodo_a: 26.0, metodo_b: 24.0, metodo_c: 28.0 },
  6.0:  { metodo_a: 34.0, metodo_b: 31.0, metodo_c: 36.0 },
  10.0: { metodo_a: 46.0, metodo_b: 42.0, metodo_c: 50.0 },
  16.0: { metodo_a: 61.0, metodo_b: 56.0, metodo_c: 68.0 },
  25.0: { metodo_a: 80.0, metodo_b: 73.0, metodo_c: 89.0 },
  35.0: { metodo_a: 99.0, metodo_b: 89.0, metodo_c: 110.0 },
  50.0: { metodo_a: 119.0, metodo_b: 108.0, metodo_c: 134.0 },
  70.0: { metodo_a: 151.0, metodo_b: 136.0, metodo_c: 171.0 },
  95.0: { metodo_a: 182.0, metodo_b: 164.0, metodo_c: 207.0 },
  120.0: { metodo_a: 210.0, metodo_b: 188.0, metodo_c: 239.0 }
};

function seccionMinimaPorCorriente(corriente, metodo = 'metodo_b') {
  const secciones = [1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0];
  for (const s of secciones) {
    if (CAPACIDAD_CONDUCTOR[s][metodo] >= corriente) return s;
  }
  return null; // requiere cálculo especial
}

// ─────────────────────────────────────────────
// RIC N°10 — CIRCUITOS MÍNIMOS POR TIPO DE RECINTO
// ─────────────────────────────────────────────
const CIRCUITOS_MINIMOS = {
  vivienda_menor_30m2: {
    circuitos_minimos: 2,
    circuito_cocina_lavadero: { requerido: true, capacidad_minima_A: 16 },
    enchufes_cocina_minimos: 3,
    diferencial_30mA: true,
    interruptor_general_omnipolar: true,
    esquema_tierra: 'TN-S'
  },
  vivienda_mayor_30m2: {
    circuitos_minimos: 3,
    circuito_cocina_lavadero: { requerido: true, capacidad_minima_A: 16 },
    enchufes_cocina_minimos: 3,
    diferencial_30mA: true,
    interruptor_general_omnipolar: true,
    esquema_tierra: 'TN-S'
  },
  local_comercial: {
    enchufes_por_m2: { cada: 15, cantidad: 1, tipo: 'triple', minimo: 3 },
    circuitos_exclusivos: { iluminacion: true, enchufes: true },
    diferencial_30mA: true
  },
  oficina_menor_40m2: {
    enchufes_por_perimetro: { cada_metros: 6, cantidad: 1, tipo: 'triple' },
    circuitos_exclusivos: { iluminacion: true, enchufes: true },
    diferencial_30mA: true
  },
  oficina_mayor_40m2: {
    enchufes_base: 5,
    enchufes_adicionales: { por_m2: 40, cantidad: 3 },
    circuitos_exclusivos: { iluminacion: true, enchufes: true },
    diferencial_30mA: true
  },
  industrial: {
    circuitos_exclusivos: { iluminacion: true, enchufes: true, fuerza: true },
    diferencial_30mA: true,
    canalización_obligatoria: ['bandeja_metalica', 'conduit_GRC', 'conduit_IMC'],
    canalizacion_prohibida: ['PVC_corrugado_expuesto'],
    tablero_IP_minimo: 54
  }
};

// ─────────────────────────────────────────────
// RIC N°01 — EMPALMES NORMALIZADOS
// ─────────────────────────────────────────────
const EMPALMES_MONOFASICOS = [
  { interruptor_A: 6, potencia_kW: 1, potencia_kVA: 1.3 },
  { interruptor_A: 10, potencia_kW: 2, potencia_kVA: 2.2 },
  { interruptor_A: 16, potencia_kW: 3, potencia_kVA: 3.5 },
  { interruptor_A: 20, potencia_kW: 4, potencia_kVA: 4.4 },
  { interruptor_A: 25, potencia_kW: 5, potencia_kVA: 5.5 },
  { interruptor_A: 30, potencia_kW: 6, potencia_kVA: 6.6 },
  { interruptor_A: 32, potencia_kW: 6.5, potencia_kVA: 7.0 },
  { interruptor_A: 35, potencia_kW: 7, potencia_kVA: 7.7 },
  { interruptor_A: 40, potencia_kW: 8, potencia_kVA: 8.8 },
  { interruptor_A: 50, potencia_kW: 10, potencia_kVA: 11.0 },
  { interruptor_A: 63, potencia_kW: 13, potencia_kVA: 13.8 }
];

const EMPALMES_TRIFASICOS = [
  { interruptor_A: 6, potencia_kW: 3.6, potencia_kVA: 3.95 },
  { interruptor_A: 10, potencia_kW: 6, potencia_kVA: 6.58 },
  { interruptor_A: 16, potencia_kW: 9.7, potencia_kVA: 10.53 },
  { interruptor_A: 20, potencia_kW: 12, potencia_kVA: 13.16 },
  { interruptor_A: 25, potencia_kW: 15, potencia_kVA: 16.45 },
  { interruptor_A: 32, potencia_kW: 19, potencia_kVA: 21.06 },
  { interruptor_A: 40, potencia_kW: 24, potencia_kVA: 26.33 },
  { interruptor_A: 50, potencia_kW: 30, potencia_kVA: 32.91 },
  { interruptor_A: 63, potencia_kW: 38, potencia_kVA: 41.47 },
  { interruptor_A: 80, potencia_kW: 48, potencia_kVA: 52.65 },
  { interruptor_A: 100, potencia_kW: 61, potencia_kVA: 65.82 },
  { interruptor_A: 125, potencia_kW: 76, potencia_kVA: 82.27 },
  { interruptor_A: 150, potencia_kW: 91, potencia_kVA: 98.70 },
  { interruptor_A: 200, potencia_kW: 122, potencia_kVA: 131.64 },
  { interruptor_A: 250, potencia_kW: 153, potencia_kVA: 164.54 },
  { interruptor_A: 400, potencia_kW: 244, potencia_kVA: 263.27 },
  { interruptor_A: 500, potencia_kW: 306, potencia_kVA: 329.09 }
];

function empalmeRecomendado(demandaKW, trifasico = false) {
  const tabla = trifasico ? EMPALMES_TRIFASICOS : EMPALMES_MONOFASICOS;
  return tabla.find(e => e.potencia_kW >= demandaKW) || tabla[tabla.length - 1];
}

// ─────────────────────────────────────────────
// RIC N°07 — CÁLCULO DE MOTORES
// ─────────────────────────────────────────────
const HP_A_KW = 0.7457;

function calcularMotor(hp, voltaje = 380, cosfi = 0.85, rendimiento = 0.90) {
  const kw = hp * HP_A_KW;
  const corrienteNominal = (kw * 1000) / (Math.sqrt(3) * voltaje * cosfi * rendimiento);
  const corrienteDiseño = corrienteNominal * 1.25; // RIC N°07
  const corrienteArranque = corrienteNominal * 6;   // arranque directo típico
  const seccion = seccionMinimaPorCorriente(corrienteDiseño);
  const termomag = termomagnéticoRecomendado(corrienteNominal, 'motor');
  return {
    hp,
    kw: Math.round(kw * 100) / 100,
    corriente_nominal_A: Math.round(corrienteNominal * 100) / 100,
    corriente_diseno_A: Math.round(corrienteDiseño * 100) / 100,
    corriente_arranque_A: Math.round(corrienteArranque * 100) / 100,
    seccion_conductor_mm2: seccion,
    termomagnético_A: termomag,
    curva: 'D', // curva D obligatoria para motores
    diferencial_requerido: true,
    guardamotor_requerido: corrienteNominal >= 3
  };
}

function calcularGrupoMotores(motores) {
  // RIC N°07: 1.25 × mayor + suma resto
  if (!motores.length) return null;
  const datos = motores.map(m => calcularMotor(m.hp, m.voltaje || 380));
  const mayor = datos.reduce((a, b) => a.corriente_nominal_A > b.corriente_nominal_A ? a : b);
  const resto = datos.filter(d => d !== mayor);
  const corrienteTotal = (mayor.corriente_nominal_A * 1.25) + resto.reduce((s, d) => s + d.corriente_nominal_A, 0);
  const seccion = seccionMinimaPorCorriente(corrienteTotal);
  return {
    corriente_total_A: Math.round(corrienteTotal * 100) / 100,
    seccion_alimentador_mm2: seccion,
    motores: datos
  };
}

// ─────────────────────────────────────────────
// RIC N°02 — PROTECCIONES
// ─────────────────────────────────────────────
const TERMOMAGNÉTICOS_NORMALIZADOS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630];

function termomagnéticoRecomendado(corriente, tipo = 'general') {
  let corrienteDiseno = corriente;
  if (tipo === 'motor') corrienteDiseno = corriente * 1.25;
  return TERMOMAGNÉTICOS_NORMALIZADOS.find(t => t >= corrienteDiseno) || 630;
}

function diferentialRecomendado(circuito) {
  // RIC N°05 y N°10: diferencial ≤30mA en todos los circuitos de uso general
  // RIC N°09: ≤30mA para autogeneración <10kW / ≤300mA para ≥10kW
  if (circuito.autogeneracion_kw && circuito.autogeneracion_kw >= 10) return 300;
  return 30;
}

// ─────────────────────────────────────────────
// RIC N°06 — PUESTA A TIERRA
// ─────────────────────────────────────────────
const RESISTIVIDAD_TERRENOS = {
  pantanoso: { min: 1, max: 30 },
  limo: { min: 20, max: 100 },
  humus: { min: 10, max: 150 },
  arcilla_plastica: { valor: 50 },
  arenas_arcillosas: { min: 50, max: 500 },
  arena_silicea: { min: 200, max: 3000 },
  suelo_pedregoso_cesped: { min: 300, max: 500 },
  suelo_pedregoso_desnudo: { min: 1500, max: 3000 },
  granito: { min: 1500, max: 10000 }
};

function resistenciaPica(longitud_m, resistividad_ohm_m) {
  // Tabla 6.4: R = ρ/L
  return Math.round((resistividad_ohm_m / longitud_m) * 100) / 100;
}

function resistenciaPlaca(perimetro_m, resistividad_ohm_m) {
  // Tabla 6.4: R = 0.8ρ/P
  return Math.round((0.8 * resistividad_ohm_m / perimetro_m) * 100) / 100;
}

function validarPuestaATierra(resistencia_medida_ohm, potencia_kW, tiene_diferencial_30mA) {
  const alertas = [];
  // RIC N°06: ≤20 Ohm para instalaciones normales
  // ≤80 Ohm si tiene diferencial 30mA en todos y potencia ≤10kW
  const limite = (potencia_kW <= 10 && tiene_diferencial_30mA) ? 80 : 20;
  if (resistencia_medida_ohm > limite) {
    alertas.push({
      ric: 'RIC N°06 — punto 6.2',
      nivel: 'ERROR',
      mensaje: `Resistencia de puesta a tierra ${resistencia_medida_ohm} Ω supera el límite de ${limite} Ω. Agregar electrodos adicionales o usar aditivos.`
    });
  }
  return alertas;
}

// ─────────────────────────────────────────────
// RIC N°19 — VALORES MÍNIMOS AISLAMIENTO
// ─────────────────────────────────────────────
const AISLAMIENTO_MINIMO = {
  MBTS_MBTP: { tension_ensayo_V: 250, resistencia_min_MOhm: 0.25 },
  hasta_500V: { tension_ensayo_V: 500, resistencia_min_MOhm: 0.5 },
  sobre_500V: { tension_ensayo_V: 1000, resistencia_min_MOhm: 1.0 }
};

// ─────────────────────────────────────────────
// RIC N°03 — CAÍDAS DE TENSIÓN
// ─────────────────────────────────────────────
const CAIDAS_TENSION = {
  alimentador_max_pct: 3,        // RIC N°03
  total_max_pct: 5,              // RIC N°03
  alimentador_eficiencia_pct: 2, // RIC N°14 (eficiencia energética)
  derivacion_eficiencia_pct: 3   // RIC N°14
};

function calcularCaidaTension(corriente_A, longitud_m, seccion_mm2, tension_V = 220, monofasico = true) {
  const resistividad_cobre = 0.0175; // Ohm·mm²/m a 20°C
  const R = (resistividad_cobre * longitud_m) / seccion_mm2;
  const caida_V = monofasico ? 2 * corriente_A * R : Math.sqrt(3) * corriente_A * R;
  const caida_pct = (caida_V / tension_V) * 100;
  return {
    caida_V: Math.round(caida_V * 100) / 100,
    caida_pct: Math.round(caida_pct * 100) / 100,
    cumple_alimentador: caida_pct <= CAIDAS_TENSION.alimentador_max_pct,
    cumple_total: caida_pct <= CAIDAS_TENSION.total_max_pct
  };
}

// ─────────────────────────────────────────────
// CÓDIGO DE COLORES CONDUCTORES (RIC N°04)
// ─────────────────────────────────────────────
const CODIGO_COLORES = {
  monofasico: {
    fase: 'café (marrón)',
    neutro: 'azul',
    tierra: 'verde/amarillo'
  },
  trifasico: {
    fase_R: 'café (marrón)',
    fase_S: 'negro',
    fase_T: 'gris',
    neutro: 'azul',
    tierra: 'verde/amarillo'
  }
};

// ─────────────────────────────────────────────
// CANALIZACIONES POR TIPO DE RECINTO (RIC N°04 / N°10)
// ─────────────────────────────────────────────
const CANALIZACIONES = {
  residencial: {
    permitidas: ['PVC_rigido', 'PVC_corrugado_embutido', 'conduit_EMT', 'bandeja_metalica'],
    prohibidas: []
  },
  industrial_zona_maquinas: {
    permitidas: ['conduit_GRC', 'conduit_IMC', 'bandeja_metalica_perforada', 'escalerilla_metalica'],
    prohibidas: ['PVC_corrugado_expuesto', 'PVC_corrugado_libre'],
    notas: 'EMT solo en zonas sin riesgo mecánico (oficinas, salas eléctricas)'
  },
  industrial_oficina_interior: {
    permitidas: ['conduit_EMT', 'conduit_GRC', 'PVC_rigido', 'bandeja_metalica'],
    prohibidas: ['PVC_corrugado_expuesto']
  },
  lugar_reunion_personas: {
    permitidas: ['conduit_metalico', 'bandeja_metalica'],
    conductores: 'libre de halógenos, baja toxicidad, baja emisión de humos',
    prohibidas: ['PVC_no_certificado']
  }
};

// ─────────────────────────────────────────────
// RIC N°10 — ILUMINACIÓN MÍNIMA
// ─────────────────────────────────────────────
const ILUMINACION_MINIMA = {
  circulacion_pasillos: { lux: 100, UGR: 28 },
  escaleras: { lux: 150, UGR: 25 },
  ascensores: { lux: 100, UGR: 25 },
  almacen_ocupado: { lux: 200, UGR: 25 },
  oficina_general: { lux: 500, UGR: 19 },
  sala_reuniones: { lux: 500, UGR: 19 },
  industrial_maquinaria: { lux: 300, UGR: 25 },
  industrial_precision: { lux: 750, UGR: 19 },
  sala_medica: { lux: 500, UGR: 16 },
  pabellon_cirugia: { lux: 1000, UGR: 16 }
};

// ─────────────────────────────────────────────
// VALIDADOR PRINCIPAL T1 — INSTALACIÓN DOMICILIARIA
// ─────────────────────────────────────────────
function validarInstalacionT1(proyecto) {
  const alertas = [];
  const {
    tipo_recinto,
    superficie_m2,
    potencia_total_W,
    circuitos,
    tiene_cocina_electrica,
    tiene_horno_electrico,
    voltaje = 220,
    longitud_alimentador_m,
    seccion_alimentador_mm2,
    resistencia_tierra_ohm
  } = proyecto;

  // ── Determinar reglas según tipo y superficie ──
  const reglas = superficie_m2 < 30
    ? CIRCUITOS_MINIMOS.vivienda_menor_30m2
    : CIRCUITOS_MINIMOS.vivienda_mayor_30m2;

  // ── 1. Circuitos mínimos ──
  const numCircuitos = circuitos?.length || 0;
  if (numCircuitos < reglas.circuitos_minimos) {
    alertas.push({
      ric: 'RIC N°10 — punto 5.2.2',
      nivel: 'ERROR',
      campo: 'circuitos',
      mensaje: `Mínimo ${reglas.circuitos_minimos} circuitos para vivienda de ${superficie_m2}m². Tiene ${numCircuitos}.`
    });
  }

  // ── 2. Circuito exclusivo cocina/lavadero 16A ──
  const tieneCircuitoCocina = circuitos?.some(c =>
    (c.tipo === 'cocina' || c.tipo === 'lavadero') && c.capacidad_A >= 16
  );
  if (!tieneCircuitoCocina) {
    alertas.push({
      ric: 'RIC N°10 — punto 5.2.4',
      nivel: 'ERROR',
      campo: 'circuito_cocina',
      mensaje: 'Falta circuito exclusivo para cocina/lavadero con capacidad mínima 16A.'
    });
  }

  // ── 3. Horno/cocina eléctrica: circuito adicional ──
  if (tiene_cocina_electrica || tiene_horno_electrico) {
    const tieneCircuitoHorno = circuitos?.some(c => c.tipo === 'horno' || c.tipo === 'cocina_electrica');
    if (!tieneCircuitoHorno) {
      alertas.push({
        ric: 'RIC N°10 — punto 5.2.5',
        nivel: 'ERROR',
        campo: 'circuito_horno',
        mensaje: 'Horno eléctrico/cocina eléctrica requiere circuito adicional independiente de mínimo 16A.'
      });
    }
  }

  // ── 4. Diferencial 30mA en todos los circuitos ──
  const circuitosSinDiferencial = circuitos?.filter(c => !c.tiene_diferencial) || [];
  if (circuitosSinDiferencial.length > 0) {
    alertas.push({
      ric: 'RIC N°10 — punto 5.1.3.5',
      nivel: 'ERROR',
      campo: 'diferencial',
      mensaje: `${circuitosSinDiferencial.length} circuito(s) sin protección diferencial. Todos los circuitos deben tener diferencial ≤30mA.`
    });
  }

  // ── 5. Max 3 circuitos por diferencial ──
  const gruposDiferencial = circuitos?.reduce((acc, c) => {
    const key = c.diferencial_id || 'sin_grupo';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) || {};
  Object.entries(gruposDiferencial).forEach(([id, count]) => {
    if (id !== 'sin_grupo' && count > 3) {
      alertas.push({
        ric: 'RIC N°10 — punto 5.1.3.7',
        nivel: 'ERROR',
        campo: 'diferencial',
        mensaje: `Diferencial "${id}" tiene ${count} circuitos. Máximo permitido: 3 circuitos por diferencial.`
      });
    }
  });

  // ── 6. Interruptor general omnipolar ──
  if (!proyecto.tiene_interruptor_general_omnipolar) {
    alertas.push({
      ric: 'RIC N°10 — punto 5.1.3.3',
      nivel: 'ERROR',
      campo: 'tablero',
      mensaje: 'Falta interruptor termomagnético general de corte omnipolar (fase y neutro).'
    });
  }

  // ── 7. Sección mínima alimentador ──
  if (seccion_alimentador_mm2 && seccion_alimentador_mm2 < SECCIONES_MINIMAS.alimentador) {
    alertas.push({
      ric: 'RIC N°03 — punto 5.1.2',
      nivel: 'ERROR',
      campo: 'alimentador',
      mensaje: `Sección del alimentador ${seccion_alimentador_mm2}mm² es inferior al mínimo de ${SECCIONES_MINIMAS.alimentador}mm².`
    });
  }

  // ── 8. Caída de tensión del alimentador ──
  if (longitud_alimentador_m && seccion_alimentador_mm2 && potencia_total_W) {
    const corriente = potencia_total_W / voltaje;
    const caida = calcularCaidaTension(corriente, longitud_alimentador_m, seccion_alimentador_mm2, voltaje);
    if (!caida.cumple_alimentador) {
      alertas.push({
        ric: 'RIC N°03 — punto 5.1.3',
        nivel: 'ADVERTENCIA',
        campo: 'caida_tension',
        mensaje: `Caída de tensión del alimentador ${caida.caida_pct}% supera el máximo de ${CAIDAS_TENSION.alimentador_max_pct}%. Aumentar sección del conductor.`
      });
    }
  }

  // ── 9. Puesta a tierra ──
  if (resistencia_tierra_ohm !== undefined) {
    const alertasTierra = validarPuestaATierra(
      resistencia_tierra_ohm,
      potencia_total_W / 1000,
      true // asumimos que tiene diferenciales
    );
    alertas.push(...alertasTierra);
  }

  // ── 10. Empalme recomendado ──
  let demandaKW = 0;
  if (potencia_total_W) {
    // Aplicar factor de demanda para casa habitación
    const p = potencia_total_W;
    if (p <= 3000) demandaKW = p / 1000;
    else if (p <= 120000) demandaKW = 3 + (p - 3000) * 0.35 / 1000;
    else demandaKW = 3 + (120000 - 3000) * 0.35 / 1000 + (p - 120000) * 0.25 / 1000;
  }
  const empalme = empalmeRecomendado(demandaKW, false);

  return {
    valido: alertas.filter(a => a.nivel === 'ERROR').length === 0,
    alertas,
    empalme_recomendado: empalme,
    demanda_kW: Math.round(demandaKW * 100) / 100,
    ric_aplicados: ['RIC N°01', 'RIC N°03', 'RIC N°04', 'RIC N°05', 'RIC N°06', 'RIC N°10']
  };
}

// ─────────────────────────────────────────────
// VALIDADOR INSTALACIÓN INDUSTRIAL
// ─────────────────────────────────────────────
function validarInstalacionIndustrial(proyecto) {
  const alertas = [];
  const { motores, canalizaciones, tablero_IP, tiene_diferencial_industrial } = proyecto;

  // Motores
  if (motores?.length) {
    motores.forEach((m, i) => {
      const datos = calcularMotor(m.hp, m.voltaje || 380);
      if (!m.curva_D) {
        alertas.push({
          ric: 'RIC N°07 — punto 5.6.2',
          nivel: 'ERROR',
          campo: `motor_${i + 1}`,
          mensaje: `Motor ${m.hp}HP: Termomagnético debe ser curva D (soporta corriente de arranque ×6). Corriente arranque: ${datos.corriente_arranque_A}A.`
        });
      }
      if (datos.corriente_nominal_A >= 3 && !m.tiene_guardamotor) {
        alertas.push({
          ric: 'RIC N°07 — punto 5.2.11',
          nivel: 'ERROR',
          campo: `motor_${i + 1}`,
          mensaje: `Motor ${m.hp}HP (${datos.corriente_nominal_A}A ≥ 3A): Requiere guardamotor dedicado obligatorio.`
        });
      }
    });
  }

  // Canalización industrial
  if (canalizaciones?.includes('PVC_corrugado_expuesto')) {
    alertas.push({
      ric: 'RIC N°04 / RIC N°10',
      nivel: 'ERROR',
      campo: 'canalizacion',
      mensaje: 'PVC corrugado expuesto PROHIBIDO en zona de maquinaria industrial. Usar GRC, IMC o bandeja metálica.'
    });
  }

  // IP tablero
  if (tablero_IP && tablero_IP < 54) {
    alertas.push({
      ric: 'RIC N°02 — punto 6.1.2',
      nivel: 'ERROR',
      campo: 'tablero',
      mensaje: `Tablero IP${tablero_IP} insuficiente para recinto industrial. Mínimo requerido: IP54.`
    });
  }

  return { valido: alertas.filter(a => a.nivel === 'ERROR').length === 0, alertas };
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  // Datos normativos
  SECCIONES_MINIMAS,
  CAPACIDAD_CONDUCTOR,
  CODIGO_COLORES,
  CANALIZACIONES,
  CIRCUITOS_MINIMOS,
  ILUMINACION_MINIMA,
  CAIDAS_TENSION,
  AISLAMIENTO_MINIMO,
  RESISTIVIDAD_TERRENOS,
  EMPALMES_MONOFASICOS,
  EMPALMES_TRIFASICOS,
  FACTORES_DEMANDA,

  // Funciones de cálculo
  calcularMotor,
  calcularGrupoMotores,
  calcularCaidaTension,
  seccionMinimaPorCorriente,
  termomagnéticoRecomendado,
  diferentialRecomendado,
  empalmeRecomendado,
  resistenciaPica,
  resistenciaPlaca,
  factorSimultaneidad,

  // Validadores
  validarInstalacionT1,
  validarInstalacionIndustrial,
  validarPuestaATierra
};
