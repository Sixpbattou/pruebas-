import React, { useState } from 'react';
import { 
  User, Dumbbell, Utensils, Calendar as CalendarIcon, MessageSquare, 
  DollarSign, Sliders, Plus, Trash, Copy, Check, Activity, Sparkles, 
  Clock, ArrowRight, Lock, Settings, AlertCircle, Upload, Download, 
  FileText, CheckCircle, Scale, Ruler, Eye, RefreshCw, Star, Info,
  CreditCard, TrendingUp, BarChart3, ShieldAlert, Zap, XCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AppState, Client, WorkoutPlan, NutritionPlan, Supplement, Message, CalendarSession, WorkoutExercise, ExerciseSet, Invoice } from '../types';
import SubscriptionManager from './SubscriptionManager';

interface TrainerDashboardProps {
  state: AppState;
  updateState: (newState: Partial<AppState>, description: string, user: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
}

export default function TrainerDashboard({ state, updateState, selectedClientId, setSelectedClientId }: TrainerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'entrenamientos' | 'nutricion' | 'progreso' | 'chat' | 'facturacion' | 'calendario' | 'admin'>('resumen');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientGoal, setNewClientGoal] = useState<'perder_grasa' | 'ganar_musculo' | 'rendimiento' | 'salud'>('ganar_musculo');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [alertValue, setAlertValue] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // Workout state editor
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('Nueva Rutina');
  const [editingWorkout, setEditingWorkout] = useState<boolean>(false);

  // Billing state
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('80');
  const [newInvoicePlan, setNewInvoicePlan] = useState<'suscripción_mensual' | 'bono_10_sesiones' | 'sesion_individual'>('suscripción_mensual');
  const [billingScope, setBillingScope] = useState<'selected' | 'all'>('all');
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [stripeSimulateSuccess, setStripeSimulateSuccess] = useState<string | null>(null);

  // Calendar booking
  const [newSessionTitle, setNewSessionTitle] = useState('Entrenamiento Dirigido');
  const [newSessionDate, setNewSessionDate] = useState('2026-07-08');
  const [newSessionTime, setNewSessionTime] = useState('18:00');

  // Get active client data
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];

  React.useEffect(() => {
    if (client) {
      setNotesValue(client.privateNotes);
    }
  }, [selectedClientId, client]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-2xl shadow-sm border border-neutral-100">
        <User className="w-12 h-12 mb-4 text-neutral-300" />
        <p className="font-medium text-neutral-600">No hay clientes registrados en el sistema</p>
        <button
          onClick={() => setShowAddClientModal(true)}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white font-medium text-sm rounded-lg hover:bg-emerald-600 transition"
        >
          Dar de Alta un Cliente
        </button>
      </div>
    );
  }

  // Handle client creations
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    const id = newClientName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
    const newClient: Client = {
      id,
      name: newClientName,
      email: newClientEmail,
      age: 30,
      gender: 'No especificado',
      weight: 70,
      height: 172,
      injuries: 'Ninguna declarada',
      experience: 'principiante',
      goal: newClientGoal,
      availability: '3 días/semana',
      material: 'Gimnasio comercial',
      sportHistory: 'Moderado',
      privateNotes: 'Escribe notas privadas de este cliente aquí...',
      alerts: ['Primer chequeo físico pendiente'],
      status: 'activo',
      createdAt: new Date().toISOString().split('T')[0]
    };

    updateState(
      { clients: [...state.clients, newClient] },
      `Se dio de alta al cliente ${newClientName}`,
      'Coach'
    );

    setSelectedClientId(id);
    setShowAddClientModal(false);
    setNewClientName('');
    setNewClientEmail('');
  };

  const handleToggleStatus = (clientId: string) => {
    const updated = state.clients.map(c => {
      if (c.id === clientId) {
        return { ...c, status: c.status === 'activo' ? 'inactivo' as const : 'activo' as const };
      }
      return c;
    });
    updateState({ clients: updated }, `Se cambió el estado del cliente ${client.name}`, 'Coach');
  };

  // Handle note saves
  const handleSaveNotes = () => {
    const updated = state.clients.map(c => {
      if (c.id === client.id) {
        return { ...c, privateNotes: notesValue };
      }
      return c;
    });
    updateState({ clients: updated }, `Actualizadas las notas privadas de ${client.name}`, 'Coach');
    setEditingNotes(false);
  };

  // Add alerts
  const handleAddAlert = () => {
    if (!alertValue.trim()) return;
    const updated = state.clients.map(c => {
      if (c.id === client.id) {
        return { ...c, alerts: [...c.alerts, alertValue.trim()] };
      }
      return c;
    });
    updateState({ clients: updated }, `Se añadió una alerta para ${client.name}`, 'Coach');
    setAlertValue('');
  };

  const handleRemoveAlert = (alertTxt: string) => {
    const updated = state.clients.map(c => {
      if (c.id === client.id) {
        return { ...c, alerts: c.alerts.filter(a => a !== alertTxt) };
      }
      return c;
    });
    updateState({ clients: updated }, `Se eliminó alerta de ${client.name}`, 'Coach');
  };

  // Workouts Management
  const handleCreateWorkout = () => {
    const newWorkout: WorkoutPlan = {
      id: `w_${Date.now()}`,
      clientId: client.id,
      name: newWorkoutName,
      date: new Date().toISOString().split('T')[0],
      exercises: [
        {
          id: `ex_${Date.now()}_1`,
          name: 'Prensa de Piernas',
          comment: 'Foco en la excéntrica lenta de 3 segundos',
          sets: [
            { id: `s_${Date.now()}_1`, reps: '10', rpe: '8', rest: '90s', tempo: '3010' },
            { id: `s_${Date.now()}_2`, reps: '10', rpe: '8', rest: '90s', tempo: '3010' }
          ]
        }
      ]
    };
    updateState({ workouts: [newWorkout, ...state.workouts] }, `Se creó la rutina "${newWorkoutName}" para ${client.name}`, 'Coach');
    setSelectedWorkout(newWorkout);
    setNewWorkoutName('Nueva Rutina');
  };

  const handleDuplicateWorkout = (workout: WorkoutPlan) => {
    const duplicated: WorkoutPlan = {
      ...workout,
      id: `w_dup_${Date.now()}`,
      name: `${workout.name} (Copia)`,
      date: new Date().toISOString().split('T')[0],
      isCompleted: false,
      exercises: workout.exercises.map(ex => ({
        ...ex,
        id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sets: ex.sets.map(s => ({
          ...s,
          id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          weightUsed: undefined,
          isCompleted: false
        }))
      }))
    };
    updateState({ workouts: [duplicated, ...state.workouts] }, `Se duplicó el entrenamiento para ${client.name}`, 'Coach');
  };

  const handleDeleteWorkout = (workoutId: string) => {
    const filtered = state.workouts.filter(w => w.id !== workoutId);
    updateState({ workouts: filtered }, `Se eliminó una rutina de ${client.name}`, 'Coach');
    if (selectedWorkout?.id === workoutId) setSelectedWorkout(null);
  };

  // AI Generation Tool (Gemini Integration)
  const handleAIGeneratePlan = async () => {
    setAiAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      });
      const data = await response.json();
      
      if (data.success) {
        // AI returns full workout and diet plan
        const { workout, nutrition, supplements } = data;

        // Save AI generated items into our state
        const updatedWorkouts = [workout, ...state.workouts];
        const updatedDiets = [nutrition, ...state.nutritionPlans.filter(n => n.clientId !== client.id)];
        const updatedSupplements = [
          ...supplements,
          ...state.supplements.filter(s => s.clientId !== client.id)
        ];

        updateState(
          { 
            workouts: updatedWorkouts, 
            nutritionPlans: updatedDiets, 
            supplements: updatedSupplements 
          }, 
          `Inteligencia Artificial generó plan completo de Rutina, Nutrición y Suplementación para ${client.name}`,
          'IA Entrenador de Élite'
        );

        setSelectedWorkout(workout);
        alert(`¡Optimización IA Completa! Se ha integrado una nueva rutina de entrenamiento ("${workout.name}"), un plan nutricional deportivo de ${nutrition.calories} kcal y su suplementación recomendada basados en su objetivo de ${client.goal.replace('_', ' ')}.`);
      } else {
        alert('Error al conectar con la Inteligencia Artificial.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor de optimización de planes.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Messaging / Chat sending & AI response approval
  const handleSendChat = () => {
    if (!chatMessage.trim()) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: 'coach',
      text: chatMessage,
      timestamp: new Date().toISOString()
    };

    const clientChats = state.chats[client.id] || [];
    const updatedChats = {
      ...state.chats,
      [client.id]: [...clientChats, newMsg]
    };

    updateState({ chats: updatedChats }, `Mensaje enviado a ${client.name}`, 'Coach');
    setChatMessage('');
  };

  const handleApproveAIMessage = (msgId: string) => {
    const clientChats = state.chats[client.id] || [];
    const updated = clientChats.map(m => {
      if (m.id === msgId) {
        return { ...m, reviewPending: false, approved: true };
      }
      return m;
    });

    updateState({
      chats: {
        ...state.chats,
        [client.id]: updated
      }
    }, 'Respuesta generada por la IA fue APROBADA por el entrenador', 'Coach');
  };

  const handleEditAIMessage = (msgId: string, newText: string) => {
    const clientChats = state.chats[client.id] || [];
    const updated = clientChats.map(m => {
      if (m.id === msgId) {
        return { ...m, text: newText, reviewPending: false, approved: true };
      }
      return m;
    });

    updateState({
      chats: {
        ...state.chats,
        [client.id]: updated
      }
    }, 'Respuesta generada por la IA fue MODIFICADA y APROBADA por el entrenador', 'Coach');
  };

  // Invoice logs
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newInvoiceAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      clientId: client.id,
      amount,
      status: 'pendiente',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      planType: newInvoicePlan
    };

    updateState({ invoices: [...state.invoices, newInvoice] }, `Factura de ${amount}€ emitida para ${client.name}`, 'Coach');
    setNewInvoiceAmount('80');
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: 'pagado' | 'pendiente' | 'cancelado') => {
    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status };
      }
      return inv;
    });

    const targetInvoice = state.invoices.find(i => i.id === invoiceId);
    const clientName = state.clients.find(c => c.id === targetInvoice?.clientId)?.name || 'Cliente';
    const description = status === 'cancelado' 
      ? `Reembolso / Cancelación de factura ${invoiceId} de ${targetInvoice?.amount}€ para ${clientName}`
      : `Estado de factura ${invoiceId} actualizado a ${status} para ${clientName}`;

    updateState({ invoices: updatedInvoices }, description, 'Coach');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const updatedInvoices = state.invoices.filter(inv => inv.id !== invoiceId);
    updateState({ invoices: updatedInvoices }, `Factura ${invoiceId} eliminada del sistema`, 'Coach');
  };

  const handleUpdateSubscription = (
    targetClientId: string, 
    tier: 'premium_80' | 'basic_45' | 'elite_150', 
    status: 'active' | 'trialing' | 'past_due' | 'canceled'
  ) => {
    const targetClient = state.clients.find(c => c.id === targetClientId);
    if (!targetClient) return;

    const updatedClients = state.clients.map(c => {
      if (c.id === targetClientId) {
        return {
          ...c,
          stripeSubscriptionTier: tier,
          stripeSubscriptionStatus: status,
          stripeCustomerId: c.stripeCustomerId || `cus_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          stripeSubscriptionId: c.stripeSubscriptionId || `sub_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          stripeCardBrand: c.stripeCardBrand || 'Visa',
          stripeCardLast4: c.stripeCardLast4 || '4242'
        };
      }
      return c;
    });

    updateState(
      { clients: updatedClients }, 
      `Suscripción de ${targetClient.name} actualizada a ${tier.replace('_', ' ')} (${status}) via Stripe`, 
      'Coach'
    );
  };

  const handleSimulateStripeChargeSuccess = (targetClientId: string) => {
    const targetClient = state.clients.find(c => c.id === targetClientId);
    if (!targetClient) return;

    const tier = targetClient.stripeSubscriptionTier || 'premium_80';
    const amount = tier === 'basic_45' ? 45 : tier === 'elite_150' ? 150 : 80;

    const newInvoice: Invoice = {
      id: `inv_stripe_${Date.now()}`,
      clientId: targetClientId,
      amount,
      status: 'pagado',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      planType: 'suscripción_mensual'
    };

    const updatedClients = state.clients.map(c => {
      if (c.id === targetClientId) {
        return {
          ...c,
          stripeSubscriptionStatus: 'active' as const,
          stripeCustomerId: c.stripeCustomerId || `cus_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          stripeSubscriptionId: c.stripeSubscriptionId || `sub_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          alerts: c.alerts.filter(a => !a.toLowerCase().includes('pago') && !a.toLowerCase().includes('mora'))
        };
      }
      return c;
    });

    updateState(
      { 
        invoices: [...state.invoices, newInvoice],
        clients: updatedClients
      }, 
      `Stripe Webhook [SUCCESS]: Cargo exitoso de ${amount}€ procesado para ${targetClient.name}. Suscripción reactivada.`, 
      'Stripe Webhook Gateway'
    );

    setStripeSimulateSuccess(`¡Webhook Recibido! Pago de ${amount}€ de ${targetClient.name} procesado correctamente por Stripe.`);
    setTimeout(() => setStripeSimulateSuccess(null), 5000);
  };

  const handleSimulateStripeChargeFailure = (targetClientId: string) => {
    const targetClient = state.clients.find(c => c.id === targetClientId);
    if (!targetClient) return;

    const tier = targetClient.stripeSubscriptionTier || 'premium_80';
    const amount = tier === 'basic_45' ? 45 : tier === 'elite_150' ? 150 : 80;

    const newInvoice: Invoice = {
      id: `inv_stripe_failed_${Date.now()}`,
      clientId: targetClientId,
      amount,
      status: 'pendiente',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      planType: 'suscripción_mensual'
    };

    const updatedClients = state.clients.map(c => {
      if (c.id === targetClientId) {
        const hasAlert = c.alerts.some(a => a.includes('mora') || a.includes('Stripe'));
        const newAlerts = hasAlert ? c.alerts : [...c.alerts, 'Fallo de cobro Stripe: Suscripción en mora (Past Due)'];
        return {
          ...c,
          stripeSubscriptionStatus: 'past_due' as const,
          stripeCustomerId: c.stripeCustomerId || `cus_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          stripeSubscriptionId: c.stripeSubscriptionId || `sub_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          alerts: newAlerts
        };
      }
      return c;
    });

    updateState(
      { 
        invoices: [...state.invoices, newInvoice],
        clients: updatedClients
      }, 
      `Stripe Webhook [FAILED]: Intento de cobro fallido para ${targetClient.name}. Suscripción marcada en mora (past_due).`, 
      'Stripe Webhook Gateway'
    );

    setStripeSimulateSuccess(`Stripe Webhook: Intento de cobro de ${amount}€ falló para ${targetClient.name}. La suscripción cambió a MOROSA (past_due).`);
    setTimeout(() => setStripeSimulateSuccess(null), 5000);
  };

  // Calendar Sessions
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const startISO = `${newSessionDate}T${newSessionTime}`;
    const endISO = `${newSessionDate}T${newSessionTime.split(':')[0]}:${newSessionTime.split(':')[1]}`; // simple mock

    const newSession: CalendarSession = {
      id: `s_${Date.now()}`,
      clientId: client.id,
      title: newSessionTitle,
      start: startISO,
      end: endISO,
      status: 'confirmada'
    };

    updateState({ sessions: [...state.sessions, newSession] }, `Sesión agendada para ${client.name}`, 'Coach');
    setNewSessionTitle('Entrenamiento Dirigido');
  };

  // Filtered Client specific data
  const clientWorkouts = state.workouts.filter(w => w.clientId === client.id);
  const clientDiet = state.nutritionPlans.find(n => n.clientId === client.id);
  const clientSupplements = state.supplements.filter(s => s.clientId === client.id);
  const clientHabits = state.habitLogs[client.id] || [];
  const clientPhotos = state.photoLogs[client.id] || [];
  const clientMeasures = state.measureLogs[client.id] || [];
  const clientInvoices = state.invoices.filter(i => i.clientId === client.id);
  const clientChat = state.chats[client.id] || [];
  const clientSessions = state.sessions.filter(s => s.clientId === client.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* SIDEBAR: Client Management List */}
      <div className="lg:col-span-1 bg-white rounded-2xl p-4 shadow-xs border border-neutral-100 flex flex-col h-full min-h-[500px]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-neutral-600" />
            <h3 className="font-display font-medium text-neutral-800">Mis Clientes</h3>
          </div>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition"
            title="Alta de Cliente"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Client scrollable area */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] lg:max-h-[500px]">
          {state.clients.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
                c.id === client.id 
                  ? 'bg-neutral-950 text-white shadow-sm' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-sm truncate">{c.name}</p>
                <p className={`text-[10px] ${c.id === client.id ? 'text-neutral-400' : 'text-neutral-500'} capitalize truncate`}>
                  {c.goal.replace('_', ' ')} • {c.experience}
                </p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'activo' ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
            </button>
          ))}
        </div>

        {/* Active Client Quick Info Card */}
        <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
          <p className="text-neutral-500 font-medium mb-1">Estatus del Cliente Seleccionado</p>
          <div className="flex items-center justify-between">
            <span className="capitalize text-neutral-800 font-medium">{client.status}</span>
            <button
              onClick={() => handleToggleStatus(client.id)}
              className="text-neutral-600 font-semibold hover:underline"
            >
              Cambiar Estatus
            </button>
          </div>
          <div className="mt-2 text-neutral-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Creado: {client.createdAt}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPACE */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-xs border border-neutral-100 flex flex-col overflow-hidden">
        
        {/* UPPER BANNER: Client Header */}
        <div className="p-6 bg-neutral-950 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-neutral-950 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                {client.experience}
              </span>
              <span className="bg-neutral-800 text-neutral-300 text-[10px] px-2 py-0.5 rounded-full capitalize">
                {client.goal.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-display font-semibold mt-1">{client.name}</h1>
            <p className="text-xs text-neutral-400 mt-1">
              {client.email} • {client.age} años • {client.weight}kg • {client.height}cm • {client.availability}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* AI Optimization Fast Trigger Button */}
            <button
              onClick={handleAIGeneratePlan}
              disabled={aiAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-400 text-neutral-950 font-medium text-sm rounded-xl hover:bg-emerald-300 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Sparkles className={`w-4 h-4 ${aiAnalyzing ? 'animate-spin' : ''}`} />
              <span>{aiAnalyzing ? 'Optimizando por IA...' : 'Optimización Completa IA'}</span>
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex overflow-x-auto border-b border-neutral-100 bg-neutral-50 px-4">
          {[
            { id: 'resumen', label: 'Resumen', icon: User },
            { id: 'entrenamientos', label: 'Entrenamientos', icon: Dumbbell },
            { id: 'nutricion', label: 'Nutrición / Suple', icon: Utensils },
            { id: 'progreso', label: 'Seguimiento', icon: Activity },
            { id: 'chat', label: 'Mensajería', icon: MessageSquare, badge: clientChat.filter(m => m.reviewPending).length },
            { id: 'facturacion', label: 'Facturación', icon: DollarSign },
            { id: 'calendario', label: 'Calendario', icon: CalendarIcon },
            { id: 'admin', label: 'Logs', icon: Sliders }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-neutral-950 text-neutral-950 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="bg-amber-500 text-neutral-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 flex-1 min-h-[400px]">

          {/* TAB 1: RESUMEN */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <p className="text-neutral-400 text-xs font-medium">Lesiones y Molestias</p>
                  <p className="font-semibold text-neutral-800 text-sm mt-1">{client.injuries}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <p className="text-neutral-400 text-xs font-medium">Material de Entrenamiento</p>
                  <p className="font-semibold text-neutral-800 text-sm mt-1">{client.material}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <p className="text-neutral-400 text-xs font-medium">Historial Deportivo</p>
                  <p className="font-semibold text-neutral-800 text-sm mt-1">{client.sportHistory}</p>
                </div>
              </div>

              {/* Private Notes Section (Editable) */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-neutral-800 text-sm flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-neutral-400" />
                    <span>Notas Privadas (Solo visibles para el entrenador)</span>
                  </h3>
                  {editingNotes ? (
                    <div className="flex gap-2">
                      <button onClick={handleSaveNotes} className="text-xs text-emerald-600 font-bold hover:underline">Guardar</button>
                      <button onClick={() => { setEditingNotes(false); setNotesValue(client.privateNotes); }} className="text-xs text-neutral-400 hover:underline">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingNotes(true)} className="text-xs text-neutral-500 hover:underline">Editar Notas</button>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    className="w-full text-sm p-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100 whitespace-pre-wrap">
                    {client.privateNotes || 'No hay notas registradas.'}
                  </p>
                )}
              </div>

              {/* Alerts & Reminders */}
              <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                <h3 className="font-display font-semibold text-amber-800 text-sm mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
                  <span>Alertas y Recordatorios del Cliente</span>
                </h3>
                <div className="space-y-2 mb-3">
                  {client.alerts.length === 0 ? (
                    <p className="text-xs text-amber-700 italic">No hay alertas activas.</p>
                  ) : (
                    client.alerts.map((alert, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-amber-100 text-xs">
                        <span className="text-amber-900 font-medium">{alert}</span>
                        <button onClick={() => handleRemoveAlert(alert)} className="text-amber-500 hover:text-amber-800 transition">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={alertValue}
                    onChange={(e) => setAlertValue(e.target.value)}
                    placeholder="Escribir nuevo recordatorio..."
                    className="flex-1 text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                  />
                  <button onClick={handleAddAlert} className="px-3 py-2 bg-neutral-950 text-white font-medium text-xs rounded-lg hover:bg-neutral-850 transition">
                    Añadir Alerta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENTRENAMIENTOS */}
          {activeTab === 'entrenamientos' && (
            <div className="space-y-6">
              
              {/* Creator Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <input
                  type="text"
                  value={newWorkoutName}
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  placeholder="Nombre de la nueva rutina..."
                  className="flex-1 text-sm bg-white border border-neutral-200 px-3 py-2 rounded-lg focus:outline-none"
                />
                <button
                  onClick={handleCreateWorkout}
                  className="px-4 py-2 bg-neutral-950 text-white font-semibold text-xs rounded-lg hover:bg-neutral-850 transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Rutina</span>
                </button>
              </div>

              {/* Routine list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientWorkouts.map(workout => (
                  <div key={workout.id} className="bg-white p-5 rounded-xl border border-neutral-200 hover:shadow-xs transition relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display font-semibold text-neutral-900 text-base">{workout.name}</h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Asignado el {workout.date}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDuplicateWorkout(workout)}
                          className="p-1 hover:bg-neutral-100 text-neutral-500 rounded"
                          title="Duplicar Rutina"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="p-1 hover:bg-neutral-100 text-red-500 rounded"
                          title="Eliminar"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Exercises brief list */}
                    <div className="mt-3 space-y-2">
                      {workout.exercises.map((ex, idx) => (
                        <div key={ex.id} className="text-xs border-l-2 border-neutral-200 pl-2 py-0.5">
                          <p className="font-semibold text-neutral-800">{ex.name}</p>
                          <p className="text-neutral-500">{ex.sets.length} series x {ex.sets[0]?.reps || '10'} reps (Tempo: {ex.sets[0]?.tempo || 'N/A'})</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${workout.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                        {workout.isCompleted ? 'Completado por cliente' : 'Pendiente'}
                      </span>
                      <button
                        onClick={() => setSelectedWorkout(workout)}
                        className="text-neutral-800 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Gestionar Series</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {clientWorkouts.length === 0 && (
                  <p className="text-sm text-neutral-400 italic">No hay rutinas asignadas. Haz clic en "Optimización Completa IA" arriba para sugerir planes.</p>
                )}
              </div>

              {/* Workout Editor Modal / Section */}
              {selectedWorkout && (
                <div className="mt-6 bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200">
                    <h3 className="font-display font-semibold text-neutral-800 text-sm">
                      Detalle de Rutina: <span className="text-neutral-950 underline">{selectedWorkout.name}</span>
                    </h3>
                    <button onClick={() => setSelectedWorkout(null)} className="text-xs text-neutral-500 hover:underline">Ocultar Editor</button>
                  </div>
                  <div className="space-y-4">
                    {selectedWorkout.exercises.map(exercise => (
                      <div key={exercise.id} className="bg-white p-4 rounded-lg border border-neutral-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-neutral-900 text-sm">{exercise.name}</span>
                            {exercise.comment && <p className="text-xs text-neutral-500 italic mt-0.5">Nota: {exercise.comment}</p>}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left text-neutral-500">
                            <thead className="bg-neutral-50 text-neutral-700 text-[10px] uppercase font-bold">
                              <tr>
                                <th className="p-2">Serie</th>
                                <th className="p-2">Repeticiones</th>
                                <th className="p-2">RPE</th>
                                <th className="p-2">Descanso</th>
                                <th className="p-2">Tempo</th>
                                <th className="p-2">Carga Registrada (Cliente)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercise.sets.map((set, idx) => (
                                <tr key={set.id} className="border-b border-neutral-100">
                                  <td className="p-2 font-semibold">#{idx + 1}</td>
                                  <td className="p-2">{set.reps}</td>
                                  <td className="p-2">RPE {set.rpe}</td>
                                  <td className="p-2">{set.rest}</td>
                                  <td className="p-2">{set.tempo}</td>
                                  <td className="p-2 font-bold text-neutral-800">{set.weightUsed ? `${set.weightUsed} kg` : 'N/L'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NUTRICIÓN */}
          {activeTab === 'nutricion' && (
            <div className="space-y-6">
              
              {/* Macro Nutrients Target Table */}
              {clientDiet ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center">
                      <p className="text-neutral-400 text-xs font-semibold">Calorías Diarias</p>
                      <p className="text-2xl font-display font-semibold mt-1 text-neutral-950">{clientDiet.calories} kcal</p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                      <p className="text-emerald-700 text-xs font-semibold">Proteínas</p>
                      <p className="text-2xl font-display font-semibold mt-1 text-emerald-950">{clientDiet.protein} g</p>
                    </div>
                    <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 text-center">
                      <p className="text-sky-700 text-xs font-semibold">Carbohidratos</p>
                      <p className="text-2xl font-display font-semibold mt-1 text-sky-950">{clientDiet.carbs} g</p>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
                      <p className="text-amber-700 text-xs font-semibold">Grasas</p>
                      <p className="text-2xl font-display font-semibold mt-1 text-amber-950">{clientDiet.fats} g</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Meals list */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200">
                      <h4 className="font-display font-semibold text-neutral-900 text-sm mb-3">Distribución de Comidas</h4>
                      <div className="space-y-4">
                        {clientDiet.meals.map((meal, idx) => (
                          <div key={idx} className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs">
                            <div className="flex justify-between font-bold text-neutral-800 mb-1">
                              <span>{meal.name}</span>
                              <span className="text-neutral-400">{meal.time}</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-neutral-600 mt-1">
                              {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Supplement Tracker */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col h-full">
                      <h4 className="font-display font-semibold text-neutral-900 text-sm mb-3">Recomendación de Suplementación</h4>
                      <div className="space-y-4 flex-1">
                        {clientSupplements.map(sup => (
                          <div key={sup.id} className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs">
                            <p className="font-bold text-neutral-800 flex items-center justify-between">
                              <span>{sup.name} ({sup.dosage})</span>
                              <span className="text-neutral-400 font-normal">Toma: {sup.timing}</span>
                            </p>
                            <p className="text-neutral-600 mt-1"><span className="font-semibold text-neutral-800">Beneficio:</span> {sup.benefits}</p>
                            <p className="text-neutral-500 italic mt-0.5"><span className="font-semibold text-neutral-700 text-[10px]">Advertencia:</span> {sup.warnings}</p>
                          </div>
                        ))}
                        {clientSupplements.length === 0 && (
                          <p className="text-xs text-neutral-400 italic">No hay suplementos sugeridos.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-neutral-50 rounded-xl border border-neutral-100">
                  <Utensils className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Este cliente no cuenta con plan nutricional asignado.</p>
                  <p className="text-xs text-neutral-400 mt-1">Usa la optimización completa de IA arriba para estructurar su pauta alimentaria.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SEGUIMIENTO / PROGRESO */}
          {activeTab === 'progreso' && (
            <div className="space-y-6">
              
              {/* Habits tracker overview */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3 flex items-center gap-1.5">
                  <Scale className="w-4.5 h-4.5 text-neutral-500" />
                  <span>Métricas Físicas y de Hábitos</span>
                </h3>

                {clientHabits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-neutral-500">
                      <thead className="bg-neutral-50 text-neutral-700 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Peso Logueado</th>
                          <th className="p-2">Energía</th>
                          <th className="p-2">Horas Sueño</th>
                          <th className="p-2">Dolor Muscular</th>
                          <th className="p-2">Pasos</th>
                          <th className="p-2">Agua (L)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientHabits.map((log, idx) => (
                          <tr key={idx} className="border-b border-neutral-100">
                            <td className="p-2 font-semibold text-neutral-800">{log.date}</td>
                            <td className="p-2 font-bold text-neutral-900">{log.weightLogged ? `${log.weightLogged} kg` : 'N/L'}</td>
                            <td className="p-2">{log.energy}/5</td>
                            <td className="p-2">{log.sleep}h</td>
                            <td className="p-2">{log.soreness}/5</td>
                            <td className="p-2">{log.stepsCount.toLocaleString()}</td>
                            <td className="p-2">{log.waterConsumed}L</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No hay registros cargados por el cliente todavía.</p>
                )}
              </div>

              {/* Progress photos */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3 flex items-center gap-1.5">
                  <Eye className="w-4.5 h-4.5 text-neutral-500" />
                  <span>Fotos de Evolución del Cliente</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {clientPhotos.map(photo => (
                    <div key={photo.id} className="relative rounded-lg overflow-hidden border border-neutral-200">
                      <img referrerPolicy="no-referrer" src={photo.url} alt="Evolución" className="w-full h-40 object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-[10px] text-white flex justify-between">
                        <span>{photo.date}</span>
                        <span className="capitalize">{photo.pose}</span>
                      </div>
                    </div>
                  ))}
                  {clientPhotos.length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No hay fotos de evolución registradas.</p>
                  )}
                </div>
              </div>

              {/* Measurements tracker */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800 text-sm mb-3 flex items-center gap-1.5">
                  <Ruler className="w-4.5 h-4.5 text-neutral-500" />
                  <span>Medidas Corporales (cm)</span>
                </h3>
                {clientMeasures.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-neutral-500">
                      <thead className="bg-neutral-50 text-neutral-700 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Pecho</th>
                          <th className="p-2">Cintura</th>
                          <th className="p-2">Cadera</th>
                          <th className="p-2">Bíceps</th>
                          <th className="p-2">Muslo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientMeasures.map((m, idx) => (
                          <tr key={idx} className="border-b border-neutral-100">
                            <td className="p-2 font-semibold text-neutral-800">{m.date}</td>
                            <td className="p-2">{m.chest || '-'} cm</td>
                            <td className="p-2">{m.waist || '-'} cm</td>
                            <td className="p-2">{m.hips || '-'} cm</td>
                            <td className="p-2">{m.biceps || '-'} cm</td>
                            <td className="p-2">{m.thighs || '-'} cm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No hay registro de medidas.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: CHAT & MODERACIÓN IA */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              
              {/* IA Moderation Queue Box */}
              {clientChat.some(m => m.reviewPending) && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                  <h4 className="font-display font-semibold text-amber-900 text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Cola de Moderación: Sugerencias de la IA para {client.name}</span>
                  </h4>
                  <p className="text-xs text-amber-700 mb-3">
                    La Inteligencia Artificial formuló respuestas a las consultas del cliente. Revisa, edita si es necesario y aprueba para enviarlas formalmente.
                  </p>
                  
                  <div className="space-y-4">
                    {clientChat.filter(m => m.reviewPending).map(msg => (
                      <div key={msg.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-xs">
                        <p className="text-xs font-semibold text-neutral-400">Mensaje sugerido por la IA:</p>
                        <textarea
                          defaultValue={msg.text}
                          id={`textarea-ai-${msg.id}`}
                          className="w-full text-xs p-2.5 bg-amber-50/20 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 mt-2"
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            onClick={() => {
                              const textarea = document.getElementById(`textarea-ai-${msg.id}`) as HTMLTextAreaElement;
                              handleEditAIMessage(msg.id, textarea.value);
                            }}
                            className="px-3 py-1 bg-amber-600 text-white font-medium text-[10px] rounded hover:bg-amber-700 transition"
                          >
                            Editar y Enviar
                          </button>
                          <button
                            onClick={() => handleApproveAIMessage(msg.id)}
                            className="px-3 py-1 bg-neutral-900 text-white font-medium text-[10px] rounded hover:bg-black transition flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Aprobar directo</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Chat History Panel */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden flex flex-col h-[350px]">
                <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 text-xs font-semibold text-neutral-700">
                  Chat con {client.name}
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/30">
                  {clientChat.filter(m => !m.reviewPending || m.approved).map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        msg.senderId === 'coach' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <span className="text-[9px] text-neutral-400 px-1 mb-0.5">
                        {msg.senderId === 'coach' ? 'Tú (Coach)' : msg.senderId === 'ai' ? 'IA (Aprobado)' : client.name}
                      </span>
                      <div
                        className={`p-3 rounded-2xl text-xs whitespace-pre-line ${
                          msg.senderId === 'coach'
                            ? 'bg-neutral-950 text-white rounded-tr-none'
                            : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {clientChat.length === 0 && (
                    <p className="text-xs text-neutral-400 italic text-center py-10">No hay mensajes anteriores.</p>
                  )}
                </div>
                <div className="p-3 border-t border-neutral-200 flex gap-2 bg-white">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Escribir mensaje de entrenador..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                  />
                  <button onClick={handleSendChat} className="px-4 py-2 bg-neutral-950 text-white font-semibold text-xs rounded-lg hover:bg-neutral-850 transition">
                    Enviar
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: FACTURACIÓN Y PAGOS (STRIPE ADMIN CENTER) */}
          {activeTab === 'facturacion' && (
            <SubscriptionManager 
              state={state} 
              updateState={updateState} 
              onSelectClient={(clientId) => {
                setSelectedClientId(clientId);
                setActiveTab('resumen');
              }} 
            />
          )}

          {/* TAB 7: CALENDARIO */}
          {activeTab === 'calendario' && (
            <div className="space-y-6">
              
              {/* Schedule meeting Form */}
              <form onSubmit={handleCreateSession} className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                <h4 className="font-display font-semibold text-neutral-900 text-sm mb-3">Reservar Nueva Cita / Sesión</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Título de la Sesión</label>
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Fecha</label>
                    <input
                      type="date"
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Hora</label>
                    <input
                      type="time"
                      value={newSessionTime}
                      onChange={(e) => setNewSessionTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full px-4 py-2 bg-neutral-950 text-white font-semibold text-xs rounded-lg hover:bg-neutral-850 transition">
                      Agendar Cita
                    </button>
                  </div>
                </div>
              </form>

              {/* Booked sessions list */}
              <div className="bg-white p-5 rounded-xl border border-neutral-200">
                <h4 className="font-display font-semibold text-neutral-900 text-sm mb-3">Próximas Sesiones Agendadas</h4>
                <div className="space-y-3">
                  {clientSessions.map(sess => (
                    <div key={sess.id} className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-150 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-neutral-800">{sess.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(sess.start).toLocaleDateString()} a las {sess.start.split('T')[1]}h
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
                    <p className="text-xs text-neutral-400 italic">No hay sesiones registradas.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: SYSTEM LOGS */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                <h4 className="font-display font-semibold text-neutral-900 text-sm mb-2">Historial de Operaciones en Tiempo Real (Logs)</h4>
                <p className="text-xs text-neutral-500 mb-4">
                  Visualiza el flujo de sincronización mutua en el ecosistema Coach-Client.
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {state.logs.map(log => (
                    <div key={log.id} className="flex justify-between items-start text-xs p-2.5 bg-white border border-neutral-100 rounded-lg">
                      <div>
                        <span className="font-semibold text-neutral-700 font-mono">[{log.user}]</span>{' '}
                        <span className="text-neutral-600">{log.message}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: Dar de alta cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-100">
            <h3 className="text-lg font-display font-semibold text-neutral-800 mb-4">Dar de Alta Nuevo Cliente</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Alejandro Gómez"
                  className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Objetivo Primario</label>
                <select
                  value={newClientGoal}
                  onChange={(e) => setNewClientGoal(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none"
                >
                  <option value="ganar_musculo">Ganar Masa Muscular (Hipertrofia)</option>
                  <option value="perder_grasa">Pérdida de Grasa (Definición)</option>
                  <option value="rendimiento">Rendimiento Deportivo / Fuerza</option>
                  <option value="salud">Acondicionamiento Físico General / Salud</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-500 font-semibold text-xs rounded-lg hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-950 text-white font-semibold text-xs rounded-lg hover:bg-neutral-850"
                >
                  Alta Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
