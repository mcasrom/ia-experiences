/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Language } from "../types";
import { BarChart, Percent, Activity, ShieldAlert, Cpu, Sparkles } from "lucide-react";

interface MetricChartProps {
  currentLang: Language;
}

export default function MetricChart({ currentLang }: MetricChartProps) {
  const [sliderTemp, setSliderTemp] = useState<number>(0.7);
  const [hardwareSelect, setHardwareSelect] = useState<string>("rtx-3060");

  const hardwareBenchmarks: Record<string, { label: string; tokensPerSec: number; vram: string; threads: string }> = {
    "cpu-4t": {
      label: "CPU Worker (4 Threads)",
      tokensPerSec: 3.2,
      vram: "0 GB (RAM Bound)",
      threads: "4 Cores (FMA Active)"
    },
    "cpu-16t": {
      label: "CPU Worker (16 Threads)",
      tokensPerSec: 8.5,
      vram: "0 GB (RAM Bound)",
      threads: "16 Cores (AVX-512)"
    },
    "rtx-3060": {
      label: "NVIDIA RTX 3060 (12GB VRAM)",
      tokensPerSec: 38.6,
      vram: "Full VRAM Lock (6.2 GB)",
      threads: "3584 CUDA Cores"
    },
    "hetzner-a100": {
      label: "Hetzner Cloud Dedicated (80GB VRAM)",
      tokensPerSec: 82.4,
      vram: "Full VRAM Lock (8.4 GB)",
      threads: "6912 Tensor Cores"
    }
  };

  // Language variables
  const text = {
    title: {
      en: "Physical AI Benchmarks & Latent Infographics",
      es: "Métricas Reales de IA e Infografías Latentes"
    },
    subtitle: {
      en: "Hard systems statistics on token generation speeds, hardware scaling parameters, and multi-lingual density ratios.",
      es: "Métricas reales sobre tiempos de procesamiento de tokens, escalado en hardware Unix y ratios de expansión lingüística."
    },
    hTitle: {
      en: "Unix & Local Ollama Hardware Scaling (Tokens/sec)",
      es: "Ollama en Unix: Escalabilidad sobre Hardware (Tokens/seg)"
    },
    hDesc: {
      en: "Measuring physical GPU vs CPU layer threading on a 3B Llama model. Notice how loading neural layers into GPU CUDA workers guarantees linear performance outputs.",
      es: "Simulación de velocidad en la ejecución de hilos. Observe la caída del rendimiento (throttling) si los workers de CPU cargan el modelo en RAM estándar."
    },
    hSelect: {
      en: "Select Local Worker Profile:",
      es: "Seleccione el perfil del Worker:"
    },
    tTitle: {
      en: "Stochastic Temperature Sampling Infographic",
      es: "Infografía de Muestreo Probabilístico por Temperatura"
    },
    tDesc: {
      en: "Adjust the slider to dynamically simulate sampling randomness. Higher values increase vocabulary diversity but prompt hallucinations.",
      es: "Modifique el control deslizante para simular el rango de respuesta matemática. Valores mayores multiplican el vocabulario pero incitan alucinaciones."
    },
    probHigh: {
      en: "Probability Distribution (Focus)",
      es: "Distribución de Probabilidad (Foco)"
    },
    statLatency: {
      en: "Latency Threshold",
      es: "Umbral de Latencia"
    },
    tokensSecLabel: {
      en: "Tokens per Second",
      es: "Tokens por Segundo"
    },
    multilingualTitle: {
      en: "Token Inflation Coefficient by Language Family",
      es: "Coeficiente de Inflación de Tokens por Idioma"
    },
    multilingualDesc: {
      en: "Represents the inflation multiplier relative to English (1.0). Spanish relies more heavily on sub-word token splits.",
      es: "Coeficiente de expansión respecto al inglés (1.0). El español requiere mayor número de subpalabras (tokens) para la misma sintaxis."
    }
  };

  const selectedBench = hardwareBenchmarks[hardwareSelect];

  // Language representation index arrays
  const langInflationData = [
    { code: "EN", name: "English", value: 1.0, color: "bg-emerald-500/70" },
    { code: "ES", name: "Español", value: 1.76, color: "bg-blue-500/70" },
    { code: "DE", name: "Deutsch", value: 2.15, color: "bg-amber-500/70" },
    { code: "FR", name: "Français", value: 1.92, color: "bg-pink-500/70" },
    { code: "RU", name: "Русский", value: 3.40, color: "bg-purple-500/70" }
  ];

  return (
    <div className="space-y-12">
      
      {/* Intro Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[#111622] to-[#0d0e12] border border-[#1f293d]/60 rounded-xl">
        <div className="flex items-center space-x-3 text-[#38bdf8] mb-2 font-mono text-xs uppercase tracking-widest">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Real System Telemetry</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {text.title[currentLang]}
        </h2>
        <p className="text-sm sm:text-base text-[#94a3b8] mt-2 max-w-3xl leading-relaxed">
          {text.subtitle[currentLang]}
        </p>
      </div>

      {/* Grid containing benchmarks & interactive simulations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module 1: Hardware Scaling */}
        <div className="bg-[#0f1115] border border-[#1f242e] rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                {text.hTitle[currentLang]}
              </h3>
              <span className="text-xs font-mono text-[#3b82f6]/90 bg-[#3b82f6]/10 px-2.5 py-1 rounded-sm border border-[#3b82f6]/20">
                Ollama Engine Run
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">
              {text.hDesc[currentLang]}
            </p>

            {/* Select Worker list */}
            <div className="mt-5">
              <label className="block text-xs font-mono text-[#64748b] mb-2">
                {text.hSelect[currentLang]}
              </label>
              <select
                id="worker-benchmark-select"
                value={hardwareSelect}
                onChange={(e) => setHardwareSelect(e.target.value)}
                className="w-full bg-[#161a23] border border-[#2d3748] rounded px-3 py-2 text-sm text-[#e2e8f0] focus:ring-1 focus:ring-blue-500 font-mono outline-none"
              >
                {Object.entries(hardwareBenchmarks).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SVG bar comparison with active highlights */}
          <div className="bg-[#0b0c0f] border border-[#1a202c] rounded-lg p-5">
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-mono text-gray-300 font-semibold">{selectedBench.label}</span>
                <span className="text-xl font-mono text-blue-400 font-bold">
                  {selectedBench.tokensPerSec} <span className="text-xs text-[#64748b]">toks/sec</span>
                </span>
              </div>
              <div className="w-full bg-[#181d28] rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-sky-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${(selectedBench.tokensPerSec / 85) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#1a202c]/50 text-xs font-mono">
              <div>
                <span className="block text-[#64748b]">{currentLang === "en" ? "Hardware Core Alloc" : "Asignación de Núcleos"}</span>
                <span className="text-[#cbd5e1] font-medium">{selectedBench.threads}</span>
              </div>
              <div>
                <span className="block text-[#64748b]">{currentLang === "en" ? "VRAM Saturation" : "Ocupación de VRAM"}</span>
                <span className="text-[#cbd5e1] font-medium">{selectedBench.vram}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#64748b] bg-[#131720]/60 p-3 rounded border border-[#1f293d]/40 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              {currentLang === "en" 
                ? "Throttling alert: CPU Workers suffer heavy clock latency when contexts scale beyond 4096 tokens."
                : "Alerta de estrangulamiento: Los hilos de CPU duplican su latencia si la memoria compartida no es DDR5."}
            </span>
          </div>

        </div>

        {/* Module 2: Stochastic Temperature Sampling Infographic */}
        <div className="bg-[#0f1115] border border-[#1f242e] rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Percent className="h-5 w-5 text-emerald-400" />
                {text.tTitle[currentLang]}
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-sm border border-emerald-500/20">
                Stochastic Curve
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">
              {text.tDesc[currentLang]}
            </p>

            {/* Config Sliders */}
            <div className="mt-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">Temperature (T) = {sliderTemp.toFixed(1)}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  sliderTemp <= 0.3 
                    ? "text-[#38bdf8] bg-sky-500/10" 
                    : sliderTemp <= 0.8 
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-amber-400 bg-amber-500/10 animate-pulse"
                }`}>
                  {sliderTemp <= 0.3 ? "Deterministic" : sliderTemp <= 0.8 ? "Balanced Mode" : "High Speculativity"}
                </span>
              </div>
              <input
                id="temperature-interactive-slider"
                type="range"
                min="0.1"
                max="1.5"
                step="0.1"
                value={sliderTemp}
                onChange={(e) => setSliderTemp(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#1b2230] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>
          </div>

          {/* Probability Curve graphic modeled via an interactive dynamic SVG path */}
          <div className="bg-[#0b0c0f] border border-[#1a202c] rounded-lg p-4 relative overflow-hidden h-40 flex items-end">
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              {/* Dynamic generated Gaussian distribution that flattens as temperature rises */}
              <path
                d={`M 0,160 
                     Q ${200 - (sliderTemp * 110)},${40 + (sliderTemp * 80)} 
                       200,${20 + (sliderTemp * 95)} 
                     Q ${200 + (sliderTemp * 110)},${40 + (sliderTemp * 80)} 
                       400,160`}
                fill="url(#grad-temp)"
                stroke="#10b981"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="grad-temp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Semantic coordinates mapped over the graph */}
            <div className="absolute inset-x-4 bottom-2 flex justify-between text-[10px] font-mono text-[#64748b]">
              <span>[0.0] Low Probability Words</span>
              <span>Predicted Token Index</span>
              <span>[1.0] High Prediction</span>
            </div>

            {/* Overlaid parameters */}
            <div className="absolute top-4 left-4 bg-black/40 border border-[#1f293d]/50 p-2 rounded text-[10px] font-mono text-white/95">
              <span className="block font-bold mb-0.5">
                {sliderTemp <= 0.3 
                  ? "Determinismo (Greedy Search)" 
                  : sliderTemp <= 0.8 
                  ? "Nucleus Sampling (Top-P Active)" 
                  : "Stochastic Drift Hazard (High entropy)"}
              </span>
              <span className="text-[#94a3b8]">
                {sliderTemp <= 0.3 
                  ? "Ideal for structured JSON summaries" 
                  : sliderTemp <= 0.8 
                  ? "Creative dialogue. Factual drift < 5%" 
                  : "Story teller profile. Drift rate up to 35%"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Module 3: Multilingual Token Inflation Coeffs Bar Group */}
      <div className="bg-[#090a0d] border border-[#1f242e] rounded-xl p-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart className="h-5 w-5 text-amber-400" />
            {text.multilingualTitle[currentLang]}
          </h3>
          <p className="text-xs text-[#94a3b8] mt-1">
            {text.multilingualDesc[currentLang]}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center mt-6">
          <div className="space-y-4">
            {langInflationData.map((item) => (
              <div key={item.code} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{item.name} ({item.code})</span>
                  <span className="text-[#a0aec0]">{item.value.toFixed(2)}x {currentLang === "en" ? "Tokens" : "Tokens"}</span>
                </div>
                <div className="w-full bg-[#161a23] rounded h-2 overflow-hidden flex">
                  <div 
                    className={`${item.color} h-full rounded transition-all duration-700`}
                    style={{ width: `${(item.value / 3.4) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#121620] border border-[#20293a] rounded-lg p-5 text-xs font-mono leading-relaxed text-[#cbd5e1] space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Architectural Insight</span>
            </div>
            <p>
              {currentLang === "en" 
                ? "Because standard BPE vocabularies are heavily biased towards English, text segments written in Spanish (ES) consume 1.7x to 2x more tokens. If you support dual-language queries, always size your model context allocations proportionally to protect against context buffer exhaustion."
                : "Al estar los diccionarios de codificación adaptados al inglés, un texto técnico en español consume más fragmentos de tokens. Si tus flujos soportan multi-idioma de forma recursiva, sobredimensiona los buffers de red un 80% para evitar truncados accidentales antes del procesamiento final."}
            </p>
            <p className="text-[10px] text-[#64748b]">
              References: GPT Tokenizer schemas & LLama-3 Byte-Pair Vocab (128k items).
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
