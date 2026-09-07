import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Leaf, 
  Sparkles, 
  RefreshCw, 
  X, 
  AlertCircle, 
  Image as ImageIcon,
  HelpCircle,
  Sliders,
  Brain,
  Zap,
  Globe
} from 'lucide-react';
import { SAMPLE_LEAVES, SampleLeaf } from '../data/sampleLeaves';
import { DiagnosisResponse } from '../types';

interface LeafScannerProps {
  onDiagnoseComplete: (data: DiagnosisResponse, imageSrc: string, notes?: string) => void;
}

export const LeafScanner: React.FC<LeafScannerProps> = ({
  onDiagnoseComplete,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticMode, setDiagnosticMode] = useState<'fast' | 'general' | 'deep_thinking'>('general');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedSample, setSelectedSample] = useState<SampleLeaf | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage(
        'Could not access camera. Please allow camera permissions or upload an image from file.'
      );
      setIsCameraActive(false);
    }
  };

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setSelectedSample(null);
      stopCamera();
    }
  };

  // Switch camera
  const toggleCameraFacing = () => {
    setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPEG, WEBP).');
      return;
    }
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
            setSelectedImage(optimizedBase64);
            setSelectedSample(null);
            return;
          }
        }
        setSelectedImage(dataUrl);
        setSelectedSample(null);
      };
      img.onerror = () => {
        setSelectedImage(dataUrl);
        setSelectedSample(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Select pre-loaded sample
  const handleSelectSample = async (sample: SampleLeaf) => {
    setSelectedSample(sample);
    setSelectedImage(sample.imageUrl);
    setErrorMessage(null);
  };

  // Trigger Gemini Analysis API
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage('Please upload a leaf photo, take a picture, or select a sample.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let base64Payload = selectedImage;
      if (selectedImage.startsWith('http')) {
        try {
          const res = await fetch(selectedImage);
          const blob = await res.blob();
          base64Payload = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Failed to fetch remote sample, sending original link data');
        }
      }

      const response = await fetch('/api/analyze-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Payload,
          mimeType: 'image/jpeg',
          languagePreference: 'en',
          additionalNotes,
          mode: diagnosticMode,
        }),
      });

      const jsonResult = await response.json();

      if (!response.ok || !jsonResult.success) {
        throw new Error(jsonResult.error || 'Failed to complete botanical analysis.');
      }

      onDiagnoseComplete(jsonResult.data, selectedImage, additionalNotes);
    } catch (err: any) {
      console.error('Diagnosis request error:', err);
      setErrorMessage(err.message || 'Server error while diagnosing plant leaf.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 font-sans text-stone-800 animate-fade-in">
      {/* Top Bento Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-4 border-b border-stone-200 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-emerald-950 tracking-tight">
            VANANSH <span className="text-emerald-700 font-medium text-xl sm:text-3xl">- AI Tree Doctor</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
            Leaf Pathology & Botanical Health Diagnostic Lab
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 w-full md:w-auto">
          {/* Diagnostic Mode Selector */}
          <div className="flex flex-wrap sm:inline-flex p-1 bg-stone-100 border border-stone-200 rounded-2xl text-[11px] sm:text-xs font-semibold gap-1 sm:gap-0 w-full sm:w-auto">
            <button
              type="button"
              id="diag-mode-general"
              onClick={() => setDiagnosticMode('general')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
                diagnosticMode === 'general'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Standard Diagnosis with gemini-3.5-flash"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Standard (3.5 Flash)</span>
            </button>

            <button
              type="button"
              id="diag-mode-deep"
              onClick={() => setDiagnosticMode('deep_thinking')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
                diagnosticMode === 'deep_thinking'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="High Thinking Reasoning with gemini-3.1-pro-preview"
            >
              <Brain className="w-3.5 h-3.5 shrink-0" />
              <span>Deep Thinking (3.1 Pro)</span>
            </button>

            <button
              type="button"
              id="diag-mode-fast"
              onClick={() => setDiagnosticMode('fast')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all min-h-[36px] ${
                diagnosticMode === 'fast'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Quick Scan with gemini-3.1-flash-lite"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Fast (3.1 Lite)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Bento Hero Card (col-span-12) */}
        <div className="lg:col-span-12 bg-emerald-900 text-emerald-50 rounded-3xl p-4 sm:p-8 shadow-md border border-emerald-800 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1.5 sm:mb-2">
              {diagnosticMode === 'deep_thinking'
                ? 'Gemini 3.1 Pro High Thinking • Deep Agro-Pathology Reasoning'
                : diagnosticMode === 'fast'
                ? 'Gemini 3.1 Flash Lite • Instant Vision Diagnosis'
                : 'Gemini 3.5 Flash • Standard Botanical Vision'}
            </div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-white leading-tight">
              Diagnose Leaf Pathology, Nutrient Deficiencies & Fungi
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
              Upload or capture a leaf photo. Get instant botanical identification, disease pathology, precise watering cycles, organic fertilizer recipes (Jeevamrut / Vermicompost), and step-by-step care.
            </p>
          </div>

          <div className="relative z-10 mt-4 sm:mt-6 flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs text-emerald-200">
            <span className="px-2.5 sm:px-3 py-1 bg-emerald-800/80 rounded-full border border-emerald-700/80 font-medium">
              ✓ Botanical Species & Identification
            </span>
            <span className="px-2.5 sm:px-3 py-1 bg-emerald-800/80 rounded-full border border-emerald-700/80 font-medium">
              ✓ Hydration & Fertilizer Dosing
            </span>
            <span className="px-2.5 sm:px-3 py-1 bg-emerald-800/80 rounded-full border border-emerald-700/80 font-medium">
              ✓ Step-by-Step Treatment Checklist
            </span>
          </div>
        </div>

        {/* Bento Tile: Image Scanner & Camera Workspace (col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Leaf className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-[11px] sm:text-xs font-black uppercase text-stone-400 tracking-widest">
                  Leaf Photography Workspace
                </span>
              </div>

              {selectedImage && (
                <button
                  id="btn-clear-image"
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedSample(null);
                    stopCamera();
                  }}
                  className="text-xs text-stone-500 hover:text-rose-600 flex items-center gap-1 font-bold uppercase tracking-wider transition-colors min-h-[36px] px-2"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <p className="font-bold text-amber-950">Diagnostic System Notice</p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-retry-diagnosis"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="shrink-0 px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-full font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs min-h-[36px]"
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Retry Now</span>
                </button>
              </div>
            )}

            {/* Live Camera / Selected Image / Dropzone View */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-emerald-600 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-52 sm:w-56 sm:h-64 border-2 border-dashed border-emerald-400/80 rounded-full opacity-80 flex items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-black/60 px-2.5 py-1 rounded-full">
                      Align leaf in center
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex items-center justify-center gap-2 sm:gap-3 px-3">
                  <button
                    id="btn-flip-camera"
                    onClick={toggleCameraFacing}
                    type="button"
                    className="p-3 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-md transition-transform active:scale-95 shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-capture-leaf-photo"
                    onClick={capturePhoto}
                    type="button"
                    className="px-4 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95 text-xs uppercase tracking-wider min-h-[44px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Leaf</span>
                  </button>

                  <button
                    id="btn-cancel-camera"
                    onClick={stopCamera}
                    type="button"
                    className="p-3 bg-rose-600/80 hover:bg-rose-700 text-white rounded-full backdrop-blur-md transition-transform active:scale-95 shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Cancel camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative rounded-2xl overflow-hidden bg-stone-900 aspect-4/3 flex items-center justify-center group shadow-xs">
                <img
                  src={selectedImage}
                  alt="Selected Leaf"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 sm:opacity-0 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3 p-3">
                  <button
                    id="btn-retake-photo"
                    onClick={startCamera}
                    className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-900 rounded-full text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Retake</span>
                  </button>
                  <button
                    id="btn-change-file"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-900 rounded-full text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Upload New</span>
                  </button>
                </div>

                {selectedSample && (
                  <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-white text-[11px] sm:text-xs font-medium">
                    <span className="text-emerald-400 font-bold">Sample:</span> {selectedSample.name}
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center transition-all flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] ${
                  dragOver
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-stone-300 hover:border-emerald-400 bg-stone-50/60'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5 sm:mb-3">
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  Drop leaf photo or capture live
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
                  Supports High-Res JPG, PNG, WEBP of upper/lower leaf surfaces, stem, or plant canopy.
                </p>

                <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full">
                  <button
                    id="btn-open-camera"
                    onClick={startCamera}
                    type="button"
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 min-h-[44px]"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Live Camera</span>
                  </button>

                  <button
                    id="btn-browse-file"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 min-h-[44px]"
                  >
                    <Upload className="w-3.5 h-3.5 text-stone-500" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Field Notes Input */}
            <div className="mt-4 pt-3 sm:pt-4 border-t border-stone-100 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-stone-400" />
                <span>Field Observations & Symptoms (Optional)</span>
              </label>
              <input
                type="text"
                id="input-leaf-notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Yellow veins on young leaves, indoor potted plant, outdoor orchard..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-emerald-600 bg-stone-50/80 min-h-[42px]"
              />
            </div>
          </div>

          {/* Diagnosis Action Button */}
          <div className="mt-4 sm:mt-5">
            <button
              id="btn-run-diagnosis"
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!selectedImage && !isCameraActive)}
              className="w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-stone-900 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                  <span className="text-center">
                    {diagnosticMode === 'deep_thinking'
                      ? 'Performing Deep High-Thinking Pathology with Gemini 3.1 Pro...'
                      : 'Analyzing Leaf Pathology & Prescribing...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-center">
                    {diagnosticMode === 'deep_thinking'
                      ? 'Run Deep High-Thinking Diagnosis'
                      : 'Run Full Agro-Botanical Diagnosis'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bento Right Column: Sample Leaf Library & Photography Guide (col-span-5) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Sample Gallery Bento Tile */}
          <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-xs flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-lime-100 text-lime-800 rounded-xl">
                  <ImageIcon className="w-4 h-4 text-[#606c38]" />
                </div>
                <span className="text-[11px] sm:text-xs font-black uppercase text-stone-400 tracking-widest">
                  1-Click Sample Library
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                6 Verified Cases
              </span>
            </div>

            <p className="text-xs text-stone-500 mb-3 leading-relaxed">
              Click any verified crop sample to test diagnosis instantly:
            </p>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {SAMPLE_LEAVES.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <div
                    key={sample.id}
                    id={`sample-leaf-${sample.id}`}
                    onClick={() => handleSelectSample(sample)}
                    className={`cursor-pointer rounded-2xl border p-2 sm:p-2.5 transition-all text-left group min-h-[44px] ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-50/70 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white active:bg-stone-50'
                    }`}
                  >
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-1.5 sm:mb-2 bg-stone-100">
                      <img
                        src={sample.imageUrl}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute top-1 right-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                        {sample.category}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {sample.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-emerald-800 font-medium truncate">
                        {sample.condition}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botanical Best Practice Bento Tile */}
          <div className="bg-[#e9edc9] rounded-3xl border border-[#ccd5ae] p-4 sm:p-6 shadow-xs">
            <div className="text-[10px] font-black uppercase text-[#606c38] tracking-widest mb-2.5 sm:mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#606c38]" />
              <span>Photography Best Practice Guidelines</span>
            </div>
            <ul className="text-xs text-[#283618] space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#606c38]">01.</span>
                <span><strong>Natural Daylight:</strong> Captures true chlorophyll discoloration and leaf fungal spores.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#606c38]">02.</span>
                <span><strong>Both Leaf Surfaces:</strong> Check leaf undersides for aphid colonies and rust pustules.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#606c38]">03.</span>
                <span><strong>Detailed Guidance:</strong> Full botanical prescriptions with organic recipes generated instantly.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

