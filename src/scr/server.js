// ============================================================
// PlanoSEC Backend Server — Voltum SpA
// Express.js + Proxy Anthropic API + Motor RIC
// ============================================================

const express = require('express');
const cors = require('cors');
const {
  validarInstalacionT1,
  validarInstalacionIndustrial,
  calcularMotor,
  calcularGrupoMotores,
  calcularCaidaTension,
  seccionMinimaPorCorriente,
  termomagnéticoRecomendado,
  empalmeRecomendado,
  resistenciaPica,
  factorSimultaneidad,
  CODIGO_COLORES,
  CANALIZACIONES,
  CIRCUITOS_MINIMOS,
  SECCIONES_MINIMAS,
  EMPALMES_MONOFASICOS,
  EMPALMES_TRIFASICOS
} = require('./rules/ric-rules');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Logger ──
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ════════════════════════════════════════════════
// RUTA: Health check
// ════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    status: '✅ PlanoSEC Backend activo',
    version: '1.0.0',
    empresa: 'Voltum SpA',
    rics_cargados: 19,
    endpoints: [
      'POST /api/chat',
      'POST /api/validar/t1',
      'POST /api/validar/industrial',
      'POST /api/calcular/motor',
      'POST /api/calcular/grupo-motores',
      'POST /api/calcular/caida-tension',
      'POST /api/calcular/empalme',
      'POST /api/calcular/pica-tierra',
      'GET  /api/referencia/colores',
      'GET  /api/referencia/canalizaciones/:tipo',
      'GET  /api/referencia/secciones',
      'GET  /api/referencia/empalmes'
    ]
  });
});

// ════════════════════════════════════════════════
// RUTA: Proxy Anthropic API
// ════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'API Key de Anthropic no configurada. Agregar ANTHROPIC_API_KEY en las variables de entorno de Railway.'
    });
  }

  try {
    const { messages, system, model, max_tokens } = req.body;

    // System prompt con contexto RIC
    const systemPrompt = system || `Eres el asistente técnico de PlanoSEC, un software de Voltum SpA para técnicos SEC chilenos.
Tu especialidad son los 19 Pliegos Técnicos Normativos RIC (Reglamento de Instalaciones de Consumo) de la SEC Chile.
Respondes preguntas técnicas sobre instalaciones eléctricas, normativa SEC, cálculos de conductores, protecciones y planos.
Siempre citas el RIC específico que aplica. Usas valores y tablas exactas de las RIC.
Respondes en español chileno, de forma técnica pero clara para instaladores eléctricos SEC.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 1024,
        system: systemPrompt,
        messages: messages || []
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    res.json(data);

  } catch (err) {
    console.error('Error Anthropic API:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Validar instalación T1 domiciliaria
// ════════════════════════════════════════════════
app.post('/api/validar/t1', (req, res) => {
  try {
    const resultado = validarInstalacionT1(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Validar instalación industrial
// ════════════════════════════════════════════════
app.post('/api/validar/industrial', (req, res) => {
  try {
    const resultado = validarInstalacionIndustrial(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Calcular motor individual
// ════════════════════════════════════════════════
app.post('/api/calcular/motor', (req, res) => {
  try {
    const { hp, voltaje = 380, cosfi = 0.85, rendimiento = 0.90 } = req.body;
    if (!hp) return res.status(400).json({ error: 'Se requiere potencia en HP' });
    const resultado = calcularMotor(hp, voltaje, cosfi, rendimiento);
    res.json({
      ...resultado,
      referencia_ric: 'RIC N°07 — Instalaciones de Equipos',
      notas: [
        'Corriente de diseño = corriente nominal × 1.25 (RIC N°07 punto 5.5.2)',
        'Curva D obligatoria para motores (soporta corriente arranque ×6)',
        `Guardamotor ${resultado.guardamotor_requerido ? 'OBLIGATORIO' : 'no requerido'} (corriente nominal ${resultado.corriente_nominal_A}A)`
      ]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Calcular grupo de motores
// ════════════════════════════════════════════════
app.post('/api/calcular/grupo-motores', (req, res) => {
  try {
    const { motores } = req.body;
    if (!motores?.length) return res.status(400).json({ error: 'Se requiere array de motores con campo hp' });
    const resultado = calcularGrupoMotores(motores);
    res.json({
      ...resultado,
      referencia_ric: 'RIC N°07 — punto 5.5.5',
      formula: 'I_total = 1.25 × I_mayor + Σ I_resto'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Calcular caída de tensión
// ════════════════════════════════════════════════
app.post('/api/calcular/caida-tension', (req, res) => {
  try {
    const { corriente_A, longitud_m, seccion_mm2, tension_V = 220, monofasico = true } = req.body;
    if (!corriente_A || !longitud_m || !seccion_mm2) {
      return res.status(400).json({ error: 'Se requieren: corriente_A, longitud_m, seccion_mm2' });
    }
    const resultado = calcularCaidaTension(corriente_A, longitud_m, seccion_mm2, tension_V, monofasico);
    res.json({
      ...resultado,
      limites: {
        alimentador_max_pct: 3,
        total_max_pct: 5,
        referencia: 'RIC N°03 — punto 5.1.3'
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Calcular empalme recomendado
// ════════════════════════════════════════════════
app.post('/api/calcular/empalme', (req, res) => {
  try {
    const { demanda_kW, trifasico = false } = req.body;
    if (!demanda_kW) return res.status(400).json({ error: 'Se requiere demanda_kW' });
    const empalme = empalmeRecomendado(demanda_kW, trifasico);
    res.json({
      demanda_kW,
      trifasico,
      empalme_recomendado: empalme,
      referencia_ric: 'RIC N°01 — Empalmes',
      todos_disponibles: trifasico ? EMPALMES_TRIFASICOS : EMPALMES_MONOFASICOS
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTA: Calcular resistencia pica tierra
// ════════════════════════════════════════════════
app.post('/api/calcular/pica-tierra', (req, res) => {
  try {
    const { longitud_m, resistividad_ohm_m } = req.body;
    if (!longitud_m || !resistividad_ohm_m) {
      return res.status(400).json({ error: 'Se requieren: longitud_m, resistividad_ohm_m' });
    }
    const resistencia = resistenciaPica(longitud_m, resistividad_ohm_m);
    const cumple_normal = resistencia <= 20;
    const cumple_con_diferencial = resistencia <= 80;
    res.json({
      longitud_m,
      resistividad_ohm_m,
      resistencia_ohm: resistencia,
      cumple_limite_normal_20ohm: cumple_normal,
      cumple_limite_con_diferencial_30mA_80ohm: cumple_con_diferencial,
      formula: 'R = ρ / L',
      referencia_ric: 'RIC N°06 — Tabla 6.4',
      recomendacion: !cumple_normal
        ? `Agregar ${Math.ceil(resistencia / 20)} pica(s) adicional(es) o usar aditivo ionizante`
        : 'Resistencia dentro del límite normativo'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════
// RUTAS: Referencia normativa
// ════════════════════════════════════════════════
app.get('/api/referencia/colores', (req, res) => {
  res.json({
    codigo_colores: CODIGO_COLORES,
    referencia_ric: 'RIC N°04 — Conductores y Canalizaciones',
    nota: 'Identificación por colores obligatoria en todas las instalaciones'
  });
});

app.get('/api/referencia/canalizaciones/:tipo', (req, res) => {
  const tipo = req.params.tipo;
  const datos = CANALIZACIONES[tipo];
  if (!datos) {
    return res.status(404).json({
      error: `Tipo de recinto "${tipo}" no encontrado`,
      tipos_disponibles: Object.keys(CANALIZACIONES)
    });
  }
  res.json({ tipo_recinto: tipo, ...datos, referencia_ric: 'RIC N°04 / RIC N°10' });
});

app.get('/api/referencia/secciones', (req, res) => {
  res.json({
    secciones_minimas: SECCIONES_MINIMAS,
    referencia_ric: 'RIC N°04 — punto 5.4',
    nota: 'Secciones en mm² para conductores de cobre'
  });
});

app.get('/api/referencia/empalmes', (req, res) => {
  res.json({
    monofasicos: EMPALMES_MONOFASICOS,
    trifasicos: EMPALMES_TRIFASICOS,
    referencia_ric: 'RIC N°01 — Tabla empalmes normalizados'
  });
});

app.get('/api/referencia/circuitos-minimos', (req, res) => {
  res.json({
    circuitos_minimos: CIRCUITOS_MINIMOS,
    referencia_ric: 'RIC N°10 — Instalaciones de uso general'
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ PlanoSEC Backend corriendo en puerto ${PORT}`);
  console.log(`📋 19 RIC cargados en motor de reglas`);
  console.log(`🔑 API Key Anthropic: ${ANTHROPIC_API_KEY ? 'Configurada ✅' : 'No configurada ⚠️'}`);
});

module.exports = app;
