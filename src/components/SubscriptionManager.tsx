import React, { useState } from 'react';
import { 
  CreditCard, TrendingUp, Users, AlertTriangle, CheckCircle, 
  Settings, Zap, RefreshCw, Sparkles, Calendar, DollarSign,
  ShieldAlert, Layers, Search, Eye, Filter, ArrowRightLeft, Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AppState, Client, Invoice } from '../types';

interface SubscriptionManagerProps {
  state: AppState;
  updateState: (newState: Partial<AppState>, description: string, user: string) => void;
  onSelectClient?: (clientId: string) => void;
}

export default function SubscriptionManager({ state, updateState, onSelectClient }: SubscriptionManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'canceled'>('all');
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [stripeLogs, setStripeLogs] = useState<Array<{ id: string; time: string; event: string; type: 'success' | 'warning' | 'info' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), event: 'Stripe API initialized in Test Mode', type: 'info' }
  ]);
  const [simulationAlert, setSimulationAlert] = useState<string | null>(null);

  // Helper to add mock Stripe webhook logs
  const logStripeEvent = (event: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      event,
      type
    };
    setStripeLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  // Calculate dynamic next billing date
  const getNextBillingDate = (createdAt: string) => {
    try {
      const createdDate = new Date(createdAt);
      if (isNaN(createdDate.getTime())) {
        return '2026-08-01';
      }
      const today = new Date();
      let nextDate = new Date(today.getFullYear(), today.getMonth(), createdDate.getDate());
      if (nextDate < today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate.toISOString().split('T')[0];
    } catch (e) {
      return '2026-08-01';
    }
  };

  // Pricing helper
  const getTierPrice = (tier?: 'premium_80' | 'basic_45' | 'elite_150') => {
    switch (tier) {
      case 'basic_45': return 45;
      case 'elite_150': return 150;
      case 'premium_80':
      default: return 80;
    }
  };

  const getTierName = (tier?: 'premium_80' | 'basic_45' | 'elite_150') => {
    switch (tier) {
      case 'basic_45': return 'Plan Básico (45€)';
      case 'elite_150': return 'Plan Elite (150€)';
      case 'premium_80':
      default: return 'Plan Premium (80€)';
    }
  };

  // Stripe Mock Actions
  const handleUpdatePlan = (clientId: string, newTier: 'premium_80' | 'basic_45' | 'elite_150') => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    const oldTier = client.stripeSubscriptionTier || 'premium_80';
    
    const updatedClients = state.clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          stripeSubscriptionTier: newTier,
          // If subscription was cancelled, update tier but keep status or reactivate depending on logic
          stripeSubscriptionStatus: c.stripeSubscriptionStatus || 'active'
        };
      }
      return c;
    });

    logStripeEvent(
      `customer.subscription.updated: Client ${client.name} tier changed from ${getTierName(oldTier)} to ${getTierName(newTier)}`, 
      'info'
    );

    updateState(
      { clients: updatedClients },
      `Actualización de Plan Stripe: ${client.name} migrado de ${oldTier.toUpperCase()} a ${newTier.toUpperCase()}`,
      'Stripe Billing Gateway'
    );

    setSimulationAlert(`Stripe API: Plan de ${client.name} actualizado con éxito a ${getTierName(newTier)}.`);
    setTimeout(() => setSimulationAlert(null), 4000);
  };

  const handleUpdateStatus = (clientId: string, newStatus: 'active' | 'past_due' | 'canceled') => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    const updatedClients = state.clients.map(c => {
      if (c.id === clientId) {
        const updatedAlerts = [...c.alerts];
        if (newStatus === 'past_due' && !updatedAlerts.some(a => a.includes('Mora'))) {
          updatedAlerts.push('Alerta de pago Stripe: Suscripción en Mora (Past Due)');
        } else if (newStatus === 'active') {
          // Clear payment alerts
          const filtered = updatedAlerts.filter(a => !a.toLowerCase().includes('pago') && !a.toLowerCase().includes('mora'));
          return { ...c, stripeSubscriptionStatus: newStatus, alerts: filtered };
        }
        return {
          ...c,
          stripeSubscriptionStatus: newStatus,
          alerts: updatedAlerts
        };
      }
      return c;
    });

    let eventName = '';
    let eventType: 'success' | 'warning' | 'info' = 'info';
    if (newStatus === 'active') {
      eventName = `customer.subscription.updated [ACTIVE]: Suscripción reactivada para ${client.name}`;
      eventType = 'success';
    } else if (newStatus === 'past_due') {
      eventName = `invoice.payment_failed [PAST_DUE]: Intento de cobro fallido para ${client.name}. Suscripción en mora`;
      eventType = 'warning';
    } else {
      eventName = `customer.subscription.deleted [CANCELED]: Suscripción cancelada para ${client.name}`;
      eventType = 'warning';
    }

    logStripeEvent(eventName, eventType);

    updateState(
      { clients: updatedClients },
      `Estado Stripe de ${client.name} actualizado a ${newStatus.toUpperCase()}`,
      'Stripe Webhook Listener'
    );

    setSimulationAlert(`Stripe Webhook: Suscripción de ${client.name} marcada como ${newStatus.toUpperCase()}.`);
    setTimeout(() => setSimulationAlert(null), 4000);
  };

  const handleSimulatePaymentSuccess = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    const tier = client.stripeSubscriptionTier || 'premium_80';
    const amount = getTierPrice(tier);

    // Create a paid invoice
    const newInvoice: Invoice = {
      id: `inv_stripe_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      clientId: clientId,
      amount,
      status: 'pagado',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      planType: 'suscripción_mensual'
    };

    const updatedClients = state.clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          stripeSubscriptionStatus: 'active' as const,
          alerts: c.alerts.filter(a => !a.toLowerCase().includes('pago') && !a.toLowerCase().includes('mora'))
        };
      }
      return c;
    });

    logStripeEvent(`invoice.payment_succeeded: Cobro mensual de ${amount}€ procesado con éxito para ${client.name}`, 'success');

    updateState(
      {
        invoices: [...state.invoices, newInvoice],
        clients: updatedClients
      },
      `Stripe Webhook: Cargo exitoso de ${amount}€ para ${client.name}. Recibo de pago generado.`,
      'Stripe Autopay'
    );

    setSimulationAlert(`¡Pago Procesado! ${client.name} ha abonado ${amount}€ mediante Stripe.`);
    setTimeout(() => setSimulationAlert(null), 4500);
  };

  const handleSimulatePaymentFailure = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    const tier = client.stripeSubscriptionTier || 'premium_80';
    const amount = getTierPrice(tier);

    const newInvoice: Invoice = {
      id: `inv_failed_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      clientId: clientId,
      amount,
      status: 'pendiente',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      planType: 'suscripción_mensual'
    };

    const updatedClients = state.clients.map(c => {
      if (c.id === clientId) {
        const hasAlert = c.alerts.some(a => a.toLowerCase().includes('mora') || a.toLowerCase().includes('stripe'));
        const newAlerts = hasAlert ? c.alerts : [...c.alerts, 'Fallo de cobro recurrente Stripe: Tarjeta rechazada (Past Due)'];
        return {
          ...c,
          stripeSubscriptionStatus: 'past_due' as const,
          alerts: newAlerts
        };
      }
      return c;
    });

    logStripeEvent(`invoice.payment_failed: Intento de cobro de ${amount}€ rechazado (fondos insuficientes/tarjeta expirada) para ${client.name}`, 'warning');

    updateState(
      {
        invoices: [...state.invoices, newInvoice],
        clients: updatedClients
      },
      `Stripe Webhook: Cobro fallido de ${amount}€ para ${client.name}. Estado marcado en mora.`,
      'Stripe Billing Retry Engine'
    );

    setSimulationAlert(`Fallo de Pago: Tarjeta rechazada para ${client.name} por ${amount}€.`);
    setTimeout(() => setSimulationAlert(null), 4500);
  };

  // CALCULATIONS FOR RESUME CARDS
  const activeClients = state.clients.filter(c => c.status === 'activo');
  
  // MRR estimation based on active subscription tiers
  const estimatedMRR = state.clients.reduce((sum, c) => {
    if (c.status === 'activo' && (c.stripeSubscriptionStatus === 'active' || c.stripeSubscriptionStatus === 'trialing' || !c.stripeSubscriptionStatus)) {
      return sum + getTierPrice(c.stripeSubscriptionTier);
    }
    return sum;
  }, 0);

  const activeSubscriptions = state.clients.filter(
    c => c.stripeSubscriptionStatus === 'active' || c.stripeSubscriptionStatus === 'trialing' || !c.stripeSubscriptionStatus
  ).length;

  const pendingSubscriptions = state.clients.filter(c => c.stripeSubscriptionStatus === 'past_due').length;
  const canceledSubscriptions = state.clients.filter(c => c.stripeSubscriptionStatus === 'canceled').length;

  // Revenue estimation details per plan tier
  const tierDistribution = state.clients.reduce(
    (acc, c) => {
      if (c.status === 'activo' && c.stripeSubscriptionStatus !== 'canceled') {
        const tier = c.stripeSubscriptionTier || 'premium_80';
        acc[tier] = (acc[tier] || 0) + 1;
      }
      return acc;
    },
    { basic_45: 0, premium_80: 0, elite_150: 0 } as Record<string, number>
  );

  const chartData = [
    {
      name: 'Plan Básico',
      Clientes: tierDistribution.basic_45,
      MRR: tierDistribution.basic_45 * 45,
      Tarifa: '45€'
    },
    {
      name: 'Plan Premium',
      Clientes: tierDistribution.premium_80,
      MRR: tierDistribution.premium_80 * 80,
      Tarifa: '80€'
    },
    {
      name: 'Plan Elite',
      Clientes: tierDistribution.elite_150,
      MRR: tierDistribution.elite_150 * 150,
      Tarifa: '150€'
    }
  ];

  // Filtered clients list
  const filteredClients = state.clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const mappedStatus = c.stripeSubscriptionStatus || 'active'; // Default active if undefined
    const matchesStatus = statusFilter === 'all' || mappedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Simulation Notification */}
      {simulationAlert && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3.5 rounded-xl shadow-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{simulationAlert}</span>
          </div>
          <button onClick={() => setSimulationAlert(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2">
            Entendido
          </button>
        </div>
      )}

      {/* STRIPE HEADER & SANDBOX SELECTOR */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neutral-950 text-white rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-neutral-900 text-base">Módulo Administrador de Suscripciones</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stripeMode === 'test' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Stripe {stripeMode === 'test' ? 'Sandbox' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Control completo de facturas, pasarelas de pago, cambios de tarifas y simulación de webhooks Stripe en tiempo real.
            </p>
          </div>
        </div>

        {/* Operating mode selector */}
        <div className="flex items-center gap-2 bg-neutral-50 p-1.5 rounded-xl border border-neutral-150 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setStripeMode('test');
              logStripeEvent('Switched Stripe SDK context to Sandbox (Test)', 'info');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              stripeMode === 'test' 
                ? 'bg-neutral-950 text-white shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Modo de Prueba
          </button>
          <button
            type="button"
            onClick={() => {
              setStripeMode('live');
              logStripeEvent('Switched Stripe SDK context to Production (LIVE)', 'warning');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              stripeMode === 'live' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Modo Real (Live)
          </button>
        </div>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ESTIMATED MRR CARD */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Ingreso Mensual Estimado (MRR)</span>
              <h4 className="text-2xl font-display font-semibold text-neutral-900 mt-1.5">{estimatedMRR} €</h4>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Proyección recurrente</span>
            <span className="text-emerald-600 font-bold">100% Autocálculo</span>
          </div>
        </div>

        {/* ACTIVE SUBSCRIPTIONS */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Suscripciones Activas</span>
              <h4 className="text-2xl font-display font-semibold text-neutral-900 mt-1.5">{activeSubscriptions}</h4>
            </div>
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Clientes recurrentes</span>
            <span className="text-neutral-800 font-bold">{Math.round((activeSubscriptions / (activeClients.length || 1)) * 100)}% tasa activa</span>
          </div>
        </div>

        {/* PENDING / LATE SUBSCRIPTIONS */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Suscripciones en Mora</span>
              <h4 className="text-2xl font-display font-semibold text-amber-900 mt-1.5">{pendingSubscriptions}</h4>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Cobros fallidos / pendientes</span>
            <span className={`font-bold ${pendingSubscriptions > 0 ? 'text-amber-600' : 'text-neutral-500'}`}>
              {pendingSubscriptions} por reintentar
            </span>
          </div>
        </div>

        {/* CANCELED SUBSCRIPTIONS */}
        <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Suscripciones Canceladas</span>
              <h4 className="text-2xl font-display font-semibold text-neutral-500 mt-1.5">{canceledSubscriptions}</h4>
            </div>
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Tasa de cancelación (Churn)</span>
            <span className="text-red-500 font-bold">
              {Math.round((canceledSubscriptions / (state.clients.length || 1)) * 100)}% total
            </span>
          </div>
        </div>
      </div>

      {/* STRIPE ANALYTICS CHARTS & SIMULATOR LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DISTRIBUTION BAR CHART */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-display font-semibold text-neutral-800 text-sm">Distribución de Ingresos y Clientes</h4>
              <p className="text-[10px] text-neutral-400">Análisis comparativo de volumen de clientes y aporte al MRR por plan.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Layers className="w-4 h-4 text-neutral-400" />
              <span>Planes Stripe</span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1c23', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#ffffff', 
                    fontSize: '11px', 
                    padding: '8px' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Clientes" name="Número de Clientes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MRR" name="MRR Total (€)" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STRIPE REAL-TIME SIMULATOR LOGS */}
        <div className="bg-neutral-950 text-neutral-100 p-5 rounded-2xl border border-neutral-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Stripe Webhook Logs</span>
              </div>
              <button 
                onClick={() => {
                  setStripeLogs([{ id: '1', time: new Date().toLocaleTimeString(), event: 'Stripe Sandbox console logs cleared', type: 'info' }]);
                }}
                className="text-[10px] text-neutral-400 hover:text-white transition flex items-center gap-1 font-mono"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
              {stripeLogs.map(log => (
                <div key={log.id} className="text-[10px] font-mono leading-relaxed border-b border-neutral-900 pb-2 flex gap-1.5 items-start">
                  <span className="text-neutral-500 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warning' ? 'text-amber-400' : 'text-sky-400'
                  }>
                    {log.event}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
            <span>SDK Version: v3.24 (Simulated)</span>
            <span>API v2026-07-07</span>
          </div>
        </div>
      </div>

      {/* CLIENTS SUBSCRIPTION TABLE GRID */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5">
        
        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-100">
          <div>
            <h4 className="font-display font-semibold text-neutral-800 text-sm">Listado de Clientes y Cobros Stripe</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Controla las tarifas asignadas, estados de pasarela y gestiona las renovaciones de cobros.</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none w-44 font-medium"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="past_due">Pendiente (Mora)</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-150 text-neutral-600 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Nombre / Cliente</th>
                <th className="p-3">Membresía / Plan Stripe</th>
                <th className="p-3">Estado de Suscripción</th>
                <th className="p-3">Frecuencia / Próximo Cobro</th>
                <th className="p-3">Tarjeta Vinculada</th>
                <th className="p-3 text-right">Simulaciones de Pago & Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(c => {
                const rawStatus = c.stripeSubscriptionStatus || 'active';
                const currentTier = c.stripeSubscriptionTier || 'premium_80';
                const nextBilling = getNextBillingDate(c.createdAt);
                const cardBrand = c.stripeCardBrand || 'Visa';
                const cardLast4 = c.stripeCardLast4 || '4242';

                return (
                  <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition duration-150">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 text-sm">{c.name}</span>
                        <span className="text-[10px] text-neutral-400">{c.email}</span>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <select
                        value={currentTier}
                        onChange={(e) => handleUpdatePlan(c.id, e.target.value as any)}
                        className="text-xs font-semibold px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="basic_45">Básico - 45 €/mes</option>
                        <option value="premium_80">Premium - 80 €/mes</option>
                        <option value="elite_150">Elite Coaching - 150 €/mes</option>
                      </select>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rawStatus === 'active' || rawStatus === 'trialing'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rawStatus === 'past_due'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {rawStatus === 'active' ? 'Activo' : rawStatus === 'past_due' ? 'Pendiente' : rawStatus === 'canceled' ? 'Cancelado' : rawStatus}
                        </span>
                        
                        {/* Selector for manually overriding state */}
                        <select
                          value={rawStatus}
                          onChange={(e) => handleUpdateStatus(c.id, e.target.value as any)}
                          className="bg-transparent border-0 font-medium text-[10px] text-neutral-400 hover:text-neutral-700 cursor-pointer focus:outline-none"
                        >
                          <option value="active">Activo</option>
                          <option value="past_due">Pendiente</option>
                          <option value="canceled">Cancelado</option>
                        </select>
                      </div>
                    </td>

                    <td className="p-3 text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-medium">{nextBilling}</span>
                      </div>
                    </td>

                    <td className="p-3 text-neutral-500 font-mono text-[11px]">
                      <span className="bg-neutral-100 text-neutral-700 px-1 py-0.2 rounded text-[9px] mr-1 font-sans">
                        {cardBrand}
                      </span>
                      <span>•••• {cardLast4}</span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulatePaymentSuccess(c.id)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md transition text-[10px] flex items-center gap-0.5 cursor-pointer"
                          title="Simular cobro exitoso por webhook"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Simular Pago</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleSimulatePaymentFailure(c.id)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-md transition text-[10px] flex items-center gap-0.5 cursor-pointer"
                          title="Simular fallo de tarjeta por webhook"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Simular Fallo</span>
                        </button>

                        {onSelectClient && (
                          <button
                            type="button"
                            onClick={() => onSelectClient(c.id)}
                            className="p-1 text-neutral-500 hover:bg-neutral-100 rounded-md transition"
                            title="Ver evolución física y rutina"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-400 italic bg-neutral-50 rounded-b-xl">
                    No se encontraron clientes para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STRIPE INTEGRATION HELP INFO */}
      <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 flex gap-3.5 text-xs text-neutral-600">
        <Info className="w-5 h-5 text-neutral-400 shrink-0" />
        <div>
          <p className="font-semibold text-neutral-800">¿Cómo funciona esta simulación de Stripe?</p>
          <p className="mt-1 leading-relaxed">
            Este panel está integrado directamente con el estado de nuestra aplicación. Al utilizar los botones 
            <strong className="text-neutral-800"> "Simular Pago"</strong> o <strong className="text-neutral-800">"Simular Fallo"</strong>, 
            el sistema simula un evento de webhook de Stripe (<code className="font-mono bg-neutral-150 px-1 py-0.2 rounded text-[10px]">invoice.payment_succeeded</code> o 
            <code className="font-mono bg-neutral-150 px-1 py-0.2 rounded text-[10px]">invoice.payment_failed</code>), generando automáticamente el recibo de facturación correspondiente 
            o activando las alertas de mora respectivas del cliente en cuestión.
          </p>
        </div>
      </div>
    </div>
  );
}
