/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Language, PlaygroundResult } from "../types";
import { 
  Play, 
  Terminal, 
  HelpCircle, 
  Cpu, 
  Gauge, 
  Layers, 
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface PromptPlaygroundProps {
  currentLang: Language;
}

export default function PromptPlayground({ currentLang }: PromptPlaygroundProps) {
  const [promptText, setPromptText] = useState<string>(
    "Explica qué es una alucinación en inteligencia artificial y por qué ocurre con temperaturas de muestreo elevadas."
  );
  const [activeProfile, setActiveProfile] = useState<string>("factual");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // List of pre-seeded test prompts for high-value CTA (Click-to-Action) engagement
  const examplePrompts = [
    {
      en: "Explain AI hallucinations and why they happen at high temperatures.",
      es: "Explica qué es una alucinación en IA y por qué ocurre con temperaturas elevadas."
    },
    {
      en: "Write an optimized Dockerfile for a local LLaMA worker on CPU.",
      es: "Escribe un archivo Dockerfile optimizado para un worker de LLaMA en CPU."
    },
    {
      en: "Why is creating hardcoded static mockups bad for AI engineering?",
      es: "¿Por qué crear mockups estáticos es dañino para la ingeniería de IA?"
    }
  ];

  const profiles = [
    {
      id: "factual",
      name: { en: "Strictly Factual & Deterministic", es: "Determinista Técnico Strict" },
      description: { en: "Low temperature (0.1). High precision, very brief, dry syntax, minimum drift.", es: "Temperatura baja (0.1). Alta precisión, lógica de nivel, sintaxis directa y mínima deriva factiva." },
      temp: "0.1",
      tokens: "800",
    },
    {
      id: "creative",
      name: { en: "Creative Speculative & Storyteller", es: "Ecológico Creativo / Storyteller" },
      description: { en: "High temperature (1.2). Explains through metaphors, speculative nuances, richer language.", es: "Temperatura alta (1.2). Explica con analogías líricas, exploración expansiva e inferencias abstractas." },
      temp: "1.2",
      tokens: "1000",
    },
    {
      id: "concise",
      name: { en: "Strict Executive Summary", es: "Resumen Ejecutivo de un Párrafo" },
      description: { en: "Low token allocation (max 120 tokens). Forces maximum compression, strict cutoff.", es: "Asignación restringida (máx 120 tokens). Obliga a comprimir el resultado en un único bloque denso." },
      temp: "0.7",
      tokens: "120",
    },
    {
      id: "unconstrained",
      name: { en: "Detailed Explorer System", es: "Explorador de Sistemas Equilibrado" },
      description: { en: "Balanced parameters (0.7). Broad contexts, detailed subdivisions and structured tables.", es: "Parámetros equilibrados (0.7). Estructura amplia, bloques organizados y tablas completas." },
      temp: "0.7",
      tokens: "1500",
    }
  ];

  const handleGenerate = async () => {
    if (!promptText.trim()) return;

    setIsLoading(true);
    setResult(null);
    setErrorMsg(null);

    // Dynamic steps to simulate telemetry pipeline steps (architectural transparency)
    const steps = [
      currentLang === "en" ? "RESOLVING_OLLAMA_INGRESS_QUOTA..." : "RESOLVIENDO_ENTRADA_DE_LOGS_Y_CUOTAS...",
      currentLang === "en" ? "COMPILING_SYSTEM_INSTRUCTIONS_MAPPED_TO_ENVIRONMENT..." : "COMPILANDO_INSTRUCCIONES_DE_SISTEMA...",
      currentLang === "en" ? "TRANSMITTING_INPUT_VECTORS_TO_TRANSFORMER..." : "TRANSMITIENDO_VECTORES_DE_ENTRADA_AL_TRANSFORMER...",
      currentLang === "en" ? "SAMPLING_SOFTMAX_LOGITS_ACCORDING_TO_ENTROPY..." : "MUESTREANDO_SOFTMAX_SEGUN_PARAMETRO_TEMPERATURA...",
      currentLang === "en" ? "PARSING_RESPONSE_BUFFER..." : "PROCESANDO_BUFFER_DE_RESULTADOS_FINAL..."
    ];

    let i = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setLoadingStep(steps[i]);
      } else {
        clearInterval(stepInterval);
      }
    }, 450);

    try {
      const response = await fetch("/api/prompt-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          profile: activeProfile,
        }),
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (response.ok && data.success) {
        setResult(data);
      } else if (data.fallbackData) {
        // If server failed (e.g., missing API key during local offline dev), we use the rich fallback simulation
        setResult({
          text: data.fallbackData.text,
          metadata: data.fallbackData.metadata,
          isFallback: true
        });
      } else {
        setErrorMsg(data.error || "Failed representing response. Check system console logs.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      // Client-side local offline testing fallback
      setResult({
        text: `[DEBUG OFFLINE COMPLIANCE] Respuesta simulada en local.\n\nPrueba del prompt "${promptText}" bajo el perfil "${activeProfile}".\n\nEn un hardware real montado sobre Hetzner con tu API key delSecrets panel, esta interfaz enviaría una solicitud RPC real al modelo "gemini-3.5-flash", configurando la temperatura y calculando el conteo de tokens real de inmediato.`,
        metadata: {
          profile: activeProfile,
          profileLabel: profiles.find(p => p.id === activeProfile)?.name[currentLang] || activeProfile,
          systemBehaviorDesc: "Simulando mitigación de latencias en sandbox local.",
          latencyMs: 142,
          tokens: {
            input: Math.ceil(promptText.length / 4),
            output: 94,
            total: Math.ceil(promptText.length / 4) + 94
          },
          exactPayloadSent: {
            model: "gemini-3.5-flash",
            config: {
              temperature: parseFloat(profiles.find(p => p.id === activeProfile)?.temp || "0.7"),
              topP: 0.9,
              maxOutputTokens: parseInt(profiles.find(p => p.id === activeProfile)?.tokens || "800"),
              systemInstruction: "MAPPED_OFFLINE_TELEMETRY"
            }
          }
        },
        isFallback: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-[#111318] border border-[#2A2D35] rounded p-5 sm:p-7 text-[#E0E0E0] font-sans">
      
      {/* Block top header */}
      <div>
        <div className="flex items-center space-x-2 text-[#00FF41] mb-1.5">
          <Terminal className="h-4 w-4 text-[#00FF41]" />
          <span className="font-mono text-xs uppercase tracking-widest font-black">
            {currentLang === "en" ? "Bilingual Live Lab" : "Laboratorio Bilingüe en Vivo"}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-mono italic">
          {currentLang === "en" ? "The AI Parameter & Prompt Sandbox" : "La Arena de Parámetros y Prompts"}
        </h3>
        <p className="text-xs sm:text-sm text-[#909399] mt-1 max-w-3xl leading-relaxed font-mono">
          {currentLang === "en"
            ? "Enter prompts, pick server profiles, and query Gemini live. Our system extracts latency, token counts, and displays the clean JSON payload transmitted to the server."
            : "Inserta un prompt, elige un perfil y evalúa la respuesta en tiempo real. Mostramos la latencia física, estimación de tokens y el payload JSON real enviado a la API de arquitectura backend."}
        </p>
      </div>

      {/* Preset CTA Click-to-Actions */}
      <div className="space-y-2 font-mono text-[11px]">
        <label className="block text-xs font-mono text-[#6A6D7A] font-bold uppercase tracking-wider">
          {currentLang === "en" ? "⚡ Quick Presets (Click to Load):" : "⚡ Atajos de Carga Rápida (Click para Cargar):"}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {examplePrompts.map((p, idx) => (
            <button
              key={idx}
              id={`preset-prompt-btn-${idx}`}
              onClick={() => setPromptText(p[currentLang])}
              className="text-left text-xs bg-[#0A0B0D] hover:bg-[#111318] border border-[#2A2D35] hover:border-[#00FF41]/40 p-3 rounded transition-all flex items-start gap-2 group cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-[#00FF41] shrink-0" />
              <span className="text-[#909399] group-hover:text-white transition-all line-clamp-2">
                {p[currentLang]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Area layout */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline font-mono text-[11px]">
          <label className="text-xs font-mono text-[#E0E0E0] font-semibold flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#00FF41]" />
            {currentLang === "en" ? "Input Prompt / Prompt de Entrada:" : "Prompt de Entrada:"}
          </label>
          <span className="text-[10px] font-mono text-[#6A6D7A]">
            Approx: {Math.ceil(promptText.length / 4)} tokens
          </span>
        </div>
        <textarea
          id="playground-prompt-textarea"
          rows={3}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={currentLang === "en" ? "Enter your technical prompt..." : "Escribe tu prompt para comparar..."}
          className="w-full bg-[#0A0B0D] border border-[#2A2D35] rounded px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00FF41] focus:border-[#00FF41] outline-none font-sans leading-relaxed"
        />
      </div>

      {/* Profile Selector cards with details */}
      <div className="space-y-3">
        <label className="block text-xs font-mono text-[#E0E0E0] font-semibold">
          {currentLang === "en" ? "Select AI Profile Configuration:" : "Elige el Perfil de Configuración de la IA:"}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.map((prof) => (
            <div
              key={prof.id}
              id={`profile-card-${prof.id}`}
              onClick={() => setActiveProfile(prof.id)}
              className={`p-4 rounded border cursor-pointer transition-all flex flex-col justify-between ${
                activeProfile === prof.id
                  ? "bg-[#0A0B0D] border-[#00FF41] text-white"
                  : "bg-[#0A0B0D] border-[#2A2D35] hover:border-[#00FF41]/40 text-[#909399]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs font-mono text-white block uppercase">
                    {prof.name[currentLang]}
                  </span>
                  <span className={`text-[9px] font-mono px-1 rounded ${
                    activeProfile === prof.id ? "bg-[#00FF41]/10 text-[#00FF41]" : "bg-[#111318] text-[#6A6D7A]"
                  }`}>
                    T={prof.temp}
                  </span>
                </div>
                <p className="text-[10px] text-[#909399] leading-normal mb-2 font-mono">
                  {prof.description[currentLang]}
                </p>
              </div>

              <div className="pt-2 border-t border-[#2A2D35] flex justify-between text-[9px] font-mono text-[#6A6D7A]">
                <span>Max Tokens: {prof.tokens}</span>
                <span className="text-[#00FF41] font-bold">GEMINI_RPC</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button Action */}
      <div className="flex items-center justify-end pt-2">
        <button
          id="btn-trigger-playground-evaluation"
          onClick={handleGenerate}
          disabled={isLoading || !promptText.trim()}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded font-mono text-xs font-bold transition-all uppercase tracking-wider ${
            isLoading 
              ? "bg-[#111318] text-[#6A6D7A] border border-[#2A2D35] cursor-not-allowed"
              : "bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/20 cursor-pointer"
          }`}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          <span>{isLoading ? (currentLang === "en" ? "PROCESSING..." : "PROCESANDO...") : (currentLang === "en" ? "EVALUATE WORKFLOW" : "EVALUAR FLUJO")}</span>
        </button>
      </div>

      {/* loading panel and debug console states */}
      {isLoading && (
        <div id="loader-console-stream" className="bg-[#0A0B0D] border border-[#2A2D35] rounded p-5 font-mono text-xs text-[#00FF41] space-y-2">
          <div className="flex items-center space-x-2 text-white">
            <span className="h-2 w-2 bg-[#00FF41] rounded-full animate-ping" />
            <span className="font-bold uppercase tracking-wider text-[10px]">System Stream Active:</span>
          </div>
          <div className="text-[#909399] flex items-center gap-1.5 animate-pulse mt-1">
            <span className="text-[#00FF41]">root@latent-server:~#</span>
            <span>{loadingStep}</span>
          </div>
          <div className="w-full bg-[#111318] h-1.5 border border-[#2A2D35] rounded overflow-hidden">
            <div className="bg-[#00FF41] h-full rounded animate-pulse" style={{ width: "65%" }}></div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded text-xs font-mono">
          <span className="font-bold">SYSTEM ERROR REPORTED: </span> {errorMsg}
        </div>
      )}

      {/* Terminal Results Board */}
      {result && (
        <div id="playground-terminal-box" className="space-y-6 pt-4 border-t border-[#2A2D35]">
          
          {/* Top Title Bar of Result Node */}
          <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
              <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="h-3 w-3 rounded-full bg-[#00FF41]" />
              <span className="text-xs text-[#6A6D7A] font-mono ml-2 font-bold tracking-wider">OUTPUT_TELEMETRY.LOG</span>
            </div>
            {result.isFallback && (
              <span className="text-[9px] uppercase font-mono bg-[#00FF41]/10 border border-[#00FF41]/20 text-[#00FF41] px-2.5 py-0.5 rounded font-black">
                {currentLang === "en" ? "Offline Simulation" : "Simulación Educativa"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column: Text response */}
            <div className="lg:col-span-2 bg-[#0A0B0D] border border-[#2A2D35] rounded p-5 sm:p-6 shadow-inner text-left">
              <div className="flex items-center justify-between text-[#6A6D7A] mb-4 text-[10px] font-mono">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[#00FF41]" />
                  MODEL: gemini-3.5-flash
                </span>
                <span>UTC Status: 200 OK</span>
              </div>
              
              <div 
                id="playground-response-text"
                className="whitespace-pre-line text-xs sm:text-sm text-[#E0E0E0] leading-relaxed font-mono prose prose-invert max-w-none prose-sm"
              >
                {result.text}
              </div>
            </div>

            {/* Right column: Physical configurations & payload metrics */}
            <div className="space-y-4">
              
              {/* Box 1: Physical parameters */}
              <div className="bg-[#111318] border border-[#2A2D35] rounded p-4 font-mono text-xs text-left">
                <span className="text-[#6A6D7A] block uppercase tracking-wider text-[9px] font-black mb-3">
                  Telemetry Metrics
                </span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#0A0B0D] border border-[#2A2D35] p-2 rounded">
                    <span className="text-[#909399] flex items-center gap-1 text-[10px]">
                      <Clock className="h-3.5 w-3.5 text-[#00FF41]" />
                      {currentLang === "en" ? "Latency" : "Latencia"}
                    </span>
                    <span className="text-[#00FF41] font-bold">{result.metadata.latencyMs} ms</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-[#0A0B0D] border border-[#2A2D35] p-2 rounded">
                    <span className="text-[#909399] flex items-center gap-1 text-[10px]">
                      <Gauge className="h-3.5 w-3.5 text-[#00FF41]" />
                      {currentLang === "en" ? "Total Weights" : "Peso de Tokens"}
                    </span>
                    <span className="text-[#00FF41] font-bold">
                      {result.metadata.tokens.total} <span className="text-[9px] text-[#6A6D7A]">toks</span>
                    </span>
                  </div>

                  {/* Token breakdown meter */}
                  <div className="bg-[#0A0B0D] border border-[#2A2D35] p-2.5 rounded text-[9px] space-y-1 text-[#909399]">
                    <div className="flex justify-between">
                      <span>Input tokens:</span>
                      <span className="text-white font-bold">{result.metadata.tokens.input}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output tokens:</span>
                      <span className="text-white font-bold">{result.metadata.tokens.output}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: JSON Payload Sent */}
              <div className="bg-[#111318] border border-[#2A2D35] rounded p-4 font-mono text-[11px] space-y-2 text-left">
                <span className="text-[#6A6D7A] block uppercase tracking-wider text-[9px] font-black">
                  Exact JSON Config Sent
                </span>
                <pre className="text-[#00FF41] bg-black/80 p-3 rounded border border-[#2a2d35]/60 overflow-x-auto text-[9px] max-h-48 text-left leading-normal font-mono select-all">
                  {JSON.stringify(result.metadata.exactPayloadSent, null, 2)}
                </pre>
                <span className="text-[8px] text-[#6A6D7A] leading-tight block">
                  {currentLang === "en"
                    ? "*Our Express backend binds this payload to @google/genai SDK on port 3000."
                    : "*Nuestro backend transforma la petición en llamadas nativas SDK de Google."}
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
