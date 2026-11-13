export type RoomType =
  | 'living'
  | 'bedroom'
  | 'workspace'
  | 'dining'
  | 'studio';

export type StylePresetId =
  | 'japandi'
  | 'modern'
  | 'scandinavian'
  | 'tropical';

export type FurnitureCategory =
  | 'seating'
  | 'table'
  | 'storage'
  | 'bed'
  | 'workspace'
  | 'lighting'
  | 'decor';

export type BudgetTier = 'Ekonomis' | 'Menengah' | 'Premium';

export type Orientation = 'Utara' | 'Timur' | 'Selatan' | 'Barat';

export interface FurnitureCatalogItem {
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  defaultMaterial: string;
  priceIdr: number;
  isFloorOverlay?: boolean; // e.g., rug
  minFrontClearanceCm?: number;
  colorHex: string;
}

export interface PlacedFurniture {
  id: string;
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  xCm: number; // Top-left X in unrotated or rotated bounding box
  yCm: number; // Top-left Y
  widthCm: number;
  depthCm: number;
  heightCm: number;
  rotationDeg: 0 | 90 | 180 | 270;
  material: string;
  priceIdr: number;
  isFloorOverlay?: boolean;
  minFrontClearanceCm?: number;
  colorHex: string;
}

export interface ArchitecturalOpening {
  id: string;
  type: 'door' | 'window';
  wall: 'top' | 'bottom' | 'left' | 'right';
  offsetCm: number;
  widthCm: number;
}

export interface ColorRule603010 {
  dominant: { name: string; hex: string; surface: string };
  secondary: { name: string; hex: string; surface: string };
  accent: { name: string; hex: string; surface: string };
}

export interface RoomConfig {
  id: string;
  name: string;
  roomType: RoomType;
  widthCm: number;
  lengthCm: number;
  ceilingCm: number;
  style: StylePresetId;
  orientation: Orientation;
  budgetTier: BudgetTier;
  occupants: number;
  wallFinish: string;
  floorMaterial: string;
  colors: ColorRule603010;
  openings: ArchitecturalOpening[];
  furniture: PlacedFurniture[];
  notes: string;
}

export type AuditSeverity = 'nominal' | 'warning' | 'critical';

export interface ErgonomicFinding {
  id: string;
  rule: string;
  severity: AuditSeverity;
  measuredLabel: string;
  standardLabel: string;
  message: string;
  affectedIds: string[];
}

export interface LightingCalculation {
  areaSqM: number;
  targetLumensMin: number;
  targetLumensMax: number;
  recommendedLumens: number;
  ambientLumens: number;
  taskLumens: number;
  accentLumens: number;
  kelvinRange: string;
  estimatedWattLed: number;
}

export interface ErgonomicAuditResult {
  areaSqM: number;
  occupiedSqM: number;
  fillRatioPercent: number;
  fillStatus: AuditSeverity;
  totalBudgetIdr: number;
  lighting: LightingCalculation;
  findings: ErgonomicFinding[];
  nominalCount: number;
  warningCount: number;
  criticalCount: number;
}

export interface RecommendedFurnitureSpec {
  name: string;
  category: string;
  idealDimensionsCm: { w: number; d: number; h: number };
  quantity: number;
  placementRule: string;
  materialSpec: string;
  estimatedPriceIdr: number;
  priority: 'Wajib' | 'Disarankan' | 'Opsional';
}

export interface SuggestedLayoutItem {
  name: string;
  category: FurnitureCategory;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  xCm: number;
  yCm: number;
  rotationDeg: 0 | 90 | 180 | 270;
  material: string;
  estimatedPriceIdr: number;
  isFloorOverlay?: boolean;
}

export interface SystematicAdvisoryReport {
  executiveSummary: string;
  spatialAndCirculation: {
    zoningStrategy: string;
    focalPoint: string;
    circulationAssessment: string;
    clearanceFixes: string[];
  };
  furniturePlan: RecommendedFurnitureSpec[];
  colorPalette603010: {
    dominant: { name: string; hex: string; surface: string; ratio: string };
    secondary: { name: string; hex: string; surface: string; ratio: string };
    accent: { name: string; hex: string; surface: string; ratio: string };
    materialHarmonyNote: string;
  };
  lighting3Layers: {
    targetTotalLumens: number;
    ambient: { fixture: string; kelvin: string; lumens: number; placement: string };
    task: { fixture: string; kelvin: string; lumens: number; placement: string };
    accent: { fixture: string; kelvin: string; lumens: number; placement: string };
    daylightStrategy: string;
  };
  acousticsVentilationDecor: {
    textileAndAcoustic: string;
    greeneryRecommendation: string;
    wallArtRule: string;
    airflowNote: string;
  };
  phasedActionPlan: Array<{
    phase: string;
    title: string;
    actionItems: string[];
    estimatedCostIdr: number;
  }>;
  suggestedLayoutCoords: SuggestedLayoutItem[];
}

export interface AdvisorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
