import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from '../firebase';
import { DiagnosisResponse, SavedDiagnosis, GardenPlant } from '../types';

const LOCAL_DIAGNOSES_KEY = 'agro_botanist_local_diagnoses';
const LOCAL_GARDEN_KEY = 'agro_botanist_local_garden';

export async function saveDiagnosis(
  userId: string | null,
  diagnosis: DiagnosisResponse,
  imageUrl?: string,
  notes?: string
): Promise<SavedDiagnosis> {
  const newDiagnosis: SavedDiagnosis = {
    ...diagnosis,
    createdAt: new Date().toISOString(),
    imageUrl,
    notes,
    completedCareSteps: [],
  };

  if (userId) {
    try {
      const colRef = collection(db, 'users', userId, 'diagnoses');
      const docRef = await addDoc(colRef, {
        plantNameEnglish: diagnosis.plant_info.name_english,
        plantNameGujarati: diagnosis.plant_info.name_gujarati,
        scientificName: diagnosis.plant_info.scientific_name,
        isHealthy: diagnosis.health_status.is_healthy,
        conditionName: diagnosis.health_status.condition_name,
        symptoms: diagnosis.health_status.symptoms,
        description: diagnosis.health_status.description,
        waterFrequency: diagnosis.water_requirement.frequency,
        waterQuantity: diagnosis.water_requirement.quantity,
        waterInstructions: diagnosis.water_requirement.instructions,
        fertilizerType: diagnosis.fertilizer_requirement.recommended_type,
        fertilizerDosage: diagnosis.fertilizer_requirement.dosage_and_frequency,
        fertilizerMethod: diagnosis.fertilizer_requirement.application_method,
        careAndTreatment: diagnosis.care_and_treatment,
        imageUrl: imageUrl || '',
        notes: notes || '',
        completedCareSteps: [],
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      });
      newDiagnosis.id = docRef.id;
      return newDiagnosis;
    } catch (err) {
      console.warn('Firestore write failed, falling back to local storage:', err);
    }
  }

  // Fallback to local storage
  newDiagnosis.id = 'local-' + Date.now();
  const existing = getLocalDiagnoses();
  const updated = [newDiagnosis, ...existing];
  localStorage.setItem(LOCAL_DIAGNOSES_KEY, JSON.stringify(updated));
  return newDiagnosis;
}

export function getLocalDiagnoses(): SavedDiagnosis[] {
  try {
    const raw = localStorage.getItem(LOCAL_DIAGNOSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function fetchUserDiagnoses(userId: string | null): Promise<SavedDiagnosis[]> {
  if (userId) {
    try {
      const colRef = collection(db, 'users', userId, 'diagnoses');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: SavedDiagnosis[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          createdAt: data.createdAt || new Date().toISOString(),
          imageUrl: data.imageUrl,
          notes: data.notes,
          completedCareSteps: data.completedCareSteps || [],
          plant_info: {
            name_english: data.plantNameEnglish || 'Plant',
            name_gujarati: data.plantNameGujarati || '',
            scientific_name: data.scientificName || '',
          },
          health_status: {
            is_healthy: data.isHealthy ?? true,
            condition_name: data.conditionName || 'Diagnosed',
            symptoms: data.symptoms || [],
            description: data.description || '',
          },
          water_requirement: {
            frequency: data.waterFrequency || '',
            quantity: data.waterQuantity || '',
            instructions: data.waterInstructions || '',
          },
          fertilizer_requirement: {
            recommended_type: data.fertilizerType || '',
            dosage_and_frequency: data.fertilizerDosage || '',
            application_method: data.fertilizerMethod || '',
          },
          care_and_treatment: data.careAndTreatment || [],
        });
      });
      return items;
    } catch (err) {
      console.warn('Firestore fetch diagnoses error, using local:', err);
    }
  }
  return getLocalDiagnoses();
}

export async function deleteSavedDiagnosis(userId: string | null, id: string): Promise<void> {
  if (userId && !id.startsWith('local-')) {
    try {
      const docRef = doc(db, 'users', userId, 'diagnoses', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Delete doc error:', e);
    }
  }
  const local = getLocalDiagnoses().filter(d => d.id !== id);
  localStorage.setItem(LOCAL_DIAGNOSES_KEY, JSON.stringify(local));
}

// Garden Management
export async function addGardenPlant(userId: string | null, plant: Omit<GardenPlant, 'id'>): Promise<GardenPlant> {
  const newPlant: GardenPlant = {
    ...plant,
    id: 'local-' + Date.now(),
  };

  if (userId) {
    try {
      const colRef = collection(db, 'users', userId, 'garden');
      const docRef = await addDoc(colRef, {
        ...plant,
        serverTimestamp: serverTimestamp(),
      });
      newPlant.id = docRef.id;
      return newPlant;
    } catch (err) {
      console.warn('Garden plant firestore write error:', err);
    }
  }

  const existing = getLocalGarden();
  const updated = [newPlant, ...existing];
  localStorage.setItem(LOCAL_GARDEN_KEY, JSON.stringify(updated));
  return newPlant;
}

export function getLocalGarden(): GardenPlant[] {
  try {
    const raw = localStorage.getItem(LOCAL_GARDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function fetchUserGarden(userId: string | null): Promise<GardenPlant[]> {
  if (userId) {
    try {
      const colRef = collection(db, 'users', userId, 'garden');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: GardenPlant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          plantName: data.plantName || 'My Plant',
          plantNameGujarati: data.plantNameGujarati || '',
          scientificName: data.scientificName || '',
          location: data.location || 'Garden',
          lastWatered: data.lastWatered,
          nextWatering: data.nextWatering,
          wateringFrequencyDays: data.wateringFrequencyDays || 2,
          lastFertilized: data.lastFertilized,
          fertilizerType: data.fertilizerType,
          notes: data.notes,
          imageUrl: data.imageUrl,
          status: data.status || 'healthy',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      return items;
    } catch (err) {
      console.warn('Firestore fetch garden error:', err);
    }
  }
  return getLocalGarden();
}

export async function updateWateringLog(userId: string | null, plantId: string, frequencyDays = 3): Promise<void> {
  const now = new Date();
  const next = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

  if (userId && !plantId.startsWith('local-')) {
    try {
      const docRef = doc(db, 'users', userId, 'garden', plantId);
      await updateDoc(docRef, {
        lastWatered: now.toISOString(),
        nextWatering: next.toISOString(),
      });
    } catch (err) {
      console.warn('Update watering error:', err);
    }
  }

  const existing = getLocalGarden();
  const updated = existing.map(p => {
    if (p.id === plantId) {
      return {
        ...p,
        lastWatered: now.toISOString(),
        nextWatering: next.toISOString(),
      };
    }
    return p;
  });
  localStorage.setItem(LOCAL_GARDEN_KEY, JSON.stringify(updated));
}

export async function deleteGardenPlantItem(userId: string | null, plantId: string): Promise<void> {
  if (userId && !plantId.startsWith('local-')) {
    try {
      const docRef = doc(db, 'users', userId, 'garden', plantId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Delete garden error:', err);
    }
  }
  const existing = getLocalGarden().filter(p => p.id !== plantId);
  localStorage.setItem(LOCAL_GARDEN_KEY, JSON.stringify(existing));
}
