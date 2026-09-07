import React, { useState } from 'react';
import { 
  Sprout, 
  Droplets, 
  Calendar, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search,
  Leaf
} from 'lucide-react';
import { SavedDiagnosis, GardenPlant } from '../types';

interface GardenTrackerProps {
  garden: GardenPlant[];
  diagnoses: SavedDiagnosis[];
  onWaterPlant: (plantId: string, freqDays?: number) => Promise<void>;
  onDeletePlant: (plantId: string) => Promise<void>;
  onDeleteDiagnosis: (id: string) => Promise<void>;
  onSelectDiagnosis: (diag: SavedDiagnosis) => void;
  onAddCustomPlant: (plant: Omit<GardenPlant, 'id'>) => Promise<void>;
}

export const GardenTracker: React.FC<GardenTrackerProps> = ({
  garden,
  diagnoses,
  onWaterPlant,
  onDeletePlant,
  onDeleteDiagnosis,
  onSelectDiagnosis,
  onAddCustomPlant,
}) => {
  const [activeTab, setActiveTab] = useState<'plants' | 'diagnoses'>('plants');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantSpecies, setNewPlantSpecies] = useState('');
  const [newPlantFrequency, setNewPlantFrequency] = useState(3);
  const [newPlantLocation, setNewPlantLocation] = useState('Balcony / Garden');

  // Filter garden plants
  const filteredGarden = garden.filter((p) =>
    p.plantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.species && p.species.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter diagnoses
  const filteredDiagnoses = diagnoses.filter((d) =>
    d.plant_info.name_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.plant_info.scientific_name && d.plant_info.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    d.health_status.condition_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;

    await onAddCustomPlant({
      plantName: newPlantName,
      species: newPlantSpecies,
      location: newPlantLocation,
      wateringFrequencyDays: Number(newPlantFrequency) || 3,
      status: 'healthy',
      createdAt: new Date().toISOString(),
      lastWatered: new Date().toISOString(),
      nextWatering: new Date(Date.now() + (Number(newPlantFrequency) || 3) * 24 * 60 * 60 * 1000).toISOString(),
    });

    setNewPlantName('');
    setNewPlantSpecies('');
    setShowAddModal(false);
  };

  // Compute days until next watering
  const getWateringStatus = (nextWateringStr?: string) => {
    if (!nextWateringStr) return { text: 'Needs Water', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    const nextDate = new Date(nextWateringStr);
    const now = new Date();
    const diffHours = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { text: 'Watering Overdue!', color: 'text-rose-800 bg-rose-100 border-rose-300 font-bold' };
    } else if (diffHours <= 24) {
      return { text: 'Water Today', color: 'text-amber-800 bg-amber-100 border-amber-300 font-bold' };
    } else {
      const days = Math.ceil(diffHours / 24);
      return { text: `Water in ${days} days`, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 font-sans text-stone-800 animate-fade-in">
      {/* Bento Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4 border-b border-stone-200 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-emerald-950 tracking-tight">
            VANANSH <span className="text-emerald-700 font-medium text-xl sm:text-3xl">- Garden & Pathology Logs</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-0.5">
            Living Garden Hydration Monitor • Clinical Leaf Prescriptions • History Log
          </p>
        </div>

        <button
          id="btn-add-plant-modal"
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-emerald-900 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Add Plant to Garden</span>
        </button>
      </header>

      {/* Bento Filter & Navigation Pill Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 rounded-3xl border border-stone-200 shadow-xs">
        {/* Toggle between Active Plants & Diagnosis History */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('plants')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs rounded-full font-bold uppercase tracking-wider transition-all min-h-[40px] ${
              activeTab === 'plants'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Garden ({garden.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnoses')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs rounded-full font-bold uppercase tracking-wider transition-all min-h-[40px] ${
              activeTab === 'diagnoses'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>History ({diagnoses.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plants or diseases..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-stone-50 rounded-full border border-stone-200 focus:outline-hidden focus:border-emerald-600 min-h-[40px]"
          />
        </div>
      </div>

      {/* Main Bento Cards Grid */}
      {activeTab === 'plants' ? (
        filteredGarden.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredGarden.map((plant) => {
              const waterStatus = getWateringStatus(plant.nextWatering);
              return (
                <div
                  key={plant.id}
                  id={`garden-plant-${plant.id}`}
                  className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between space-y-3 sm:space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-stone-900 text-base sm:text-xl">
                            {plant.plantName}
                          </h3>
                        </div>
                        {plant.species && (
                          <p className="text-xs text-stone-400 italic font-serif mt-0.5">{plant.species}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeletePlant(plant.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Remove plant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {plant.location && (
                      <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                        📍 {plant.location}
                      </span>
                    )}

                    {/* Water Status Chip */}
                    <div className="space-y-2 pt-2.5 sm:pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500 font-medium flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                          Hydration Status:
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${waterStatus.color}`}>
                          {waterStatus.text}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-500">
                        Last watered:{' '}
                        <strong className="text-stone-700">
                          {plant.lastWatered
                            ? new Date(plant.lastWatered).toLocaleDateString()
                            : 'Not recorded'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Water Now */}
                  <div className="pt-2.5 sm:pt-3 border-t border-stone-100">
                    <button
                      id={`btn-water-${plant.id}`}
                      onClick={() => onWaterPlant(plant.id, plant.wateringFrequencyDays || 3)}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <Droplets className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Log Watered Today</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-dashed border-stone-300 space-y-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">Your Garden is Empty</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Scan a leaf to automatically add diagnosed plants, or manually add your trees and house plants to track watering.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-5 py-2.5 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Plant</span>
            </button>
          </div>
        )
      ) : (
        /* Diagnosis History List */
        filteredDiagnoses.length > 0 ? (
          <div className="space-y-3">
            {filteredDiagnoses.map((diag) => (
              <div
                key={diag.id}
                id={`history-diag-${diag.id}`}
                className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs hover:border-emerald-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {diag.imageUrl ? (
                    <img
                      src={diag.imageUrl}
                      alt={diag.plant_info.name_english}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-stone-200 shrink-0 bg-stone-100"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                      <Leaf className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                  )}

                  <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base truncate">
                        {diag.plant_info.name_english}
                      </h3>
                      {diag.plant_info.scientific_name && (
                        <span className="text-[11px] sm:text-xs text-stone-400 italic truncate">
                          ({diag.plant_info.scientific_name})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          diag.health_status.is_healthy
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {diag.health_status.is_healthy ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{diag.health_status.condition_name}</span>
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-stone-500 text-[10px] sm:text-[11px]">
                        {new Date(diag.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-1 max-w-lg hidden sm:block">
                      {diag.health_status.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <button
                    onClick={() => onSelectDiagnosis(diag)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-stone-900 hover:bg-emerald-900 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-2xs min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prescription</span>
                  </button>

                  <button
                    onClick={() => diag.id && onDeleteDiagnosis(diag.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Delete diagnosis log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-dashed border-stone-300 space-y-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">No Diagnoses Recorded Yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Scan a tree or plant leaf in the Leaf Diagnosis tab to generate clinical reports and pathology history.
            </p>
          </div>
        )
      )}

      {/* Add Custom Plant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-stone-200 space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <span>Add Plant to Garden</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-stone-600 block mb-1">
                  Plant / Tree Common Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  placeholder="e.g. Mango Tree, Holy Basil / Tulsi, Rose"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:outline-hidden focus:border-emerald-600 bg-stone-50 min-h-[44px]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-stone-600 block mb-1">
                  Species / Scientific Name (Optional)
                </label>
                <input
                  type="text"
                  value={newPlantSpecies}
                  onChange={(e) => setNewPlantSpecies(e.target.value)}
                  placeholder="e.g. Mangifera indica, Ocimum tenuiflorum"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:outline-hidden focus:border-emerald-600 bg-stone-50 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-stone-600 block mb-1">
                    Watering (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newPlantFrequency}
                    onChange={(e) => setNewPlantFrequency(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:outline-hidden focus:border-emerald-600 bg-stone-50 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-stone-600 block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newPlantLocation}
                    onChange={(e) => setNewPlantLocation(e.target.value)}
                    placeholder="e.g. Farm, Balcony"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:outline-hidden focus:border-emerald-600 bg-stone-50 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full font-bold uppercase tracking-wider text-[11px] min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-emerald-900 text-white font-bold uppercase tracking-wider text-[11px] rounded-full shadow-xs min-h-[44px]"
                >
                  Save Plant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
