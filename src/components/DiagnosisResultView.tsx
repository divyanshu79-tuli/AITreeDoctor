import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Droplets, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Printer, 
  Code, 
  PlusCircle, 
  MessageSquare, 
  ArrowLeft,
  Check,
  Copy,
  Layers,
  Sprout
} from 'lucide-react';
import { DiagnosisResponse } from '../types';
import confetti from 'canvas-confetti';

interface DiagnosisResultViewProps {
  diagnosis: DiagnosisResponse;
  imageSrc: string;
  onSaveToGarden: (diagnosis: DiagnosisResponse) => Promise<void>;
  onAskChatbot: (plantName: string, condition: string, symptoms: string[]) => void;
  onNewScan: () => void;
}

export const DiagnosisResultView: React.FC<DiagnosisResultViewProps> = ({
  diagnosis,
  imageSrc,
  onSaveToGarden,
  onAskChatbot,
  onNewScan,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { plant_info, health_status, water_requirement, fertilizer_requirement, care_and_treatment } = diagnosis;

  // Toggle step completion
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      if (next.length === care_and_treatment.length && care_and_treatment.length > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      return next;
    });
  };

  // Text to Speech playback
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    const textToRead = `${plant_info.name_english}. Scientific name: ${plant_info.scientific_name}. Health status: ${
      health_status.is_healthy ? 'Healthy' : health_status.condition_name
    }. ${health_status.description}. Water requirement: ${water_requirement.frequency}, ${
      water_requirement.instructions
    }. Fertilizer: ${fertilizer_requirement.recommended_type}, dosage: ${
      fertilizer_requirement.dosage_and_frequency
    }. Treatment steps: ${care_and_treatment.join('. ')}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Save to Garden
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveToGarden(diagnosis);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Raw JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(diagnosis, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Print Prescription
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col font-sans text-stone-800 animate-fade-in space-y-4 sm:space-y-6">
      {/* Bento Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4 border-b border-stone-200 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-emerald-950 tracking-tight">
              VANANSH <span className="text-emerald-700 font-medium text-xl sm:text-3xl">- Diagnosis Report</span>
            </h1>
          </div>
          <p className="text-stone-500 font-medium text-xs sm:text-sm">
            Botanical Pathology Report • VANANSH AI Precision Prescription
          </p>
        </div>

        {/* Header Action Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-1.5 min-h-[36px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Scan Complete</span>
          </div>

          <button
            id="btn-new-analysis"
            onClick={onNewScan}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>

          {/* Audio Readout */}
          <button
            id="btn-audio-readout"
            onClick={toggleSpeech}
            className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full border transition-all flex items-center gap-1.5 min-h-[36px] ${
              isSpeaking
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
            title="Listen to Botanical Prescription"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Audio'}</span>
          </button>

          {/* Print / PDF */}
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-full transition-colors flex items-center gap-1.5 min-h-[36px]"
            title="Print Prescription Report"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>PDF</span>
          </button>

          {/* JSON Schema Modal Toggle */}
          <button
            id="btn-toggle-json"
            onClick={() => setShowRawJson(!showRawJson)}
            className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full border transition-colors flex items-center gap-1 min-h-[36px] ${
              showRawJson
                ? 'bg-emerald-900 text-white border-emerald-900'
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          {/* Save to Garden */}
          <button
            id="btn-save-to-garden"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-3.5 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 shadow-xs min-h-[36px] ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#606c38] hover:bg-[#283618] text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save to Garden'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Raw JSON Inspector Modal */}
      {showRawJson && (
        <div className="bg-stone-900 text-emerald-400 p-4 sm:p-5 rounded-3xl border border-stone-800 shadow-xl relative text-xs font-mono overflow-x-auto">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800 text-stone-400">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">Valid JSON Output Schema</span>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 text-xs text-stone-300 hover:text-white bg-stone-800 px-3 py-1 rounded-full font-sans font-bold uppercase tracking-wider min-h-[32px]"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre>{JSON.stringify(diagnosis, null, 2)}</pre>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Bento Tile 1: Uploaded Sample Image (col-span-4) */}
        <div className="col-span-12 md:col-span-4 bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 relative group min-h-[220px] sm:min-h-[280px] flex flex-col justify-end shadow-xs">
          <img
            src={imageSrc}
            alt={plant_info.name_english}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 m-3 sm:m-4 bg-white/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/60 shadow-xs">
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-0.5">
              Uploaded Sample
            </div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">
              {plant_info.name_english}_Leaf.jpg
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Plant Overview & Pathology (col-span-5) */}
        <div className="col-span-12 md:col-span-5 bg-white rounded-3xl border border-emerald-100/80 shadow-xs p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
              <div>
                <h2 className="text-xl sm:text-3xl font-serif font-bold text-emerald-950 leading-tight">
                  {plant_info.name_english}
                </h2>
                <p className="text-emerald-800 font-medium italic text-xs sm:text-sm mt-0.5 font-serif">
                  {plant_info.scientific_name}
                </p>
              </div>
              <div
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight shrink-0 ${
                  health_status.is_healthy
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}
              >
                {health_status.is_healthy ? 'Healthy Foliage' : 'Action Required'}
              </div>
            </div>

            {/* Disease condition info */}
            <div className="border-t border-stone-100 pt-3 sm:pt-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    health_status.is_healthy ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'
                  }`}
                />
                <h3 className="text-base sm:text-xl font-bold text-stone-900">
                  {health_status.condition_name}
                </h3>
              </div>
              <p className="text-stone-600 leading-relaxed text-xs sm:text-sm">
                {health_status.description}
              </p>
            </div>
          </div>

          {/* Observed Symptoms */}
          {health_status.symptoms && health_status.symptoms.length > 0 && (
            <div className="pt-3 border-t border-stone-100">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                Observed Symptoms
              </div>
              <div className="flex flex-wrap gap-1.5">
                {health_status.symptoms.map((symptom, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium border border-stone-200/60"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bento Tile 3: Hydration Plan (col-span-3) */}
        <div className="col-span-12 md:col-span-3 bg-emerald-900 text-emerald-50 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-md border border-emerald-800">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3 opacity-80">
              <Droplets className="w-4 h-4 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hydration Plan</span>
            </div>
            <div className="text-2xl sm:text-4xl font-serif font-bold text-white mb-1 leading-tight">
              {water_requirement.frequency}
            </div>
            <div className="text-emerald-300 text-xs font-medium">
              Target Quantity: {water_requirement.quantity}
            </div>
          </div>

          <div className="bg-emerald-800/60 p-3.5 sm:p-4 rounded-2xl border border-emerald-700/60 mt-3 sm:mt-4">
            <div className="text-[10px] font-bold uppercase text-emerald-400 mb-1 tracking-wider">
              Watering Instructions
            </div>
            <p className="text-xs sm:text-sm leading-snug text-emerald-100">
              {water_requirement.instructions}
            </p>
          </div>
        </div>

        {/* Bento Tile 4: Fertilizer Guide (col-span-4) */}
        <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 sm:p-2 bg-lime-100 text-lime-800 rounded-xl">
                <Sprout className="w-4 h-4 text-[#606c38]" />
              </div>
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
                Fertilizer Guide
              </span>
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="text-base sm:text-lg font-bold text-stone-900">
                {fertilizer_requirement.recommended_type}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                Nutrient Balance & Soil Feeder
              </div>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex justify-between items-center text-xs sm:text-sm border-b border-stone-100 pb-2">
                <span className="text-stone-500 font-medium">Frequency & Dose</span>
                <span className="font-bold text-stone-800 text-right max-w-[170px] truncate">
                  {fertilizer_requirement.dosage_and_frequency}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm border-b border-stone-100 pb-2">
                <span className="text-stone-500 font-medium">Application Method</span>
                <span className="font-bold text-stone-800 text-right max-w-[170px] truncate">
                  {fertilizer_requirement.application_method}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 sm:mt-4 text-[11px] text-stone-400 leading-tight italic">
            *Apply around the drip line circle and mix gently with topsoil before watering.
          </p>
        </div>

        {/* Bento Tile 5: Care & Treatment Steps (col-span-8) */}
        <div className="col-span-12 md:col-span-8 bg-[#e9edc9] rounded-3xl border border-[#ccd5ae] p-4 sm:p-7 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="text-[11px] sm:text-xs font-black uppercase text-[#606c38] tracking-widest">
              Care & Treatment Steps
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#283618] bg-white/70 px-2.5 sm:px-3 py-1 rounded-full border border-[#ccd5ae]">
              {completedSteps.length} of {care_and_treatment.length} Done
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-grow">
            {care_and_treatment.map((step, idx) => {
              const isDone = completedSteps.includes(idx);
              const stepNumber = String(idx + 1).padStart(2, '0');

              return (
                <div
                  key={idx}
                  id={`care-step-${idx}`}
                  onClick={() => toggleStep(idx)}
                  className={`flex gap-3 p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all border min-h-[44px] ${
                    isDone
                      ? 'bg-white/40 border-[#606c38]/40 opacity-70'
                      : 'bg-white/90 hover:bg-white border-[#ccd5ae] shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#606c38] text-white'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[#283618] mb-0.5 sm:mb-1">
                      Step {idx + 1}
                    </div>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isDone ? 'line-through text-stone-500' : 'text-[#606c38]'
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Tile 6: Doctor Consultation Bar (col-span-12) */}
        <div className="col-span-12 bg-stone-900 text-white rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-stone-800 shadow-md">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-800 flex items-center justify-center shrink-0 border border-emerald-700">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-lg text-white">
                Consult Dr. Vriksha for Custom Organic Recipes
              </h4>
              <p className="text-xs text-stone-400 mt-0.5">
                Need organic bio-fungicide ratios, neem oil preparation, or soil pH test guidance?
              </p>
            </div>
          </div>

          <button
            id="btn-ask-botanist-prescript"
            onClick={() =>
              onAskChatbot(
                plant_info.name_english,
                health_status.condition_name,
                health_status.symptoms || []
              )
            }
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-full text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 shadow-sm min-h-[44px]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Tree Doctor</span>
          </button>
        </div>
      </div>

      {/* Bento Footer */}
      <footer className="mt-2 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-[0.15em] text-center sm:text-left">
        <div>VANANSH AI Tree Doctor • Diagnostic Prescription</div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="text-stone-500">Clinical Botanical Diagnosis</span>
          <span>•</span>
          <span className="text-emerald-700 cursor-pointer min-h-[32px] flex items-center" onClick={handlePrint}>Export PDF Report</span>
        </div>
      </footer>
    </div>
  );
};
