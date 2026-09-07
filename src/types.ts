export interface PlantInfo {
  name_english: string;
  name_gujarati?: string;
  scientific_name: string;
}

export interface HealthStatus {
  is_healthy: boolean;
  condition_name: string;
  symptoms: string[];
  description: string;
}

export interface WaterRequirement {
  frequency: string;
  quantity: string;
  instructions: string;
}

export interface FertilizerRequirement {
  recommended_type: string;
  dosage_and_frequency: string;
  application_method: string;
}

export interface DiagnosisResponse {
  plant_info: PlantInfo;
  health_status: HealthStatus;
  water_requirement: WaterRequirement;
  fertilizer_requirement: FertilizerRequirement;
  care_and_treatment: string[];
}

export interface SavedDiagnosis extends DiagnosisResponse {
  id?: string;
  createdAt: string;
  imageUrl?: string;
  notes?: string;
  completedCareSteps?: number[];
}

export interface GardenPlant {
  id: string;
  plantName: string;
  plantNameGujarati?: string;
  scientificName?: string;
  species?: string;
  location?: string;
  lastWatered?: string;
  nextWatering?: string;
  wateringFrequencyDays?: number;
  lastFertilized?: string;
  fertilizerType?: string;
  notes?: string;
  imageUrl?: string;
  status: 'healthy' | 'treatment' | 'recovered' | 'monitoring';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    title?: string;
    url?: string;
  }>;
  image?: string;
}
