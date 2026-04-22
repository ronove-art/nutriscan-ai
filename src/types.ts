export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  dietGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'keto' | 'vegan';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalorieTarget: number;
  macroProteinPct: number;
  macroCarbsPct: number;
  macroFatPct: number;
  allergens: string[];
  healthConditions: string[];
  aiPersonality: 'friendly' | 'strict' | 'gentle' | 'scientific';
  updatedAt: any;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  address: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  barcode?: string;
  qrCode?: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
  servingSize: number;
  imageUrl?: string;
}

export interface MealLog {
  id?: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  consumedAt: any;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
}
