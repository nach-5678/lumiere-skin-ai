
export interface SkinConcern {
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  coordinates?: number[]; // [ymin, xmin, ymax, xmax] relative to 1000x1000
  preciseLocation?: number[]; // [y, x] relative to 1000x1000
  // New fields for professional report
  clinicalOverview?: string;
  visualIndicators?: string;
  riskFactors?: string[];
}

export interface SkincareProduct {
  name: string;
  type: string;
  category: 'Cleanser' | 'Toner' | 'Treatment' | 'Moisturizer' | 'Sunscreen' | 'Other'; // Added for grouping
  description: string; // Generic product description
  keyIngredients: string[];
  reason: string; // Personalized note based on analysis
  usageTiming?: string; // e.g., "Morning only"
  purchaseUrl?: string; // Direct link to purchase
  imageUrl?: string; // Real image of the product
  isTopPick?: boolean; // Highlight the most recommended product
  estimatedPrice?: number; // Real-time estimated price in INR
  priceRange?: '₹' | '₹₹' | '₹₹₹'; // Budget class
}

export interface RoutineStep {
  step: string;
  productType: string;
  instruction: string;
}

export interface ZoneAnalysis {
  zone: string; // Forehead, Cheeks, etc.
  condition: string;
  score: number; // 0-100 health of this zone
}

export interface MetricAnalysis {
  name: string; // e.g. "Hydration"
  score: number;
  status: string; // e.g. "Optimal", "Dehydrated"
  advice: string; // Personalized advice
}

// NEW: Molecular Match for Pro Report
export interface IngredientMapping {
  ingredient: string;
  targetConcern: string;
  mechanism: string; // e.g. "Inhibits tyrosinase"
  scientificBenefit: string;
}

// NEW: Timeline for Pro Report
export interface TimelinePhase {
  phase: string; // e.g., "Weeks 1-2"
  whatToExpect: string;
  focus: string;
}

// NEW: Clinic Treatments
export interface ClinicalTreatment {
  name: string; // e.g., "Microneedling"
  relevance: string; // "Highly Recommended for your Acne Scars"
  estimatedCost: string; // "$150 - $300 per session"
  downtime: string; // "2-3 days redness"
}

export interface DoAndDont {
  do: string[];
  dont: string[];
  diet: {
    eat: string[];
    avoid: string[];
  };
}

export interface SkinAnalysisResult {
  skinType: 'Oily' | 'Dry' | 'Combination' | 'Sensitive' | 'Normal';
  summary: string;
  confidenceScore: number;
  healthScore: number;
  concerns: SkinConcern[];
  routine: {
    morning: RoutineStep[];
    evening: RoutineStep[];
    weekly: RoutineStep[];
  };
  products: SkincareProduct[];
  dailyTips: string[];
  doAndDonts: DoAndDont;
  
  // New Professional Report Data
  reportData: {
    reportId: string;
    analysisVersion: string;
    // Keeping raw scores for backward compat if needed, but UI will prefer metricsBreakdown
    barrierHealth: number; 
    oilBalance: number; 
    pigmentationScore: number; 
    poreScore: number; 
    
    metricsBreakdown: MetricAnalysis[]; // NEW: Detailed dynamic advice
    
    zones: ZoneAnalysis[];
    lifestyleImpact: string[];
    redFlags: string[];
    scanQuality: number; // 0-100
    
    // Pro-Level Classifications
    fitzpatrickType: string; // e.g., "Type III"
    glogauScale: string; // e.g., "Type II (Moderate)"
    baumannType: string; // e.g., "OSNW"
    
    // WORLD CLASS ADDITIONS
    ingredientScience: IngredientMapping[];
    recoveryTimeline: TimelinePhase[];
    clinicalTreatments: ClinicalTreatment[];
  };
}

export interface SavedScan {
  id: string;
  date: string; // ISO string
  timestamp: number;
  score: number;
  imageBlob: Blob; // Stored in IndexedDB
  thumbnailUrl?: string; // Generated for display
  analysis: SkinAnalysisResult;
}

// NEW: Medical Profile for Safety Checks
export interface MedicalProfile {
  isPregnant: boolean;
  isBreastfeeding: boolean;
  onAccutane: boolean;
  hasNutAllergy: boolean;
  hasAspirinAllergy: boolean; // Salicylic Acid check
  isSensitive: boolean;
}

// NEW: Spot Watch Feature
export interface WatchedSpot {
  id: string;
  dateAdded: string;
  label: string;
  imageCrop: string; // Base64 of the cropped spot
  note?: string;
  autoTrack?: boolean;
  coordinates?: { x: number, y: number, width: number, height: number }; // Normalized 0-1
}

export interface CycleTracker {
  lastPeriodDate: string; // ISO string
  averageCycleLength: number; // in days
  isTracking: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  joinedDate: string;
  avatarUrl?: string;
  selfReportedSkinType?: string; // NEW field for quiz result
  budgetPreference?: 'budget' | 'mid-range' | 'luxury' | 'any'; // NEW field for budget class
  medicalProfile?: MedicalProfile; // Added optional medical profile
  watchlist?: WatchedSpot[]; // NEW: List of tracked spots
  shelf?: SmartShelfItem[]; // NEW: List of shelf products
  cycleTracker?: CycleTracker; // NEW: Menstrual cycle tracking
}

export enum AppState {
  LANDING = 'LANDING',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  JOURNEY = 'JOURNEY',
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

export interface ClinicResult {
  text: string;
  links: GroundingChunk[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface SmartShelfItem {
  id: string;
  image: string;
  productName: string;
  type: string;
  activeIngredients: string[];
  isCompatible: boolean;
  conflictReason: string | null;
  usageAdvice: string;
}

export interface WeatherData {
  uvIndex: number;
  humidity: number;
  temperature: number;
  isDay: boolean;
  advice: string;
}
