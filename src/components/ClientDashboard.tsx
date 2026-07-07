import React, { useState } from 'react';
import { 
  Dumbbell, Utensils, Calendar as CalendarIcon, MessageSquare, 
  DollarSign, Check, Activity, Sparkles, Clock, Smile, Scale, 
  Ruler, Upload, FileText, CheckCircle, Info, Heart, ShoppingBag, Send, AlertTriangle
} from 'lucide-react';
import { AppState, Client, WorkoutPlan, NutritionPlan, Supplement, Message, CalendarSession, HabitLog, PhotoLog, MeasureLog } from '../types';

interface ClientDashboardProps {
  state: AppState;
  updateState: (newState: Partial<AppState>, description: string, user: string) => void;
  clientId: string;
}

export default function ClientDashboard({ state, updateState, clientId }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'registro' | 'chat' | 'calendario' | 'pagos'>('plan');
  
  // Daily registration state
  const [logWeight, setLogWeight] = useState('');
  const [logEnergy, setLogEnergy] = useState(4);
  const [logSleep, setLogSleep] = useState(7);
  const [logSoreness, setLogSoreness] = useState(3);
  const [logMood, setLogMood] = useState(4);
  const [logWater, setLogWater] = useState(2);
  const [logSteps, setLogSteps] = useState(10000);
  
  // Custom Photo simulation
  const [selectedPose, setSelectedPose] = useState<'frente' | 'perfil' | 'espalda'>('frente');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  // Custom Measurements state
  const [measureChest, setMeasureChest] = useState('');
  const [measureWaist, setMeasureWaist] = useState('');
  const [measureHips, setMeasureHips] = useState('');
  
  // Chat messaging
  const [userMsg, setUserMsg] = useState('');
  const [aiInquiriesOnly, setAiInquiriesOnly] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Stripe pay modal simulation
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  // Active client data
  const client = state.clients.find(c => c.id === clientId);

  if (!client) {
    return (
      <div className="p-6 text-center text-neutral-500 bg-white rounded-2xl border border-neutral-100 shadow-xs">
        <p>No se encontró el perfil de este cliente.</p>
      </div>
    );
  }

  // Active client-specific filtered structures
  const clientWorkouts = state.workouts.filter(w => w.clientId === client.id);
  const clientDiet = state.nutritionPlans.find(n => n.clientId === client.id);
  const clientSupplements = state.supplements.filter(s => s.clientId === client.id);
  const clientHabits = state.habitLogs[client.id] || [];
  const clientPhotos = state.photoLogs[client.id] || [];
  const clientMeasures = state.measureLogs[client.id] || [];
  const clientInvoices = state.invoices.filter(i => i.clientId === client.id);
  const clientChat = state.chats[client.id] || [];
  const clientSessions = state.sessions.filter(s => s.clientId === client.id);

  // Handle completed set checking / logging
  const handleToggleSetComplete = (workoutId: string, exId: string, setIndex: number, completed: boolean, weight?: number) => {
    const updatedWorkouts = state.workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exId) {
              return {
                ...ex,
                sets: ex.sets.map((set, sIdx) => {
                  if (sIdx === setIndex) {
                    return { ...set, isCompleted: completed, weightUsed: weight || set.weightUsed };
                  }
                  return set;
                })
              };
            }
            return ex;
          })
        };
      }
      return w;
    });

    // Check if whole workout is completed
    const targetW = updatedWorkouts.find(w => w.id === workoutId);
    if (targetW) {
      const allDone = targetW.exercises.every(ex => ex.sets.every(s => s.isCompleted));
      targetW.isCompleted = allDone;
    }

    updateState({ workouts: updatedWorkouts }, `Cliente ${client.name} completó serie en ejercicio`, client.name);
  };

  // Submit today's physical stats
  const handleRegisterHabits = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    const newLog: HabitLog = {
      date: todayStr,
      energy: Number(logEnergy),
      sleep: Number(logSleep),
      soreness: Number(logSoreness),
      mood: Number(logMood),
      waterConsumed: Number(logWater),
      stepsCount: Number(logSteps),
      weightLogged: logWeight ? Number(logWeight) : undefined
    };

    // Replace if date exists, otherwise insert
    const currentList = state.habitLogs[client.id] || [];
    const filtered = currentList.filter(l => l.date !== todayStr);
    const updatedLogs = {
      ...state.habitLogs,
      [client.id]: [newLog, ...filtered]
    };

    // If weight logged, update current weight profile of client
    let updatedClients = state.clients;
    if (logWeight) {
      updatedClients = state.clients.map(c => {
        if (c.id === client.id) {
          return { ...c, weight: Number(logWeight) };
        }
        return c;
      });
    }

    updateState(
      { habitLogs: updatedLogs, clients: updatedClients },
      `Cliente ${client.name} registró hábitos y peso diario`,
      client.name
    );

    alert('Métricas de hoy guardadas con éxito. Se han sincronizado con tu entrenador.');
    setLogWeight('');
  };

  // Upload Photo Simulation
  const handleAddPhotoSim = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const fitnessPhotos = [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400',
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400'
    ];
    const randomPhoto = customPhotoUrl || fitnessPhotos[Math.floor(Math.random() * fitnessPhotos.length)];

    const newPhoto: PhotoLog = {
      id: `ph_${Date.now()}`,
      date: todayStr,
      url: randomPhoto,
      pose: selectedPose
    };

    const currentList = state.photoLogs[client.id] || [];
    const updated = {
      ...state.photoLogs,
      [client.id]: [newPhoto, ...currentList]
    };

    updateState({ photoLogs: updated }, `Cliente ${client.name} subió foto de evolución`, client.name);
    setCustomPhotoUrl('');
    alert('Foto de evolución añadida. Tu entrenador ya puede verla.');
  };

  // Add Measurements
  const handleAddMeasures = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newMeasure: MeasureLog = {
      id: `me_${Date.now()}`,
      date: todayStr,
      chest: measureChest ? Number(measureChest) : undefined,
      waist: measureWaist ? Number(measureWaist) : undefined,
      hips: measureHips ? Number(measureHips) : undefined
    };

    const currentList = state.measureLogs[client.id] || [];
    const updated = {
      ...state.measureLogs,
      [client.id]: [newMeasure, ...currentList]
    };

    updateState({ measureLogs: updated }, `Cliente ${client.name} actualizó medidas corporales`, client.name);
    setMeasureChest('');
    setMeasureWaist('');
    setMeasureHips('');
    alert('Medidas registradas con éxito.');
  };

  // Send message or AI consultant trigger
  const handleSendClientMsg = async () => {
    if (!userMsg.trim()) return;

    if (aiInquiriesOnly) {
      // Trigger AI consultation
      setAiProcessing(true);
      try {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: client.id, message: userMsg })
        });
        const data = await response.json();
        if (data.success) {
          alert('Tu pregunta ha sido enviada al Asistente Coach IA. Tu entrenador real revisará y validará la respuesta en su panel antes de que se publique aquí. ¡Seguridad y rigor primero!');
        } else {
          alert('Hubo un inconveniente al consultar con el asistente deportivo.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiProcessing(false);
        setUserMsg('');
      }
    } else {
      // Regular message directly to the coach
      const newMsg: Message = {
        id: `m_${Date.now()}`,
        senderId: client.id,
        text: userMsg,
        timestamp: new Date().toISOString()
      };

      const clientChats = state.chats[client.id] || [];
      const updatedChats = {
        ...state.chats,
        [client.id]: [...clientChats, newMsg]
      };

      updateState({ chats: updatedChats }, `Mensaje de chat enviado por cliente ${client.name}`, client.name);
      setUserMsg('');
    }
  };

  // Stripe card simulator submit
  const handleStripePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoiceId) return;

    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === payingInvoiceId) {
        return { ...inv, status: 'pagado' as const };
      }
      return inv;
    });

    updateState({ invoices: updatedInvoices }, `Cliente ${client.name} realizó pago mediante simulador de Stripe`, client.name);
    setPayingInvoiceId(null);
    alert('¡Pago Procesado Correctamente! La factura ahora figura como "PAGADO" en tiempo real.');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100 shadow-xs">
      
      {/* MOBILE FRIENDLY HEADER */}
      <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-300 fill-emerald-300" />
            <span>Zona Cliente: ¡Hola, {client.name}!</span>
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Progreso Activo: {client.weight} kg • Meta: <span className="capitalize">{client.goal.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold">
            FitSync Client App
          </span>
        </div>
      </div>

      {/* COMPACT NAVIGATION */}
      <div className="flex bg-white border-b border-neutral-100 overflow-x-auto px-2">
        {[
          { id: 'plan', label: 'Mi Plan', icon: Dumbbell },
          { id: 'registro', label: 'Bitácora Física', icon: Activity },
          { id: 'chat', label: 'Mensajes y Coach IA', icon: MessageSquare },
          { id: 'calendario', label: 'Mi Agenda', icon: CalendarIcon },
          { id: 'pagos', label: 'Pagos / Recibos', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* MAIN SCREEN AREA */}
      <div className="p-5 flex-1 bg-white min-h-[400px]">

        {/* TAB 1: MI PLAN */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            
            {/* Active Workouts */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-neutral-800 text-sm flex items-center gap-1.5">
                <Dumbbell className="w-4.5 h-4.5 text-emerald-600" />
                <span>Mis Entrenamientos de Hoy</span>
              </h3>
              
              {clientWorkouts.map(workout => (
                <div key={workout.id} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-neutral-900 text-sm">{workout.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      workout.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {workout.isCompleted ? 'Rutina Completada' : 'Pendiente de Registro'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {workout.exercises.map(exercise => (
                      <div key={exercise.id} className="bg-white p-3 rounded-lg border border-neutral-100 text-xs">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-neutral-800">{exercise.name}</p>
                            {exercise.comment && <p className="text-[10px] text-neutral-400 italic">Coach: {exercise.comment}</p>}
                          </div>
                        </div>

                        {/* Interactive set checkbox & weight used */}
                        <div className="space-y-2">
                          {exercise.sets.map((set, idx) => (
                            <div key={set.id} className="flex flex-wrap items-center justify-between bg-neutral-50 p-2 rounded border border-neutral-150">
                              <span className="font-semibold text-neutral-600">Serie #{idx + 1}</span>
                              <span className="text-neutral-500">{set.reps} reps (RPE {set.rpe}) • Descanso: {set.rest}</span>
                              
                              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                <input
                                  type="number"
                                  placeholder="Kg"
                                  defaultValue={set.weightUsed || ''}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > 0) {
                                      handleToggleSetComplete(workout.id, exercise.id, idx, !!set.isCompleted, val);
                                    }
                                  }}
                                  className="w-12 text-center text-xs bg-white border border-neutral-200 rounded py-0.5 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleToggleSetComplete(workout.id, exercise.id, idx, !set.isCompleted, set.weightUsed)}
                                  className={`p-1 rounded transition ${
                                    set.isCompleted ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-500 hover:bg-neutral-300'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {clientWorkouts.length === 0 && (
                <p className="text-xs text-neutral-400 italic">No tienes rutinas asignadas hoy. Tu entrenador las cargará en breve.</p>
              )}
            </div>

            {/* Nutrition targets */}
            {clientDiet && (
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3 flex items-center gap-1.5">
                  <Utensils className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Mi Plan de Nutrición y Macros</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-100 text-xs">
                    <p className="text-neutral-400 font-semibold">Calorías</p>
                    <p className="font-bold text-neutral-900 mt-0.5">{clientDiet.calories} kcal</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-lg border border-emerald-100 text-xs">
                    <p className="font-semibold">Proteínas</p>
                    <p className="font-bold mt-0.5">{clientDiet.protein} g</p>
                  </div>
                  <div className="bg-sky-50 text-sky-900 p-2.5 rounded-lg border border-sky-100 text-xs">
                    <p className="font-semibold">Carbos</p>
                    <p className="font-bold mt-0.5">{clientDiet.carbs} g</p>
                  </div>
                  <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-100 text-xs">
                    <p className="font-semibold">Grasas</p>
                    <p className="font-bold mt-0.5">{clientDiet.fats} g</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Daily Meals */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-neutral-700">Comidas Diarias</p>
                    {clientDiet.meals.map((meal, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-neutral-100 text-xs">
                        <div className="flex justify-between font-bold text-neutral-800 mb-1">
                          <span>{meal.name}</span>
                          <span className="text-neutral-400">{meal.time}</span>
                        </div>
                        <p className="text-neutral-600 leading-relaxed">{meal.ingredients.join(' • ')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Smart Grocery Shopping List */}
                  <div className="bg-white p-3 rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Lista de la Compra Deportiva</span>
                    </p>
                    <div className="space-y-1">
                      {clientDiet.shoppingList.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 text-xs cursor-pointer">
                          <input type="checkbox" className="rounded text-emerald-500 focus:ring-0" />
                          <span className="text-neutral-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Supplement */}
            {clientSupplements.length > 0 && (
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3">Suplementación Recomendada</h3>
                <div className="space-y-2.5">
                  {clientSupplements.map(sup => (
                    <div key={sup.id} className="bg-white p-3 rounded-lg border border-neutral-100 text-xs">
                      <p className="font-semibold text-neutral-900 flex justify-between">
                        <span>{sup.name} ({sup.dosage})</span>
                        <span className="text-neutral-400">Toma: {sup.timing}</span>
                      </p>
                      <p className="text-neutral-600 mt-1"><span className="font-semibold">Beneficio:</span> {sup.benefits}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: REGISTRO DIARIO (BITÁCORA) */}
        {activeTab === 'registro' && (
          <div className="space-y-6">
            
            {/* Daily stats form */}
            <form onSubmit={handleRegisterHabits} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3">Registrar Métricas de Hoy</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Peso Hoy (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={logWeight}
                    onChange={(e) => setLogWeight(e.target.value)}
                    placeholder="Ej: 64.2"
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Nivel de Energía (1 al 5)</label>
                  <select
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  >
                    <option value={5}>5 - Excelente</option>
                    <option value={4}>4 - Alta</option>
                    <option value={3}>3 - Moderada</option>
                    <option value={2}>2 - Baja</option>
                    <option value={1}>1 - Agotado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Horas de Sueño</label>
                  <input
                    type="number"
                    value={logSleep}
                    onChange={(e) => setLogSleep(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Agua Consumida (L)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={logWater}
                    onChange={(e) => setLogWater(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Pasos Diarios</label>
                  <input
                    type="number"
                    value={logSteps}
                    onChange={(e) => setLogSteps(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition">
                    Guardar Métricas
                  </button>
                </div>
              </div>
            </form>

            {/* Photos evolution simulation */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3">Subir Foto de Progreso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Ángulo de la foto</label>
                  <select
                    value={selectedPose}
                    onChange={(e) => setSelectedPose(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none mb-3"
                  >
                    <option value="frente">Frente</option>
                    <option value="perfil">Perfil</option>
                    <option value="espalda">Espalda</option>
                  </select>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">URL de la foto (Opcional, simula cámara)</label>
                  <input
                    type="text"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-center p-4 border border-dashed border-neutral-300 rounded-lg">
                  <button
                    type="button"
                    onClick={handleAddPhotoSim}
                    className="px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-lg hover:bg-black transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir/Simular Captura FOTO</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Measures log */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3">Actualizar Medidas de Perímetro (cm)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Pecho</label>
                  <input
                    type="number"
                    value={measureChest}
                    onChange={(e) => setMeasureChest(e.target.value)}
                    placeholder="cm"
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Cintura</label>
                  <input
                    type="number"
                    value={measureWaist}
                    onChange={(e) => setMeasureWaist(e.target.value)}
                    placeholder="cm"
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Cadera</label>
                  <input
                    type="number"
                    value={measureHips}
                    onChange={(e) => setMeasureHips(e.target.value)}
                    placeholder="cm"
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={handleAddMeasures} className="w-full px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-lg">
                    Registrar Perímetros
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CHAT Y CONSULTAS IA COACH */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            
            {/* Disclaimer box about IA safety */}
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800 flex gap-2">
              <Info className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Asesor de Inteligencia Artificial Integrado</p>
                <p className="mt-0.5 text-emerald-700 leading-relaxed">
                  ¿Tienes dudas de entrenamiento o dieta? Pregunta libremente. Si activas el conmutador de IA, la respuesta será enviada inmediatamente a la cola de revisión de tu entrenador certificado para que la apruebe antes de publicarla formalmente.
                </p>
              </div>
            </div>

            {/* Chat list */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden flex flex-col h-[320px]">
              <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 text-xs font-semibold text-neutral-700">
                Mi Mensajería
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/30">
                {clientChat.filter(m => !m.reviewPending || m.approved).map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.senderId === client.id ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[9px] text-neutral-400 px-1 mb-0.5">
                      {msg.senderId === client.id ? 'Tú' : 'Entrenador'}
                    </span>
                    <div
                      className={`p-3 rounded-2xl text-xs whitespace-pre-line ${
                        msg.senderId === client.id
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {clientChat.length === 0 && (
                  <p className="text-xs text-neutral-400 italic text-center py-10">No hay chats registrados.</p>
                )}
              </div>
              
              {/* Message inputs */}
              <div className="p-3 border-t border-neutral-200 space-y-2 bg-white">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiInquiriesOnly}
                      onChange={(e) => setAiInquiriesOnly(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Preguntar al Asistente Coach IA (Revisado por entrenador)</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userMsg}
                    disabled={aiProcessing}
                    onChange={(e) => setUserMsg(e.target.value)}
                    placeholder={aiInquiriesOnly ? "Ej: ¿Qué puedo cenar hoy según mis macros?" : "Escribir mensaje a mi entrenador..."}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendClientMsg()}
                    className="flex-1 text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                  />
                  <button
                    onClick={handleSendClientMsg}
                    disabled={aiProcessing}
                    className="px-4 py-2 bg-neutral-950 text-white font-semibold text-xs rounded-lg hover:bg-neutral-850 transition flex items-center gap-1"
                  >
                    <span>{aiProcessing ? 'Procesando IA...' : 'Enviar'}</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: CALENDARIO */}
        {activeTab === 'calendario' && (
          <div className="space-y-6">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3">Mis Próximas Citas y Sesiones</h3>
              <div className="space-y-3">
                {clientSessions.map(sess => (
                  <div key={sess.id} className="flex justify-between items-center bg-white p-3.5 rounded-lg border border-neutral-100">
                    <div>
                      <p className="text-xs font-bold text-neutral-800">{sess.title}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Día {new Date(sess.start).toLocaleDateString()} a las {sess.start.split('T')[1]}h
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      sess.status === 'confirmada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {sess.status}
                    </span>
                  </div>
                ))}
                {clientSessions.length === 0 && (
                  <p className="text-xs text-neutral-400 italic">No tienes sesiones programadas.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FACTURAS Y PAGOS */}
        {activeTab === 'pagos' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-neutral-200">
              <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3">Mis Recibos y Suscripciones</h3>
              <div className="space-y-3">
                {clientInvoices.map(invoice => (
                  <div key={invoice.id} className="flex flex-wrap items-center justify-between bg-neutral-50 p-3.5 rounded-lg border border-neutral-150">
                    <div className="text-xs">
                      <p className="font-bold text-neutral-800 capitalize">{invoice.planType.replace('_', ' ')}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Emitida el {invoice.date} • Vence el {invoice.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <span className="font-bold text-neutral-800 text-sm">{invoice.amount} €</span>
                      
                      {invoice.status === 'pendiente' ? (
                        <button
                          onClick={() => setPayingInvoiceId(invoice.id)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 transition"
                        >
                          Pagar Ahora (Stripe)
                        </button>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          Pagado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* STRIPE SIMULATED MODAL */}
      {payingInvoiceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-100">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Stripe SECURE</span>
              <h3 className="text-sm font-bold text-neutral-800">Simulador de Pago</h3>
            </div>
            
            <form onSubmit={handleStripePaySubmit} className="space-y-4">
              <div className="text-xs bg-neutral-50 p-3 rounded-lg text-neutral-600">
                Pagarás la suscripción asignada de <span className="font-bold text-neutral-800">
                  {state.invoices.find(i => i.id === payingInvoiceId)?.amount} €
                </span>
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-neutral-500 mb-1">Número de Tarjeta</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 mb-1">Expiración</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 mb-1">CVC</label>
                  <input
                    type="password"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoiceId(null)}
                  className="px-3.5 py-1.5 border border-neutral-200 text-neutral-500 font-semibold text-xs rounded-lg hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
