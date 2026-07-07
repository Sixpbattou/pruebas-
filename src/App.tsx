import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Shield, Sparkles, RefreshCw, 
  HelpCircle, Check, Globe, Info, Dumbbell, Sparkle
} from 'lucide-react';
import { AppState } from './types';
import TrainerDashboard from './components/TrainerDashboard';
import ClientDashboard from './components/ClientDashboard';

export default function App() {
  const [role, setRole] = useState<'trainer' | 'client'>('trainer');
  const [state, setState] = useState<AppState | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('alejandro_gomez');
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial state and configure Server-Sent Events (SSE) with HTTP Polling fallback
  useEffect(() => {
    let sse: EventSource | null = null;
    let pollInterval: any = null;

    const fetchInitialState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
          setSyncStatus('connected');
          setErrorMsg(null);
        }
      } catch (err) {
        console.error('Error fetching initial state:', err);
        setErrorMsg('Error de conexión inicial. Intentando reconectar...');
      }
    };

    const connectSSE = () => {
      sse = new EventSource('/api/sync/stream');

      sse.onmessage = (event) => {
        try {
          const parsedState = JSON.parse(event.data);
          setState(parsedState);
          setSyncStatus('connected');
          setErrorMsg(null);
        } catch (err) {
          console.error('Error parsing SSE state update:', err);
        }
      };

      sse.onerror = (err) => {
        console.error('SSE connection error, falling back to HTTP polling:', err);
        setSyncStatus('disconnected');
        // Start backup polling if SSE fails and is not already running
        if (!pollInterval) {
          pollInterval = setInterval(fetchInitialState, 4000);
        }
      };
    };

    // Load instantly, then establish SSE stream
    fetchInitialState().then(() => {
      connectSSE();
    });

    return () => {
      if (sse) sse.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Update App State on the server, which then broadcasts via SSE
  const updateStateOnServer = async (newState: Partial<AppState>, description: string, user: string) => {
    if (!state) return;

    // optimistic UI update
    const mergedState = { ...state, ...newState } as AppState;
    setState(mergedState);

    try {
      const response = await fetch('/api/state/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newState,
          actionDescription: description,
          actionUser: user
        })
      });
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to persist state on server:', data.error);
      }
    } catch (err) {
      console.error('Error sending state update:', err);
      setErrorMsg('Error de red al sincronizar con el servidor.');
    }
  };

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 text-neutral-600 font-sans p-6">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="font-display font-medium text-lg text-neutral-800">Cargando ecosistema FitSync...</p>
          <p className="text-xs text-neutral-400 max-w-xs">Estableciendo sincronización en tiempo real mediante SSE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      
      {/* GLOBAL SAAS NAVIGATION & SWITCHER CONTROL BAR */}
      <header className="sticky top-0 z-40 bg-neutral-900 text-white shadow-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-neutral-950 p-2 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-white flex items-center gap-1">
                FitSync <span className="text-xs text-emerald-400 font-mono font-normal">SaaS Suite</span>
              </span>
              <p className="text-[10px] text-neutral-400 leading-none">Ecosistema Coach & Client en Tiempo Real</p>
            </div>
          </div>

          {/* Real-Time Sync Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${
              syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`} />
            <span className="text-neutral-400 font-medium">
              {syncStatus === 'connected' ? 'Sincronizado en Tiempo Real' : 'Conectando sincronización...'}
            </span>
          </div>

          {/* Role Switching Toggles */}
          <div className="flex bg-neutral-800 p-1 rounded-xl border border-neutral-700">
            <button
              onClick={() => setRole('trainer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                role === 'trainer'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Vista Entrenador</span>
            </button>
            <button
              onClick={() => setRole('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                role === 'client'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Vista Cliente</span>
            </button>
          </div>

        </div>
      </header>

      {/* COMPANION INFO BANNER */}
      <div className="bg-emerald-50 text-emerald-950 text-xs px-4 py-2 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-1.5">
          <p className="flex items-center gap-1.5">
            <Sparkle className="w-4 h-4 text-emerald-600 fill-emerald-600 animate-spin" />
            <span>
              <strong>Simulación Dual de Sincronización:</strong> Modifica cualquier dato (rutina, peso, chat) en una de las vistas y cambia de rol para ver cómo se actualiza automáticamente en la otra.
            </span>
          </p>
          {role === 'client' && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Sesión iniciada como:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-white text-neutral-800 px-2 py-0.5 rounded border border-neutral-200 font-bold"
              >
                {state.clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* APP MAIN VIEW CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {role === 'trainer' ? (
          <TrainerDashboard
            state={state}
            updateState={updateStateOnServer}
            selectedClientId={selectedClientId}
            setSelectedClientId={setSelectedClientId}
          />
        ) : (
          <ClientDashboard
            state={state}
            updateState={updateStateOnServer}
            clientId={selectedClientId}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 FitSync Coach Platform. Desarrollado con Inteligencia Artificial Gemini de Google.</p>
          <p className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Cumplimiento RGPD & Conexión Encriptada Activos</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
