/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  User 
} from './firebase';
import { Navbar } from './components/Navbar';
import { LeafScanner } from './components/LeafScanner';
import { DiagnosisResultView } from './components/DiagnosisResultView';
import { BotanistChat } from './components/BotanistChat';
import { GardenTracker } from './components/GardenTracker';
import { FertilizerCalculator } from './components/FertilizerCalculator';
import { AuthModal } from './components/AuthModal';
import { 
  saveDiagnosis, 
  fetchUserDiagnoses, 
  deleteSavedDiagnosis, 
  addGardenPlant, 
  fetchUserGarden, 
  updateWateringLog, 
  deleteGardenPlantItem 
} from './services/storageService';
import { DiagnosisResponse, SavedDiagnosis, GardenPlant, ChatMessage } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'chat' | 'garden' | 'calculator'>('scanner');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Diagnosis State
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  // Garden and Diagnosis History
  const [diagnoses, setDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [garden, setGarden] = useState<GardenPlant[]>([]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am Dr. Vriksha, your VANANSH AI Agro-Botanist and Tree Doctor. You can upload leaf photos, ask about plant diseases, and get precision recipes for organic fertilizers (Jeevamrut, Neem oil, Vermicompost) and watering cycles.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      loadUserData(currentUser ? currentUser.uid : null);
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string | null) => {
    try {
      const [userDiags, userGarden] = await Promise.all([
        fetchUserDiagnoses(userId),
        fetchUserGarden(userId),
      ]);
      setDiagnoses(userDiags);
      setGarden(userGarden);
    } catch (err) {
      console.warn('Error loading user data:', err);
    }
  };

  // When a leaf diagnosis completes
  const handleDiagnoseComplete = async (
    data: DiagnosisResponse,
    imageSrc: string,
    notes?: string
  ) => {
    setCurrentDiagnosis(data);
    setCurrentImageSrc(imageSrc);

    // Auto save to history
    try {
      const saved = await saveDiagnosis(user ? user.uid : null, data, imageSrc, notes);
      setDiagnoses((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
    } catch (e) {
      console.warn('Could not auto-save diagnosis:', e);
    }
  };

  // Add diagnosed plant directly to Garden
  const handleSaveToGarden = async (diagnosis: DiagnosisResponse) => {
    const newPlant: Omit<GardenPlant, 'id'> = {
      plantName: diagnosis.plant_info.name_english,
      scientificName: diagnosis.plant_info.scientific_name,
      location: 'Garden / Farm',
      wateringFrequencyDays: 3,
      lastWatered: new Date().toISOString(),
      nextWatering: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      fertilizerType: diagnosis.fertilizer_requirement.recommended_type,
      status: diagnosis.health_status.is_healthy ? 'healthy' : 'treatment',
      imageUrl: currentImageSrc || undefined,
      notes: `${diagnosis.health_status.condition_name} - ${diagnosis.health_status.description}`,
      createdAt: new Date().toISOString(),
    };

    const added = await addGardenPlant(user ? user.uid : null, newPlant);
    setGarden((prev) => [added, ...prev]);
  };

  // Ask Chatbot with context from Diagnosis
  const handleAskChatbotFromDiagnosis = (
    plantName: string,
    condition: string,
    symptoms: string[]
  ) => {
    const prompt = `I just diagnosed my ${plantName}. The condition identified is "${condition}" with symptoms: ${symptoms.join(', ')}. What are the organic remedies, bio-pesticide sprays, or watering adjustments you recommend?`;
    setChatInitialQuery(prompt);
    setActiveTab('chat');
  };

  // Handle Water Plant in Garden
  const handleWaterPlant = async (plantId: string, freqDays = 3) => {
    await updateWateringLog(user ? user.uid : null, plantId, freqDays);
    loadUserData(user ? user.uid : null);
  };

  // Handle Delete Plant
  const handleDeletePlant = async (plantId: string) => {
    await deleteGardenPlantItem(user ? user.uid : null, plantId);
    setGarden((prev) => prev.filter((p) => p.id !== plantId));
  };

  // Handle Delete Diagnosis
  const handleDeleteDiagnosis = async (id: string) => {
    await deleteSavedDiagnosis(user ? user.uid : null, id);
    setDiagnoses((prev) => prev.filter((d) => d.id !== id));
  };

  // View Saved Diagnosis from History
  const handleSelectSavedDiagnosis = (saved: SavedDiagnosis) => {
    setCurrentDiagnosis({
      plant_info: saved.plant_info,
      health_status: saved.health_status,
      water_requirement: saved.water_requirement,
      fertilizer_requirement: saved.fertilizer_requirement,
      care_and_treatment: saved.care_and_treatment,
    });
    setCurrentImageSrc(saved.imageUrl || 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=800&q=80');
    setActiveTab('scanner');
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    loadUserData(null);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf6] text-stone-900 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'chat') setChatInitialQuery(undefined);
        }}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'scanner' && (
          currentDiagnosis && currentImageSrc ? (
            <DiagnosisResultView
              diagnosis={currentDiagnosis}
              imageSrc={currentImageSrc}
              onSaveToGarden={handleSaveToGarden}
              onAskChatbot={handleAskChatbotFromDiagnosis}
              onNewScan={() => {
                setCurrentDiagnosis(null);
                setCurrentImageSrc(null);
              }}
            />
          ) : (
            <LeafScanner
              onDiagnoseComplete={handleDiagnoseComplete}
            />
          )
        )}

        {activeTab === 'chat' && (
          <BotanistChat
            messages={chatMessages}
            setMessages={setChatMessages}
            initialQuery={chatInitialQuery}
          />
        )}

        {activeTab === 'garden' && (
          <GardenTracker
            garden={garden}
            diagnoses={diagnoses}
            onWaterPlant={handleWaterPlant}
            onDeletePlant={handleDeletePlant}
            onDeleteDiagnosis={handleDeleteDiagnosis}
            onSelectDiagnosis={handleSelectSavedDiagnosis}
            onAddCustomPlant={async (plant) => {
              const added = await addGardenPlant(user ? user.uid : null, plant);
              setGarden((prev) => [added, ...prev]);
            }}
          />
        )}

        {activeTab === 'calculator' && (
          <FertilizerCalculator />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-[#fdfcf6] py-5 sm:py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="font-serif font-bold text-emerald-950">VANANSH - AI Tree Doctor</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-stone-600 text-[11px] sm:text-xs">AI Plant Pathology & Tree Health Diagnosis</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-stone-400 text-[10px] sm:text-[11px]">
            <span>Powered by Gemini AI & Firebase Cloud</span>
            <span>•</span>
            <span>Dr. Vriksha Diagnostic Lab</span>
          </div>
        </div>
      </footer>

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
