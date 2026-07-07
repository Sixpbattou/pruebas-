import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { AppState, Client, WorkoutPlan, NutritionPlan, Supplement, Message, CalendarSession } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database / App State
let appState: AppState = {
  clients: [
    {
      id: 'alejandro_gomez',
      name: 'Alejandro Gómez',
      email: 'alejandro.gomez@gmail.com',
      age: 28,
      gender: 'Masculino',
      weight: 78,
      height: 180,
      injuries: 'Ninguna',
      experience: 'intermedio',
      goal: 'ganar_musculo',
      availability: '4 días/semana',
      material: 'Gimnasio completo',
      sportHistory: 'Fútbol amateur y 1 año de gimnasio intermitente',
      privateNotes: 'Se fatiga rápido con peso muerto, priorizar volumen en press de banca. Muy motivado.',
      alerts: ['Pago mensual pendiente en 3 días'],
      status: 'activo',
      createdAt: '2026-05-01',
      stripeCustomerId: 'cus_R7yT8oN2k1L',
      stripeSubscriptionId: 'sub_1O8yTr2h4K1',
      stripeSubscriptionStatus: 'active',
      stripeSubscriptionTier: 'premium_80',
      stripeCardBrand: 'Visa',
      stripeCardLast4: '4242'
    },
    {
      id: 'beatriz_ramos',
      name: 'Beatriz Ramos',
      email: 'beatriz.ramos@gmail.com',
      age: 34,
      gender: 'Femenino',
      weight: 64,
      height: 168,
      injuries: 'Tendinitis rotuliana leve en la rodilla izquierda',
      experience: 'principiante',
      goal: 'perder_grasa',
      availability: '3 días/semana',
      material: 'Mancuernas y bandas en casa',
      sportHistory: 'Ninguno regular, solía hacer yoga hace años',
      privateNotes: 'Evitar sentadillas profundas con alta carga. Sustituir por zancadas controladas e isometría.',
      alerts: ['Actualizar fotos de evolución', 'Nueva consulta sobre suplementación'],
      status: 'activo',
      createdAt: '2026-06-15',
      stripeCustomerId: 'cus_H3jF8mP1o8Q',
      stripeSubscriptionId: 'sub_1N3xPq9b7G4',
      stripeSubscriptionStatus: 'active',
      stripeSubscriptionTier: 'basic_45',
      stripeCardBrand: 'Mastercard',
      stripeCardLast4: '9988'
    }
  ],
  workouts: [
    {
      id: 'w_alejandro_1',
      clientId: 'alejandro_gomez',
      name: 'Torso - Fuerza Hipertrofia',
      date: '2026-07-06',
      exercises: [
        {
          id: 'ex_1',
          name: 'Press de Banca Plano',
          videoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600',
          comment: 'Mantener retracción escapular y codos a 45 grados',
          sets: [
            { id: 's1', reps: '8', rpe: '8', rest: '2 min', tempo: '3010', weightUsed: 70, isCompleted: true },
            { id: 's2', reps: '8', rpe: '8', rest: '2 min', tempo: '3010', weightUsed: 70, isCompleted: true },
            { id: 's3', reps: '8', rpe: '9', rest: '2 min', tempo: '3010', weightUsed: 72, isCompleted: true }
          ]
        },
        {
          id: 'ex_2',
          name: 'Remo con Barra',
          videoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
          comment: 'Tirar hacia la cadera baja para activar dorsales',
          sets: [
            { id: 's4', reps: '10', rpe: '8', rest: '90s', tempo: '2011', weightUsed: 50, isCompleted: true },
            { id: 's5', reps: '10', rpe: '8', rest: '90s', tempo: '2011', weightUsed: 50, isCompleted: true },
            { id: 's6', reps: '10', rpe: '8', rest: '90s', tempo: '2011', weightUsed: 50, isCompleted: true }
          ]
        },
        {
          id: 'ex_3',
          name: 'Press Militar con Mancuernas',
          comment: 'Sin bloquear codos arriba para mantener tensión',
          sets: [
            { id: 's7', reps: '12', rpe: '8', rest: '90s', tempo: '2010', weightUsed: 18 },
            { id: 's8', reps: '10', rpe: '9', rest: '90s', tempo: '2010', weightUsed: 18 }
          ]
        }
      ]
    },
    {
      id: 'w_beatriz_1',
      clientId: 'beatriz_ramos',
      name: 'Full Body Adaptación en Casa',
      date: '2026-07-07',
      exercises: [
        {
          id: 'ex_b1',
          name: 'Zancadas Atrás Controladas',
          comment: 'Si duele la rodilla izquierda, hazlo sin peso, solo peso corporal',
          sets: [
            { id: 's_b1', reps: '12 por lado', rpe: '7', rest: '60s', tempo: '2110', weightUsed: 6, isCompleted: true },
            { id: 's_b2', reps: '12 por lado', rpe: '7', rest: '60s', tempo: '2110', weightUsed: 6, isCompleted: true },
            { id: 's_b3', reps: '12 por lado', rpe: '8', rest: '60s', tempo: '2110', weightUsed: 8 }
          ]
        },
        {
          id: 'ex_b2',
          name: 'Flexiones de Brazo (Apoyado en Rodillas)',
          comment: 'Rango de movimiento completo, tocar pecho con el suelo',
          sets: [
            { id: 's_b4', reps: '10', rpe: '8', rest: '60s', tempo: '3010', isCompleted: true },
            { id: 's_b5', reps: '8', rpe: '8.5', rest: '60s', tempo: '3010' }
          ]
        }
      ]
    }
  ],
  nutritionPlans: [
    {
      id: 'nut_alejandro',
      clientId: 'alejandro_gomez',
      calories: 2900,
      protein: 160,
      carbs: 350,
      fats: 80,
      fiber: 35,
      water: 3.5,
      micronutrients: 'Vitaminas del grupo B, Magnesio (400mg antes de dormir) y Zinc.',
      dietType: 'estandar',
      meals: [
        { name: 'Desayuno', time: '08:30', ingredients: ['100g de avena en copos', '250ml de leche entera', '1 plátano', '30g de proteína de suero', '15g de nueces'] },
        { name: 'Almuerzo (Post-entreno)', time: '14:00', ingredients: ['150g de pechuga de pollo', '200g de arroz basmati pesado en crudo', 'Ensalada mixta con aceite de oliva'] },
        { name: 'Merienda', time: '18:00', ingredients: ['2 rebanadas de pan integral con 80g de jamón serrano y tomate rústico'] },
        { name: 'Cena', time: '21:30', ingredients: ['180g de filete de salmón', '250g de patata al horno con finas hierbas', 'Judías verdes al vapor'] }
      ],
      shoppingList: ['Avena', 'Leche entera', 'Plátanos', 'Pollo', 'Arroz basmati', 'Pan integral', 'Jamón serrano', 'Salmón', 'Patatas', 'Judías verdes']
    },
    {
      id: 'nut_beatriz',
      clientId: 'beatriz_ramos',
      calories: 1600,
      protein: 115,
      carbs: 150,
      fats: 50,
      fiber: 28,
      water: 2.5,
      micronutrients: 'Calcio y Vitamina D para apoyo de tendones y articulaciones.',
      dietType: 'mediterranea',
      meals: [
        { name: 'Desayuno', time: '08:00', ingredients: ['2 huevos revueltos', '1 tostada de pan de centeno integral con aguacate triturado', 'Café con leche de soja'] },
        { name: 'Almuerzo', time: '13:30', ingredients: ['150g de merluza a la plancha', 'Ensalada verde grande con espinacas, canónigos, tomate y aceite de oliva rústico'] },
        { name: 'Merienda', time: '17:30', ingredients: ['1 yogur griego natural sin azúcar', '30g de almendras crudas', 'Un puñado de arándanos frescos'] },
        { name: 'Cena', time: '21:00', ingredients: ['Tortilla francesa de 2 huevos con champiñones y espárragos trigueros al horno'] }
      ],
      shoppingList: ['Huevos', 'Pan de centeno', 'Aguacates', 'Leche de soja', 'Merluza', 'Espinacas', 'Yogur griego', 'Almendras', 'Arándanos', 'Champiñones']
    }
  ],
  supplements: [
    {
      id: 'sup_ale_1',
      clientId: 'alejandro_gomez',
      name: 'Creatina Monohidrato',
      dosage: '5g diarios',
      timing: 'Justo después de entrenar en el batido de proteínas o con el desayuno en días de descanso.',
      benefits: 'Aumenta las reservas de fosfocreatina, mejorando la fuerza explosiva, potencia y promoviendo la hipertrofia muscular.',
      warnings: 'Mantener una hidratación óptima de al menos 3L de agua diarios.'
    },
    {
      id: 'sup_ale_2',
      clientId: 'alejandro_gomez',
      name: 'Proteína de Suero (Whey)',
      dosage: '30g por toma',
      timing: 'En el desayuno o inmediatamente post-entreno.',
      benefits: 'Aporte rápido de aminoácidos esenciales para acelerar la recuperación y síntesis proteica.',
      warnings: 'Es un suplemento alimentario, no sustituye comidas reales.'
    },
    {
      id: 'sup_bea_1',
      clientId: 'beatriz_ramos',
      name: 'Colágeno Hidrolizado + Magnesio',
      dosage: '10g diarios',
      timing: 'Por las mañanas disuelto en agua o té.',
      benefits: 'Ayuda a la regeneración y flexibilidad de tendones, clave para mitigar la tendinitis rotuliana.',
      warnings: 'Consumo constante durante al menos 3 meses para notar efectos significativos.'
    }
  ],
  habitLogs: {
    alejandro_gomez: [
      { date: '2026-07-04', energy: 4, sleep: 7.5, soreness: 3, mood: 4, waterConsumed: 3.2, stepsCount: 11200, weightLogged: 78.1 },
      { date: '2026-07-05', energy: 5, sleep: 8.0, soreness: 2, mood: 5, waterConsumed: 3.6, stepsCount: 12500, weightLogged: 78.0 },
      { date: '2026-07-06', energy: 4, sleep: 7.0, soreness: 4, mood: 4, waterConsumed: 3.4, stepsCount: 10800, weightLogged: 78.2 }
    ],
    beatriz_ramos: [
      { date: '2026-07-05', energy: 3, sleep: 6.5, soreness: 4, mood: 3, waterConsumed: 2.2, stepsCount: 7500, weightLogged: 64.2 },
      { date: '2026-07-06', energy: 4, sleep: 7.0, soreness: 3, mood: 4, waterConsumed: 2.6, stepsCount: 8800, weightLogged: 64.0 },
      { date: '2026-07-07', energy: 3, sleep: 6.0, soreness: 2, mood: 3, waterConsumed: 2.5, stepsCount: 9200, weightLogged: 63.9 }
    ]
  },
  photoLogs: {
    alejandro_gomez: [
      { id: 'ph_a_1', date: '2026-06-01', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', pose: 'frente' },
      { id: 'ph_a_2', date: '2026-07-01', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', pose: 'frente' }
    ],
    beatriz_ramos: [
      { id: 'ph_b_1', date: '2026-06-15', url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400', pose: 'frente' }
    ]
  },
  measureLogs: {
    alejandro_gomez: [
      { id: 'me_a_1', date: '2026-06-01', chest: 102, waist: 82, hips: 96, biceps: 37, thighs: 58 },
      { id: 'me_a_2', date: '2026-07-01', chest: 104, waist: 81, hips: 96, biceps: 38, thighs: 59 }
    ],
    beatriz_ramos: [
      { id: 'me_b_1', date: '2026-06-15', chest: 90, waist: 74, hips: 98, biceps: 28, thighs: 54 }
    ]
  },
  invoices: [
    { id: 'inv_1', clientId: 'alejandro_gomez', amount: 80, status: 'pagado', date: '2026-06-01', dueDate: '2026-06-05', planType: 'suscripción_mensual' },
    { id: 'inv_2', clientId: 'alejandro_gomez', amount: 80, status: 'pendiente', date: '2026-07-01', dueDate: '2026-07-10', planType: 'suscripción_mensual' },
    { id: 'inv_3', clientId: 'beatriz_ramos', amount: 80, status: 'pagado', date: '2026-06-15', dueDate: '2026-06-20', planType: 'suscripción_mensual' }
  ],
  chats: {
    alejandro_gomez: [
      { id: 'm1', senderId: 'coach', text: '¡Hola Alejandro! ¿Cómo van esas agujetas del entrenamiento de ayer?', timestamp: '2026-07-06T10:00:00.000Z' },
      { id: 'm2', senderId: 'alejandro_gomez', text: '¡Buenas Coach! Bastantes agujetas en pectorales, pero con muchas ganas de seguir. El press plano se sintió espectacular.', timestamp: '2026-07-06T10:15:00.000Z' },
      { id: 'm3', senderId: 'coach', text: '¡Excelente! Subimos 2kg en la última serie para la próxima sesión. ¡A darle!', timestamp: '2026-07-06T10:30:00.000Z' }
    ],
    beatriz_ramos: [
      { id: 'm4', senderId: 'coach', text: 'Hola Beatriz, recuerda controlar la velocidad en las zancadas para no fatigar la rodilla.', timestamp: '2026-07-07T09:00:00.000Z' },
      { id: 'm5', senderId: 'beatriz_ramos', text: 'Entendido, hoy entreno en casa y me concentraré en la técnica de la rodilla.', timestamp: '2026-07-07T09:30:00.000Z' }
    ]
  },
  sessions: [
    { id: 's_1', clientId: 'alejandro_gomez', title: 'Asesoría y Chequeo Físico', start: '2026-07-09T17:00', end: '2026-07-09T18:00', status: 'confirmada' },
    { id: 's_2', clientId: 'beatriz_ramos', title: 'Sesión Online - Corrección de Técnica', start: '2026-07-10T11:00', end: '2026-07-10T12:00', status: 'pendiente' }
  ],
  logs: [
    { id: 'l1', timestamp: '2026-07-07T14:30:00.000Z', type: 'info', message: 'Se creó la rutina Full Body para Beatriz Ramos', user: 'Coach' },
    { id: 'l2', timestamp: '2026-07-07T15:01:00.000Z', type: 'info', message: 'Beatriz Ramos registró hábitos diarios', user: 'Beatriz Ramos' }
  ],
  config: {
    language: 'es',
    theme: 'light',
    openaiKeySimulation: true
  }
};

// SSE active clients
let sseClients: any[] = [];

// Helper to broadcast changes
function broadcastStateUpdate() {
  const dataString = `data: ${JSON.stringify(appState)}\n\n`;
  sseClients.forEach(client => client.res.write(dataString));
}

// Lazy load Gemini AI Studio
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// GET State
app.get('/api/state', (req, res) => {
  res.json(appState);
});

// POST State Update
app.post('/api/state/update', (req, res) => {
  const { clients, workouts, nutritionPlans, supplements, habitLogs, photoLogs, measureLogs, invoices, chats, sessions, logs, config } = req.body;
  
  if (clients) appState.clients = clients;
  if (workouts) appState.workouts = workouts;
  if (nutritionPlans) appState.nutritionPlans = nutritionPlans;
  if (supplements) appState.supplements = supplements;
  if (habitLogs) appState.habitLogs = habitLogs;
  if (photoLogs) appState.photoLogs = photoLogs;
  if (measureLogs) appState.measureLogs = measureLogs;
  if (invoices) appState.invoices = invoices;
  if (chats) appState.chats = chats;
  if (sessions) appState.sessions = sessions;
  if (logs) appState.logs = logs;
  if (config) appState.config = config;

  // Add a system log for tracking
  const logMessage = req.body.actionDescription || 'Cambio guardado en el sistema';
  const logUser = req.body.actionUser || 'Sistema';
  appState.logs.unshift({
    id: `l_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'info',
    message: logMessage,
    user: logUser
  });

  if (appState.logs.length > 50) {
    appState.logs = appState.logs.slice(0, 50);
  }

  broadcastStateUpdate();
  res.json({ success: true, appState });
});

// SSE Stream Setup
app.get('/api/sync/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(appState)}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// AI Analyze Endpoint for Personalized Workouts & Diets
app.post('/api/gemini/analyze', async (req, res) => {
  const { clientId } = req.body;
  const client = appState.clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback simulation if API key is not ready
    const simulatedWorkout: WorkoutPlan = {
      id: `w_ai_${Date.now()}`,
      clientId: client.id,
      name: `Plan AI - ${client.goal === 'ganar_musculo' ? 'Hipertrofia Estructurada' : 'Déficit Metabólico'}`,
      date: new Date().toISOString().split('T')[0],
      exercises: [
        {
          id: `ex_ai_1`,
          name: client.goal === 'ganar_musculo' ? 'Sentadillas de Fuerza' : 'Sentadillas Globulares con Mancuerna',
          comment: `Adecuado para principiantes con foco en ${client.goal}. Mantener espalda neutra.`,
          sets: [
            { id: 'as1', reps: '10', rpe: '8', rest: '90s', tempo: '3010' },
            { id: 'as2', reps: '10', rpe: '8', rest: '90s', tempo: '3010' }
          ]
        },
        {
          id: `ex_ai_2`,
          name: 'Flexiones / Press de Pecho con Mancuerna',
          comment: 'Rango controlado enfocado en la estabilidad escapular.',
          sets: [
            { id: 'as3', reps: '12', rpe: '7.5', rest: '90s', tempo: '2010' }
          ]
        }
      ]
    };

    const calories = client.goal === 'ganar_musculo' ? Math.round(client.weight * 36) : Math.round(client.weight * 26);
    const protein = Math.round(client.weight * 2);
    const fats = Math.round(client.weight * 0.9);
    const carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);

    const simulatedDiet: NutritionPlan = {
      id: `nut_ai_${Date.now()}`,
      clientId: client.id,
      calories,
      protein,
      carbs,
      fats,
      fiber: 25,
      water: 3,
      micronutrients: 'Potasio, Magnesio, Vitamina D3, Omega 3 marino',
      dietType: 'estandar',
      meals: [
        { name: 'Desayuno', time: '08:00', ingredients: [`${protein - 10}g de proteínas de fuentes limpias (claras/huevo/suero)`, 'Porción de carbohidratos complejos (avena/pan integral)'] },
        { name: 'Almuerzo', time: '13:30', ingredients: ['150g de carne magra o pescado azul', 'Arroz integral o boniato asado', 'Verduras variadas'] },
        { name: 'Cena', time: '21:00', ingredients: ['Ensalada con espinacas frescas y frutos secos', '150g de proteína magra', 'Aceite de oliva virgen extra'] }
      ],
      shoppingList: ['Pollo magro', 'Huevos ecológicos', 'Avena de grano entero', 'Arroz integral', 'Boniato', 'Verduras verdes', 'Aceite de oliva']
    };

    const simulatedSupplements: Supplement[] = [
      {
        id: `sup_ai_1`,
        clientId: client.id,
        name: 'Omega 3 de Alta Concentración',
        dosage: '2 cápsulas al día',
        timing: 'Con la comida principal.',
        benefits: 'Reduce la inflamación muscular de manera notable y apoya el sistema cardiovascular.',
        warnings: 'Consultar con el médico si se consumen anticoagulantes.'
      }
    ];

    return res.json({
      success: true,
      simulated: true,
      workout: simulatedWorkout,
      nutrition: simulatedDiet,
      supplements: simulatedSupplements,
      message: 'Plan de Inteligencia Artificial generado con éxito (Simulador activo).'
    });
  }

  try {
    const prompt = `
      Actúa como un entrenador personal certificado y dietista deportivo de élite.
      Analiza el siguiente perfil de cliente:
      - Nombre: ${client.name}
      - Edad: ${client.age} años
      - Sexo: ${client.gender}
      - Peso: ${client.weight} kg
      - Altura: ${client.height} cm
      - Lesiones o Dolores: ${client.injuries}
      - Experiencia en entrenamiento: ${client.experience}
      - Objetivo: ${client.goal} (perder_grasa, ganar_musculo, rendimiento, salud)
      - Disponibilidad semanal: ${client.availability}
      - Material disponible para entrenar: ${client.material}
      - Historial deportivo: ${client.sportHistory}

      Genera automáticamente en formato JSON estricto un plan integral que contenga:
      1. Un plan de entrenamiento ajustado ( WorkoutPlan ).
      2. Un plan nutricional personalizado ( NutritionPlan ).
      3. Una lista de suplementación recomendada útil y basada en ciencia para este objetivo específico.

      Devuelve un JSON estrictamente estructurado con este formato:
      {
        "workout": {
          "name": "Nombre de la rutina sugerida",
          "exercises": [
            {
              "name": "Nombre del ejercicio",
              "comment": "Comentario técnico/fisiológico sobre el ejercicio adaptado a sus dolores o material",
              "sets": [
                { "reps": "Repeticiones (ej: '10' o '12')", "rpe": "Nivel de esfuerzo estimado en RPE (ej: '8')", "rest": "Segundos de descanso (ej: '90s')", "tempo": "Tempo (ej: '3010')" }
              ]
            }
          ]
        },
        "nutrition": {
          "calories": calorías_totales_num,
          "protein": gramos_proteina_num,
          "carbs": gramos_carbohidratos_num,
          "fats": gramos_grasas_num,
          "fiber": gramos_fibra_num,
          "water": litros_agua_num,
          "micronutrients": "Recomendaciones de micronutrientes",
          "dietType": "mediterranea" o "vegana" o "cetogenica" o "ayuno_intermitente" o "estandar",
          "meals": [
            { "name": "Nombre de comida (Desayuno, Almuerzo, etc)", "time": "Hora aproximada (ej: '08:30')", "ingredients": ["Ingrediente 1 con cantidad sugerida", "Ingrediente 2"] }
          ],
          "shoppingList": ["Alimento 1", "Alimento 2"]
        },
        "supplements": [
          {
            "name": "Nombre del suplemento",
            "dosage": "Dosis diaria recomendada",
            "timing": "Cuándo tomarlo",
            "benefits": "Beneficio clave para este cliente",
            "warnings": "Advertencia de consumo saludable"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workout: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      comment: { type: Type.STRING },
                      sets: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            reps: { type: Type.STRING },
                            rpe: { type: Type.STRING },
                            rest: { type: Type.STRING },
                            tempo: { type: Type.STRING }
                          },
                          required: ['reps', 'rpe', 'rest', 'tempo']
                        }
                      }
                    },
                    required: ['name', 'comment', 'sets']
                  }
                }
              },
              required: ['name', 'exercises']
            },
            nutrition: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.INTEGER },
                protein: { type: Type.INTEGER },
                carbs: { type: Type.INTEGER },
                fats: { type: Type.INTEGER },
                fiber: { type: Type.INTEGER },
                water: { type: Type.NUMBER },
                micronutrients: { type: Type.STRING },
                dietType: { type: Type.STRING },
                meals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      time: { type: Type.STRING },
                      ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['name', 'time', 'ingredients']
                  }
                },
                shoppingList: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['calories', 'protein', 'carbs', 'fats', 'fiber', 'water', 'micronutrients', 'dietType', 'meals', 'shoppingList']
            },
            supplements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  timing: { type: Type.STRING },
                  benefits: { type: Type.STRING },
                  warnings: { type: Type.STRING }
                },
                required: ['name', 'dosage', 'timing', 'benefits', 'warnings']
              }
            }
          },
          required: ['workout', 'nutrition', 'supplements']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');

    // Add generated IDs to the returned data
    const workout: WorkoutPlan = {
      id: `w_ai_${Date.now()}`,
      clientId: client.id,
      name: data.workout.name || 'Plan de Entrenamiento Inteligente',
      date: new Date().toISOString().split('T')[0],
      exercises: data.workout.exercises.map((ex: any, idx: number) => ({
        id: `ex_ai_${idx}_${Date.now()}`,
        name: ex.name,
        comment: ex.comment,
        sets: ex.sets.map((set: any, setIdx: number) => ({
          id: `set_ai_${idx}_${setIdx}_${Date.now()}`,
          reps: set.reps,
          rpe: set.rpe,
          rest: set.rest,
          tempo: set.tempo
        }))
      }))
    };

    const nutrition: NutritionPlan = {
      id: `nut_ai_${Date.now()}`,
      clientId: client.id,
      calories: data.nutrition.calories,
      protein: data.nutrition.protein,
      carbs: data.nutrition.carbs,
      fats: data.nutrition.fats,
      fiber: data.nutrition.fiber,
      water: data.nutrition.water,
      micronutrients: data.nutrition.micronutrients,
      dietType: data.nutrition.dietType,
      meals: data.nutrition.meals,
      shoppingList: data.nutrition.shoppingList
    };

    const supplements: Supplement[] = data.supplements.map((s: any, idx: number) => ({
      id: `sup_ai_${idx}_${Date.now()}`,
      clientId: client.id,
      name: s.name,
      dosage: s.dosage,
      timing: s.timing,
      benefits: s.benefits,
      warnings: s.warnings
    }));

    res.json({
      success: true,
      simulated: false,
      workout,
      nutrition,
      supplements
    });

  } catch (error) {
    console.error('Gemini Analyze Error: ', error);
    res.status(500).json({ error: 'Failed to process analyze requests with Gemini. Please try again.' });
  }
});

// Chat AI Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  const { clientId, message } = req.body;
  const client = appState.clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Simulated rich response if Gemini is not ready
    const simulatedResponse = `¡Hola! Como tu entrenador e IA certificada, analizando tu perfil con foco en ${client.goal.replace('_', ' ')}, te sugiero paciencia y constancia. Si tienes fatiga o molestias en la rodilla, descansa o haz ejercicios con foco en la cadena posterior como puentes de glúteo e isometría. ¿Te gustaría que registremos una nota de esto?`;
    
    // Add pending message to chat
    const coachMsg: Message = {
      id: `m_ai_${Date.now()}`,
      senderId: 'ai',
      text: simulatedResponse,
      timestamp: new Date().toISOString(),
      reviewPending: true // Trainer must approve
    };

    if (!appState.chats[client.id]) appState.chats[client.id] = [];
    appState.chats[client.id].push({
      id: `m_user_${Date.now()}`,
      senderId: client.id,
      text: message,
      timestamp: new Date().toISOString()
    });
    appState.chats[client.id].push(coachMsg);

    broadcastStateUpdate();
    return res.json({ success: true, simulated: true, coachMsg });
  }

  try {
    const prompt = `
      Eres un Entrenador Personal de Élite y Nutricionista Deportivo certificado que asiste a un cliente llamado ${client.name}.
      Información sobre el cliente:
      - Edad: ${client.age} años, Sexo: ${client.gender}
      - Peso: ${client.weight}kg, Altura: ${client.height}cm
      - Objetivo: ${client.goal}
      - Lesiones: ${client.injuries}
      - Nivel de experiencia: ${client.experience}

      Responde a la siguiente consulta del cliente como un profesional absoluto del deporte. Sé empático, científico, motivador y sumamente claro.
      Consulta: "${message}"

      Importante: Tu respuesta será mostrada en una cola de revisión para el entrenador real del cliente, quien la leerá y aprobará antes de que le llegue formalmente al cliente. Dirígete directamente al cliente pero de forma útil y profesional. No menciones que eres una IA de forma robótica. Responde en español de forma directa y enfocada al bienestar.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const aiText = response.text || 'Sin respuesta de la IA. Por favor, revisa manualmente.';

    const coachMsg: Message = {
      id: `m_ai_${Date.now()}`,
      senderId: 'ai',
      text: aiText,
      timestamp: new Date().toISOString(),
      reviewPending: true // Awaiting trainer review
    };

    if (!appState.chats[client.id]) appState.chats[client.id] = [];
    appState.chats[client.id].push({
      id: `m_user_${Date.now()}`,
      senderId: client.id,
      text: message,
      timestamp: new Date().toISOString()
    });
    appState.chats[client.id].push(coachMsg);

    broadcastStateUpdate();
    res.json({ success: true, simulated: false, coachMsg });

  } catch (error) {
    console.error('Gemini Chat Error: ', error);
    res.status(500).json({ error: 'Error processing AI chat query' });
  }
});

// Vite Middleware & Routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitSync server running at http://localhost:${PORT}`);
  });
}

startServer();
