export interface Client {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  weight: number; // in kg
  height: number; // in cm
  injuries: string;
  experience: 'principiante' | 'intermedio' | 'avanzado';
  goal: 'perder_grasa' | 'ganar_musculo' | 'rendimiento' | 'salud';
  availability: string; // e.g. "3 días/semana"
  material: string; // e.g. "Gimnasio completo", "Mancuernas en casa"
  sportHistory: string;
  privateNotes: string;
  alerts: string[];
  status: 'activo' | 'inactivo';
  createdAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled';
  stripeSubscriptionTier?: 'premium_80' | 'basic_45' | 'elite_150';
  stripeCardBrand?: string;
  stripeCardLast4?: string;
}

export interface ExerciseSet {
  id: string;
  reps: string;
  rpe: string; // e.g., "8", "9", "10" or "RPE 8"
  rest: string; // e.g., "90s"
  tempo: string; // e.g., "3010"
  weightUsed?: number; // client logged
  isCompleted?: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  videoUrl?: string;
  imageUrl?: string;
  comment?: string;
  sets: ExerciseSet[];
}

export interface WorkoutPlan {
  id: string;
  clientId: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  isCompleted?: boolean;
}

export interface Meal {
  name: string;
  time: string;
  ingredients: string[];
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fats: number; // g
  fiber: number; // g
  water: number; // liters
  micronutrients: string;
  dietType: 'vegana' | 'cetogenica' | 'mediterranea' | 'ayuno_intermitente' | 'estandar';
  meals: Meal[];
  shoppingList: string[];
}

export interface Supplement {
  id: string;
  clientId: string;
  name: string;
  dosage: string;
  timing: string;
  benefits: string;
  warnings: string;
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  energy: number; // 1-5
  sleep: number; // hours
  soreness: number; // 1-5
  mood: number; // 1-5
  waterConsumed: number; // L
  stepsCount: number;
  weightLogged?: number;
}

export interface PhotoLog {
  id: string;
  date: string;
  url: string;
  pose: 'frente' | 'perfil' | 'espalda';
}

export interface MeasureLog {
  id: string;
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: 'pagado' | 'pendiente' | 'cancelado';
  date: string;
  dueDate: string;
  planType: 'suscripción_mensual' | 'bono_10_sesiones' | 'sesion_individual';
}

export interface Message {
  id: string;
  senderId: 'coach' | string; // client ID or 'ai'
  text: string;
  timestamp: string;
  fileType?: 'image' | 'video' | 'pdf' | 'voice';
  fileUrl?: string;
  reviewPending?: boolean; // AI generated message awaiting trainer approval
  approved?: boolean;
}

export interface CalendarSession {
  id: string;
  clientId: string;
  title: string;
  start: string; // ISO string or YYYY-MM-DDTHH:MM
  end: string;
  status: 'pendiente' | 'confirmada' | 'cancelada';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  user: string;
}

export interface AppState {
  clients: Client[];
  workouts: WorkoutPlan[];
  nutritionPlans: NutritionPlan[];
  supplements: Supplement[];
  habitLogs: { [clientId: string]: HabitLog[] };
  photoLogs: { [clientId: string]: PhotoLog[] };
  measureLogs: { [clientId: string]: MeasureLog[] };
  invoices: Invoice[];
  chats: { [clientId: string]: Message[] };
  sessions: CalendarSession[];
  logs: SystemLog[];
  config: {
    language: 'es' | 'en';
    theme: 'light' | 'dark';
    openaiKeySimulation: boolean;
  };
}
