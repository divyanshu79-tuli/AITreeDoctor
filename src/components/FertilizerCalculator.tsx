import React, { useState } from 'react';
import { Calculator, Sprout, Layers, Droplets, CheckCircle, Sparkles, RefreshCw, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface FertilizerCalculatorProps {}

export const FertilizerCalculator: React.FC<FertilizerCalculatorProps> = () => {
  const [plantType, setPlantType] = useState('fruit-tree');
  const [cropName, setCropName] = useState('');
  const [soilType, setSoilType] = useState('Clay Loam');
  const [growthStage, setGrowthStage] = useState('flowering');
  const [plantCount, setPlantCount] = useState(1);
  const [farmingType, setFarmingType] = useState<'organic' | 'mineral'>('organic');
  const [specificSymptoms, setSpecificSymptoms] = useState('');

  // AI Plan Generation State
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Generate customized AI Fertilizer Schedule using Gemini
  const handleGenerateAiPlan = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/fertilizer-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: cropName.trim() || plantType,
          cropCategory: plantType,
          soilType,
          growthStage,
          plantCount,
          farmingType,
          language: 'en',
          specificIssues: specificSymptoms,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate AI fertilizer schedule');
      }

      setAiPlan(data.plan);
    } catch (err: any) {
      console.error('Error generating AI fertilizer plan:', err);
      setAiError(err.message || 'Failed to connect to AI Agronomist');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Fertilizer computation matrix
  const calculateRequirements = () => {
    if (plantType === 'fruit-tree') {
      if (farmingType === 'organic') {
        return {
          primaryType: 'Well-rotted Cow Dung Manure + Vermicompost',
          dosage: `${10 * plantCount} kg to ${15 * plantCount} kg per tree per application`,
          frequency: 'Twice a year (Pre-monsoon June and Post-monsoon October)',
          method: 'Dig a ring trench 3-4 feet away from the tree trunk along the drip line, apply manure, mix with soil and irrigate immediately.',
          booster: 'Jeevamrut: 5-10 Liters drenching per tree every 15 days.',
          foliar: 'Sour buttermilk + Neem oil spray (5ml/L) for pest immunity.',
        };
      } else {
        return {
          primaryType: 'NPK 19-19-19 / NPK 12-32-16 + Zinc Sulphate',
          dosage: `${500 * plantCount}g to ${800 * plantCount}g per mature tree`,
          frequency: 'Monthly during active growth and fruit development',
          method: 'Apply in circular band around canopy periphery; do not touch tree trunk directly.',
          booster: 'Micronutrient grade IV foliar spray (2.5g/L) during flower flush.',
          foliar: '0:52:34 (Monopotassium phosphate) @ 5g/L to prevent fruit drop.',
        };
      }
    } else if (plantType === 'cash-crop') {
      if (farmingType === 'organic') {
        return {
          primaryType: 'Vermicompost + Neem Cake + Trichoderma',
          dosage: `${150 * plantCount}g to ${250 * plantCount}g per plant`,
          frequency: 'Every 20 days during vegetative and flowering stage',
          method: 'Side dressing along rows 4 inches away from roots followed by light earthing up.',
          booster: 'Jeevamrut / Waste Decomposer liquid in drip irrigation @ 200 L/Acre.',
          foliar: 'Dashparni Ark 200ml per 15L pump for sucking pests.',
        };
      } else {
        return {
          primaryType: 'DAP (18-46-0) + MOP (Potash) + Urea Split',
          dosage: `${30 * plantCount}g to ${50 * plantCount}g per plant per split`,
          frequency: 'Split into 3 stages: Basal (at sowing), 30 days, and 60 days',
          method: 'Placement at 5cm depth alongside root zone.',
          booster: 'Foliar spray of 13-0-45 (Potassium Nitrate) @ 10g/L during boll/grain filling.',
          foliar: 'Chelated Zinc (EDTA 12%) @ 1g/L for yellowing recovery.',
        };
      }
    } else if (plantType === 'vegetable') {
      if (farmingType === 'organic') {
        return {
          primaryType: 'Enriched Vermicompost + Wood Ash + Mustard Cake',
          dosage: `${100 * plantCount}g to ${150 * plantCount}g per vegetable plant`,
          frequency: 'Every 15-20 days',
          method: 'Mix gently with upper 2 inches of topsoil without disturbing fine feeder roots.',
          booster: 'Panchagavya 3% foliar spray every 10 days for vigorous flowering.',
          foliar: 'Neem seed kernel extract (NSKE 5%) or 10,000 PPM Neem oil @ 2ml/L.',
        };
      } else {
        return {
          primaryType: 'NPK 19-19-19 water soluble + Calcium Nitrate + Boron',
          dosage: `${5 * plantCount}g dissolved in water per plant`,
          frequency: 'Weekly via fertigation / drenching',
          method: 'Dissolve in irrigation water and apply directly to moist root zone.',
          booster: 'Boron 20% @ 1g/L spray to prevent blossom end rot and fruit cracking.',
          foliar: '0:0:50 (Potassium Sulphate) during fruit sizing.',
        };
      }
    } else {
      // House / Medicinal (Tulsi, Rose, Neem)
      return {
        primaryType: 'Organic Vermicompost + Steamed Bone Meal / Mustard Cake Powder',
        dosage: `${50 * plantCount}g to ${100 * plantCount}g per pot (8-12 inch pot)`,
        frequency: 'Once a month',
        method: 'Loosen top 1 inch of soil, scatter evenly around the rim, water immediately.',
        booster: 'Epsom Salt (Magnesium Sulphate): 1 teaspoon in 1 liter water every month for glossy green leaves.',
        foliar: 'Diluted seaweed extract (1ml/L) monthly.',
      };
    }
  };

  const results = calculateRequirements();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 font-sans text-stone-800 animate-fade-in">
      {/* Bento Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4 border-b border-stone-200 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-emerald-950 tracking-tight">
            VANANSH <span className="text-emerald-700 font-medium text-xl sm:text-3xl">- Fertilizer & Nutrition Calculator</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-0.5">
            Agro-Botanical Precision Dosages • Gemini Soil Intelligence • Organic (Jeevamrut / Vermicompost) & NPK Balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-200 min-h-[36px] flex items-center">
            Gemini Agronomy Matrix
          </span>
        </div>
      </header>

      {/* Input Form Controls Bento Tile */}
      <div className="bg-white rounded-3xl p-4 sm:p-7 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Calculator className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-xs font-black uppercase text-stone-400 tracking-widest">
              Crop & Soil Parameters
            </span>
          </div>

          <button
            type="button"
            id="btn-generate-ai-fertilizer"
            onClick={handleGenerateAiPlan}
            disabled={isGeneratingAi}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 disabled:opacity-40 min-h-[44px]"
          >
            {isGeneratingAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                <span>Generating AI Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>AI Customized Prescription</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Specific Crop Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Specific Plant / Tree Name
            </label>
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Mango, Cotton, Tomato..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-600 min-h-[44px]"
            />
          </div>

          {/* Plant Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Category
            </label>
            <select
              value={plantType}
              onChange={(e) => setPlantType(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-600 min-h-[44px]"
            >
              <option value="fruit-tree">Fruit Tree (Mango, Guava, Citrus)</option>
              <option value="cash-crop">Cash Crop (Cotton, Wheat, Groundnut)</option>
              <option value="vegetable">Vegetables (Tomato, Chili, Okra)</option>
              <option value="house-plant">House / Medicinal (Tulsi, Rose, Neem)</option>
            </select>
          </div>

          {/* Growth Stage */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Growth Stage
            </label>
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-600 min-h-[44px]"
            >
              <option value="sapling">Young Sapling / Nursery Stage</option>
              <option value="vegetative">Vegetative Growth / Branching</option>
              <option value="flowering">Flowering & Fruit Setting</option>
              <option value="mature">Full Mature Tree / Harvesting</option>
            </select>
          </div>

          {/* Plant Count */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Number of Trees / Plants
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={plantCount}
              onChange={(e) => setPlantCount(Math.max(1, Number(e.target.value)))}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-600 min-h-[44px]"
            />
          </div>
        </div>

        {/* Secondary Parameters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-stone-100">
          {/* Soil Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Soil Type
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-600 min-h-[44px]"
            >
              <option value="Black Clay Loam">Black Clay Loam</option>
              <option value="Sandy Loam">Sandy Loam</option>
              <option value="Red / Laterite">Red / Laterite</option>
              <option value="Potting Mix">Potting Soil / Cocopeat Mix</option>
            </select>
          </div>

          {/* Farming Style */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Farming Method
            </label>
            <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 min-h-[44px]">
              <button
                type="button"
                onClick={() => setFarmingType('organic')}
                className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center ${
                  farmingType === 'organic'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Organic
              </button>
              <button
                type="button"
                onClick={() => setFarmingType('mineral')}
                className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center ${
                  farmingType === 'mineral'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Integrated
              </button>
            </div>
          </div>

          {/* Specific Observation */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Observed Symptoms (Optional)
            </label>
            <input
              type="text"
              value={specificSymptoms}
              onChange={(e) => setSpecificSymptoms(e.target.value)}
              placeholder="e.g. Leaf yellowing, fruit dropping..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-600 min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* AI Generated Soil & Nutrition Plan Section */}
      {aiPlan && (
        <div className="bg-emerald-950 text-emerald-50 rounded-3xl p-4 sm:p-7 border border-emerald-800 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm sm:text-lg font-serif font-bold text-white">
                Dr. Vriksha Tailored Soil & Fertilizer Protocol
              </h3>
            </div>
            <button
              onClick={() => setAiPlan(null)}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-emerald-100 text-xs sm:text-sm leading-relaxed space-y-2">
            <ReactMarkdown>{aiPlan}</ReactMarkdown>
          </div>
        </div>
      )}

      {aiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-900 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Standard Prescription Output Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Main Bento Tile (col-span-12) */}
        <div className="col-span-12 bg-white rounded-3xl border border-stone-200 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Standard Matrix Dosage
              </span>
              <h2 className="text-lg sm:text-2xl font-serif font-bold text-emerald-950 mt-1.5 sm:mt-2">
                {results.primaryType}
              </h2>
            </div>

            <div className="text-left sm:text-right bg-stone-50 p-2.5 sm:p-3 rounded-2xl border border-stone-100 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Batch Scale</span>
              <p className="text-xs sm:text-sm font-bold text-stone-900">
                {plantCount} {plantCount === 1 ? 'Plant / Tree' : 'Plants / Trees'}
              </p>
            </div>
          </div>

          {/* 3-Column Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            <div className="bg-stone-50 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Recommended Quantity</span>
              </div>
              <p className="text-stone-900 font-bold text-sm sm:text-base leading-tight">{results.dosage}</p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                <Sprout className="w-3.5 h-3.5" />
                <span>Application Frequency</span>
              </div>
              <p className="text-stone-800 font-semibold text-xs sm:text-sm">{results.frequency}</p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                <Droplets className="w-3.5 h-3.5" />
                <span>Micro-Nutrient Booster</span>
              </div>
              <p className="text-stone-800 font-semibold text-xs sm:text-sm">{results.booster}</p>
            </div>
          </div>

          {/* Soil & Foliar Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs pt-1">
            <div className="bg-[#e9edc9] rounded-2xl p-3.5 sm:p-4 border border-[#ccd5ae] space-y-1">
              <h4 className="font-bold text-[#283618] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#606c38]" />
                <span>Soil Ring Application Method:</span>
              </h4>
              <p className="text-[#606c38] text-xs leading-relaxed">{results.method}</p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3.5 sm:p-4 border border-amber-200 space-y-1">
              <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Foliar Canopy Spray Advice:</span>
              </h4>
              <p className="text-amber-900 text-xs leading-relaxed">{results.foliar}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

