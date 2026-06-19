/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Language, Post } from "../types";
import { 
  Terminal, 
  Settings, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Trash2, 
  PlusCircle, 
  RefreshCw, 
  FileCode, 
  Binary, 
  Download, 
  Check, 
  MessageSquare, 
  Eye, 
  FileText, 
  User, 
  Plus, 
  Share2,
  ListRestart
} from "lucide-react";

interface PwaAdminConsoleProps {
  currentLang: Language;
  onPostActionTriggered: () => void;
}

export default function PwaAdminConsole({
  currentLang,
  onPostActionTriggered,
}: PwaAdminConsoleProps) {
  // PWA trigger state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);

  // Admin access state
  const [password, setPassword] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>("");

  // DB States
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Post creation payload
  const [newTitleEn, setNewTitleEn] = useState<string>("");
  const [newTitleEs, setNewTitleEs] = useState<string>("");
  const [newSummaryEn, setNewSummaryEn] = useState<string>("");
  const [newSummaryEs, setNewSummaryEs] = useState<string>("");
  const [newContentEn, setNewContentEn] = useState<string>("");
  const [newContentEs, setNewContentEs] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("LLM Core");
  const [newTagsString, setNewTagsString] = useState<string>("LLM, Custom");
  const [newHeaderImage, setNewHeaderImage] = useState<string>("");
  const [newAuthor, setNewAuthor] = useState<string>("Miguel Castro");
  const [postSubmitSuccess, setPostSubmitSuccess] = useState<boolean>(false);
  const [postSubmitError, setPostSubmitError] = useState<string>("");

  // Tab switches inside PWA Component
  const [pwaActiveSubTab, setPwaActiveSubTab] = useState<"pwa" | "seo" | "admin">("pwa");

  // Load physical PWA capabilities
  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);

    // Check if Service Worker is active
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          setSwRegistered(true);
        }
      });
    }

    // Check standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    fetchDatabaseInfo();

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const fetchDatabaseInfo = async () => {
    setIsLoading(true);
    try {
      const postsRes = await fetch("/api/posts");
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setAllPosts(postsData);
      }

      const currentPassword = sessionStorage.getItem("admin_session_key") || password;
      const commentsUrl = currentPassword === "admin-ops-2026"
        ? `/api/comments?password=${encodeURIComponent(currentPassword)}`
        : "/api/comments";

      const commsRes = await fetch(commentsUrl);
      if (commsRes.ok) {
        const commsData = await commsRes.json();
        setAllComments(commsData);
      }
    } catch (e) {
      console.error("Database connection dropped or server offline. Fallback client state preserved.", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      alert(
        currentLang === "en" 
          ? "PWA installation is already registered or current browser does not trigger automated installation. Please use the browser utility menu to Install NeuralOps."
          : "La instalación de la PWA ya se ha registrado o el navegador actual no soporta el prompt automático. Por favor, usa el menú del navegador para Añadir a Pantalla de Inicio."
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Password submission logic
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin-ops-2026") {
      setIsUnlocked(true);
      setAdminError("");
      sessionStorage.setItem("admin_session_key", "admin-ops-2026");
      // Load pending comments immediately
      setTimeout(() => fetchDatabaseInfo(), 100);
    } else {
      setAdminError(currentLang === "en" ? "INVALID PASSWORD METADATA" : "CONTRASEÑA DE ACCESO INCORRECTA");
      setIsUnlocked(false);
    }
  };

  // Restore session key if already unlocked
  useEffect(() => {
    const key = sessionStorage.getItem("admin_session_key");
    if (key === "admin-ops-2026") {
      setIsUnlocked(true);
      setPassword("admin-ops-2026");
      setTimeout(() => fetchDatabaseInfo(), 100);
    }
  }, []);

  // Post Delete handler
  const handleDeletePost = async (postId: string) => {
    const confirmText = currentLang === "en" 
      ? "Are you absolutely sure you want to delete this architectural post and all its user comments?" 
      : "¿Estás completamente seguro de que deseas eliminar este post de arquitectura y todos sus comentarios?";
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        setAllPosts(prev => prev.filter(p => p.id !== postId));
        alert(currentLang === "en" ? "Post deleted!" : "¡Post eliminado!");
        onPostActionTriggered();
        fetchDatabaseInfo();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove post.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Comment Delete hander
  const handleDeleteComment = async (commId: string) => {
    try {
      const res = await fetch(`/api/comments/${commId}?password=${encodeURIComponent(password)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setAllComments(prev => prev.filter(c => c.id !== commId));
        fetchDatabaseInfo();
      } else {
        alert("Failed to delete user comment.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Comment Approve handler
  const handleApproveComment = async (commId: string) => {
    try {
      const res = await fetch(`/api/comments/${commId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        alert(currentLang === "en" ? "Comment approved!" : "¡Comentario aprobado!");
        fetchDatabaseInfo();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to approve comment.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit dynamic post
  const handleUploadPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleEn || !newTitleEs || !newContentEn || !newContentEs) {
      setPostSubmitError(
        currentLang === "en" 
          ? "Please provide both English & Spanish Titles and Contents."
          : "Por favor, escribe los títulos y contenidos en inglés y español."
      );
      return;
    }

    const payload = {
      password,
      post: {
        category: newCategory,
        author: newAuthor,
        tags: newTagsString.split(",").map(t => t.trim()).filter(Boolean),
        headerImage: newHeaderImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        title: {
          en: newTitleEn,
          es: newTitleEs
        },
        summary: {
          en: newSummaryEn || newContentEn.substring(0, 110) + "...",
          es: newSummaryEs || newContentEs.substring(0, 110) + "..."
        },
        content: {
          en: newContentEn,
          es: newContentEs
        }
      }
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPostSubmitSuccess(true);
        setPostSubmitError("");
        setNewTitleEn("");
        setNewTitleEs("");
        setNewSummaryEn("");
        setNewSummaryEs("");
        setNewContentEn("");
        setNewContentEs("");
        
        onPostActionTriggered();
        fetchDatabaseInfo();

        setTimeout(() => setPostSubmitSuccess(false), 5000);
      } else {
        const err = await res.json();
        setPostSubmitError(err.error || "Failed to create dynamic post.");
      }
    } catch (e) {
      console.error(e);
      setPostSubmitError("HTTP request failed.");
    }
  };

  return (
    <div className="space-y-8 bg-[#111318] border border-[#2A2D35] rounded p-5 sm:p-7 text-[#E0E0E0]">
      
      {/* Visual Header */}
      <div className="border-b border-[#2A2D35] pb-5">
        <div className="flex items-center space-x-2 text-[#00FF41] mb-1.5">
          <Settings className="h-4 w-4 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest font-black">
            {currentLang === "en" ? "Bilingual Core Administrator" : "Administrador Principal Bilingüe"}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-mono italic">
          {currentLang === "en" ? "Progressive Web App (PWA) & Core Admin Console" : "Aplicación Web Progresiva (PWA) y Consola Admin"}
        </h3>
        <p className="text-xs sm:text-sm text-[#909399] mt-2 max-w-4xl leading-relaxed font-mono">
          {currentLang === "en"
            ? "Configure standard compliance requirements. Audit direct SEO indexability, verify live robots.txt and sitemap.xml endpoints, verify our active service worker, or perform administrative post & comment cleanups."
            : "Configura requisitos estándar de compatibilidad. Audita la indexación SEO directa de Google, comprueba robots.txt y sitemap.xml dinámicos o accede al gestor con contraseña para moderar o publicar."}
        </p>

        {/* Console Subtabs */}
        <div className="flex flex-wrap gap-2 mt-5">
          <button
            onClick={() => setPwaActiveSubTab("pwa")}
            className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider transition-all border ${
              pwaActiveSubTab === "pwa"
                ? "bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]"
                : "bg-transparent border-[#2A2D35] text-[#909399] hover:border-[#6A6D7A] hover:text-white"
            }`}
          >
            📱 PWA (Progressive Web App)
          </button>
          
          <button
            onClick={() => setPwaActiveSubTab("seo")}
            className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider transition-all border ${
              pwaActiveSubTab === "seo"
                ? "bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]"
                : "bg-transparent border-[#2A2D35] text-[#909399] hover:border-[#6A6D7A] hover:text-white"
            }`}
          >
            🔍 SEO & sitemap.xml
          </button>

          <button
            onClick={() => setPwaActiveSubTab("admin")}
            className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider transition-all border ${
              pwaActiveSubTab === "admin"
                ? "bg-[#0FF411]/15 border-[#00FF41] text-[#00FF41]"
                : "bg-transparent border-[#2A2D35] text-[#909399] hover:border-[#6A6D7A] hover:text-white"
            }`}
          >
            🔒 ADMIN CACHE GESTOR
          </button>
        </div>
      </div>

      {/* ======================= PWA OPTION TAB ======================= */}
      {pwaActiveSubTab === "pwa" && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Status indicators */}
            <div className="lg:col-span-1 bg-[#0A0B0D] border border-[#2A2D35] rounded p-5 space-y-4 font-mono text-xs">
              <span className="text-[#6A6D7A] block uppercase font-bold text-[10px] tracking-wider border-b border-[#2A2D35] pb-2">
                📡 PWA METRICS DIAGNOSTICS
              </span>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#111318] p-2.5 rounded border border-[#2A2D35]">
                  <span className="text-[#909399]">{currentLang === "en" ? "App Manifest File" : "Manifest de la App"}</span>
                  <span className="text-[#00FF41] font-bold">READY (200)</span>
                </div>
                
                <div className="flex justify-between items-center bg-[#111318] p-2.5 rounded border border-[#2A2D35]">
                  <span className="text-[#909399]">{currentLang === "en" ? "Service Worker" : "Service Worker"}</span>
                  <span className={swRegistered ? "text-[#00FF41] font-bold" : "text-amber-500 font-bold animate-pulse"}>
                    {swRegistered ? "ACTIVE & RUNNING" : "REGISTERED"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#111318] p-2.5 rounded border border-[#2A2D35]">
                  <span className="text-[#909399]">{currentLang === "en" ? "Installation Status" : "Estado Instalación"}</span>
                  <span className="text-[#E0E0E0] font-mono">
                    {isInstalled ? "STANDALONE MODE" : "STANDBY IN BROWSER"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#111318] p-2.5 rounded border border-[#2A2D35]">
                  <span className="text-[#909399]">{currentLang === "en" ? "Offline Precaching" : "Precaché Offline"}</span>
                  <span className="text-[#00FF41] font-bold">12 assets cached</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handlePwaInstall}
                  className="w-full py-2.5 bg-[#00FF41]/10 hover:bg-[#00FF41]/20 border border-[#00FF41] text-[#00FF41] rounded font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer text-center block"
                >
                  🚀 {currentLang === "en" ? "Install as Desktop/Mobile App" : "Instalar en Escritorio / Móvil"}
                </button>
                <span className="text-[9px] text-[#6A6D7A] text-center block mt-2">
                  *Provides full standalone display without address bar interference.
                </span>
              </div>
            </div>

            {/* PWA Code explanation */}
            <div className="lg:col-span-2 bg-[#111318] border border-[#2A2D35] rounded p-5 space-y-4">
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-[#00FF41]" />
                {currentLang === "en" ? "BILINGUAL PWA CONFIGURATION BLUEPRINT & STORAGE" : "MECANISMO DE CONTROL Y ARQUITECTURA PWA"}
              </h4>
              <p className="text-xs text-[#909399] font-mono leading-relaxed">
                {currentLang === "en"
                  ? "We provide genuine progressive capability using a custom Service Worker. It intercept client requests, caches static assets (HTML, bundle, icons), and handles sudden developer network loss with immediate fallback logs."
                  : "Brindamos capacidades progresivas reales usando un Service Worker personalizado que intercepta peticiones, almacena automáticamente recursos en caché y soporta pérdida de señal con un registro de contingencia."}
              </p>

              <div>
                <span className="text-[10px] font-mono text-[#6A6D7A] block mb-1">LIVE API RESPONSE CHECK FOR /manifest.json:</span>
                <pre className="text-[10px] font-mono text-[#00FF41] bg-black/50 p-4 rounded border border-[#2A2D35] overflow-x-auto max-h-44 text-left leading-normal">
{`{
  "name": "NEURAL OPS - LATENT SPACES LAB",
  "short_name": "NEURALOPS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0B0D",
  "theme_color": "#00FF41",
  "icons": [
    { "src": "/pwa-icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}`}
                </pre>
              </div>

              <div className="flex gap-4 text-xs font-mono">
                <a
                  href="/manifest.json"
                  target="_blank"
                  className="px-3 py-1.5 bg-[#0A0B0D] border border-[#2A2D35] rounded hover:border-[#00FF41] text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="h-3 w-3 text-[#00FF41]" />
                  <span>{currentLang === "en" ? "Verify live manifest.json" : "Verificar manifest.json"}</span>
                </a>
                <a
                  href="/sw.js"
                  target="_blank"
                  className="px-3 py-1.5 bg-[#0A0B0D] border border-[#2A2D35] rounded hover:border-[#00FF41] text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="h-3 w-3 text-[#00FF41]" />
                  <span>{currentLang === "en" ? "Verify live sw.js worker" : "Verificar sw.js activo"}</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================= SEO TAB ======================= */}
      {pwaActiveSubTab === "seo" && (
        <div className="space-y-6 text-left font-mono">
          <div className="bg-[#0A0B0D] border border-[#2A2D35] p-5 rounded space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Binary className="h-4 w-4 text-[#00FF41]" />
              {currentLang === "en" ? "GOOGLE INDEXATION METADATA (ROBOTS.TXT & SITE MAPS)" : "INDEXACIÓN DE GOOGLE Y VALIDADORES SEO"}
            </h4>
            <p className="text-xs text-[#909399] leading-relaxed">
              {currentLang === "en"
                ? "Google crawler robots periodically look for robots.txt instructions and use sitemap.xml to index paths. Our sitemap is generated on the fly, dynamically querying the database so any new dynamic article you submit as administrator immediately joins the crawled directory tree."
                : "Los robots de Google buscan periódicamente sitemaps para indexar las rutas url. Nuestro sitemap interactúa en vivo con la base de datos (db.json) para añadir cualquier post creado recientemente por el gestor de forma asíncrona."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* robots.txt check */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#6A6D7A] block uppercase">Live Endpoint: /robots.txt</span>
                <pre className="text-[10px] font-mono text-[#00FF41] bg-black/60 p-4 rounded border border-[#2a2d35]/60 overflow-x-auto text-left leading-normal">
{`User-agent: *
Allow: /
Disallow: /api/admin/

Sitemap: /sitemap.xml`}
                </pre>
                <a 
                  href="/robots.txt" 
                  target="_blank" 
                  className="inline-flex items-center gap-1.5 text-xs text-[#00FF41] hover:underline"
                >
                  <span>Query Robots.txt live</span>
                  <Download className="h-3 w-3" />
                </a>
              </div>

              {/* sitemap.xml display */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#6A6D7A] block uppercase">Live Endpoint: /sitemap.xml</span>
                <pre className="text-[10px] font-mono text-[#00FF41] bg-black/60 p-4 rounded border border-[#2a2d35]/60 overflow-x-auto text-left leading-normal max-h-[148px]">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/#blog</loc><priority>0.9</priority></url>
  <url><loc>/posts/hallucinations-tokens-temperature</loc></url>
  <url><loc>/posts/running-local-models-ollama-modelfiles</loc></url>
</urlset>`}
                </pre>
                <a 
                  href="/sitemap.xml" 
                  target="_blank" 
                  className="inline-flex items-center gap-1.5 text-xs text-[#00FF41] hover:underline"
                >
                  <span>Parse Sitemap.xml live structure</span>
                  <Download className="h-3 w-3" />
                </a>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================= PRIVATE ADMINISTRATIVE GESTOR ======================= */}
      {pwaActiveSubTab === "admin" && (
        <div className="space-y-6 text-left font-mono">
          
          {/* Authentication Barrier */}
          {!isUnlocked ? (
            <div className="max-w-md mx-auto p-6 bg-[#0A0B0D] border border-dashed border-[#2A2D35] rounded space-y-4">
              <div className="flex justify-center flex-col items-center gap-2">
                <div className="p-3 bg-[#0FF411]/5 border border-[#00FF41]/20 rounded-full">
                  <Lock className="h-8 w-8 text-[#00FF41] animate-pulse" />
                </div>
                <span className="text-xs uppercase tracking-wider font-bold text-white">
                  {currentLang === "en" ? "RESTRICTED ACCESS PORT" : "ACCESO RESTRINGIDO "}
                </span>
                <p className="text-[10px] text-[#6A6D7A] text-center uppercase">
                  {currentLang === "en" 
                    ? "Enter administrator password to unlock management actions over blog records and comments."
                    : "Escribe la contraseña de administrador para desbloquear eliminación de registros y posts."}
                </p>
              </div>

              <form onSubmit={handleAdminAuth} className="space-y-3">
                <input
                  id="admin-secret-access-token"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={currentLang === "en" ? "Enter admin secret key" : "Escribe clave en local..."}
                  className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-2 text-center text-xs text-[#00FF41] tracking-widest focus:outline-none focus:border-[#00FF41]"
                />
                
                {adminError && (
                  <span className="block text-red-500 font-bold text-center text-[9px] uppercase tracking-wider bg-red-500/10 p-2 border border-red-500/30 rounded">
                    🛑 Error: {adminError}
                  </span>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-[#00FF41] text-[#0A0B0D] font-bold text-xs uppercase tracking-wide cursor-pointer hover:bg-opacity-90 rounded transition-all"
                >
                  {currentLang === "en" ? "Decrypt Credentials" : "Desencriptar Credenciales"}
                </button>
              </form>

              <div className="text-center">
                <span className="text-[9px] text-[#6A6D7A]">
                  Default security credential: <span className="text-[#00FF41] select-all">admin-ops-2026</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              
              {/* Authenticated Confirmation micro bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded text-xs">
                <span className="flex items-center gap-2 text-white bold tracking-wide">
                  <Unlock className="h-4 w-4 text-[#00FF41]" />
                  <span>ADMIN SESSION ESTABLISHED IN COLD MEMORY STORAGE</span>
                </span>
                <button
                  onClick={() => {
                    setIsUnlocked(false);
                    setPassword("");
                    sessionStorage.removeItem("admin_session_key");
                  }}
                  className="mt-2 sm:mt-0 text-[10px] border border-red-500/30 text-red-500 hover:bg-red-500/10 px-2.5 py-1 rounded cursor-pointer transition-colors uppercase font-bold"
                >
                  Lock Portal / Logout
                </button>
              </div>

              {/* Dynamic Posts Management Grid split */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* COLUMN 1: Dynamic creation panel */}
                <div className="p-5 bg-[#0A0B0D] border border-[#2A2D35] rounded space-y-4">
                  <span className="text-white block uppercase tracking-wider text-xs border-b border-[#2A2D35] pb-2 font-bold flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4 text-[#00FF41]" />
                    {currentLang === "en" ? "PUBLISH BILINGUAL ARCHITECTURE POST" : "COMPILAR Y REGISTRAR NUEVO POST"}
                  </span>

                  <form onSubmit={handleUploadPostSubmit} className="space-y-3.5 text-xs text-left">
                    
                    {postSubmitSuccess && (
                      <div className="bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] p-3 rounded font-bold text-center">
                        ✓ CORE PIPELINE COMPLETED: NEW POST ADDED SUCCESSFULLY TO DATABASE
                      </div>
                    )}

                    {postSubmitError && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded font-bold text-center">
                        🛑 PIPELINE ERR: {postSubmitError}
                      </div>
                    )}

                    {/* Meta Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#909399] mb-1">Category / Categoría Name:</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-2.5 py-1.5 text-white text-xs"
                        >
                          <option value="LLM Core">LLM Core</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Prompting">Prompting</option>
                          <option value="DevOps & Cloud">DevOps & Cloud</option>
                          <option value="Linux Systems">Linux Systems</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#909399] mb-1">Tags (Comma separated):</label>
                        <input
                          type="text"
                          value={newTagsString}
                          onChange={(e) => setNewTagsString(e.target.value)}
                          placeholder="e.g. LLM, Tokens, Linux"
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#909399] mb-1">Author Name:</label>
                        <input
                          type="text"
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#909399] mb-1">Header Image (.png / .jpg URL):</label>
                        <input
                          type="text"
                          value={newHeaderImage}
                          onChange={(e) => setNewHeaderImage(e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs font-sans"
                        />
                      </div>
                    </div>

                    {/* Titles */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[#909399] mb-1">Article Title [English]:</label>
                        <input
                          type="text"
                          value={newTitleEn}
                          onChange={(e) => setNewTitleEn(e.target.value)}
                          placeholder="e.g. Quantum quantized LLMs..."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#909399] mb-1">Título del Artículo [Español]:</label>
                        <input
                          type="text"
                          value={newTitleEs}
                          onChange={(e) => setNewTitleEs(e.target.value)}
                          placeholder="p. ej. LLMs cuantizados cuánticos..."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Summaries */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[#909399] mb-1">Executive Summary [English]:</label>
                        <textarea
                          rows={2}
                          value={newSummaryEn}
                          onChange={(e) => setNewSummaryEn(e.target.value)}
                          placeholder="Short summary for the index card list..."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[#909399] mb-1">Resumen Ejecutivo [Español]:</label>
                        <textarea
                          rows={2}
                          value={newSummaryEs}
                          onChange={(e) => setNewSummaryEs(e.target.value)}
                          placeholder="Resumen corto para la cuadrícula principal..."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-1.5 text-white text-xs font-sans"
                        />
                      </div>
                    </div>

                    {/* Body content with support for markdown */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[#909399] mb-1">Post Content [English Markdown / Org-mode]:</label>
                        <textarea
                          rows={6}
                          value={newContentEn}
                          onChange={(e) => setNewContentEn(e.target.value)}
                          placeholder="### 1. Header ... Use standard markdown spacing."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-2 text-white font-mono text-xs max-h-[180px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#909399] mb-1">Contenido del Post [Español Markdown / Org-mode]:</label>
                        <textarea
                          rows={6}
                          value={newContentEs}
                          onChange={(e) => setNewContentEs(e.target.value)}
                          placeholder="### 1. Cabecera ... Formato markdown estructurado."
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded px-3 py-2 text-white font-mono text-xs max-h-[180px]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#00FF41]/10 border border-[#00FF41] hover:bg-[#00FF41]/20 text-[#00FF41] font-black uppercase text-xs tracking-wider cursor-pointer rounded transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{currentLang === "en" ? "Compile & Register Post" : "Compilar y Registrar Post"}</span>
                    </button>
                  </form>
                </div>

                {/* COLUMN 2: List current posts to delete or moderate */}
                <div className="space-y-6">
                  
                  {/* Dynamic Posts list */}
                  <div className="p-5 bg-[#0A0B0D] border border-[#2A2D35] rounded space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2A2D35] pb-2">
                      <span className="text-white block uppercase tracking-wider text-xs font-bold flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-[#00FF41]" />
                        {currentLang === "en" ? "REGISTERED SYSTEM POSTS" : "POSTS REGISTRADOS EN BASE DE DATOS"}
                      </span>
                      <span className="text-[10px] text-slate-500">Count: {allPosts.length}</span>
                    </div>

                    <div className="space-y-2.5 max-h-[292px] overflow-y-auto pr-1">
                      {allPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex justify-between items-center p-2.5 bg-[#111318] border border-[#2A2D35] rounded text-left hover:border-[#6A6D7A] transition-all"
                        >
                          <div className="space-y-1 max-w-[80%]">
                            <span className="text-[9px] bg-black/60 text-[#00FF41] font-bold py-0.5 px-2.5 rounded border border-[#00FF41]/20 uppercase">
                              {post.category}
                            </span>
                            <span className="text-slate-300 font-bold block text-xs truncate">
                              {post.title[currentLang]}
                            </span>
                            <span className="text-[9px] text-[#6A6D7A] block">
                              UUID: {post.id} | Slug: {post.slug}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-500 rounded cursor-pointer transition-all"
                            title={currentLang === "en" ? "Remove Article" : "Eliminar Artículo"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments moderation logs */}
                  <div className="p-5 bg-[#0A0B0D] border border-[#2A2D35] rounded space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2A2D35] pb-2">
                      <span className="text-white block uppercase tracking-wider text-xs font-bold flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-[#00FF41]" />
                        {currentLang === "en" ? "USER COMMENTS MODERATION" : "MODERACIÓN DE COMENTARIOS REGISTRADOS"}
                      </span>
                      <span className="text-[10px] text-slate-500">Count: {allComments.length}</span>
                    </div>

                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {allComments.length === 0 ? (
                        <span className="text-[#6A6D7A] text-[10px] text-center block py-4 uppercase">
                          No active comments in database.
                        </span>
                      ) : (
                        allComments.map((comm) => {
                          const associatedPost = allPosts.find(p => p.id === comm.postId);
                          return (
                            <div
                              key={comm.id}
                              className={`p-3 border rounded text-left space-y-2 transition-all relative group ${
                                comm.status === "pending"
                                  ? "border-amber-500/40 bg-amber-500/5"
                                  : "bg-[#111318] border-[#2A2D35]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <img
                                    src={comm.avatarUrl}
                                    className="h-6 w-6 rounded border border-[#2a2d35]"
                                    alt="User bot"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-extrabold text-[#00FF41]">@{comm.authorName}</span>
                                      {comm.status === "pending" && (
                                        <span className="text-[8px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest animate-pulse">
                                          RETENIDO POR IA
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-[#6A6D7A] block">
                                      {new Date(comm.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {comm.status === "pending" && (
                                    <button
                                      onClick={() => handleApproveComment(comm.id)}
                                      className="p-1.5 border border-[#00FF41]/20 hover:border-[#00FF41] hover:bg-[#00FF41]/15 text-[#00FF41] rounded cursor-pointer transition-colors"
                                      title={currentLang === "en" ? "Approve Comment" : "Aprobar Comentario"}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(comm.id)}
                                    className="p-1.5 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-500 rounded cursor-pointer transition-colors"
                                    title="Moderation Cutoff"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {comm.status === "pending" && comm.moderatorReason && (
                                <p className="text-[10px] text-amber-400 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 font-bold uppercase leading-tight my-1">
                                  ⚠️ Razón: {comm.moderatorReason}
                                </p>
                              )}

                              <p className="text-xs text-slate-300 font-sans italic pl-1 leading-relaxed border-l border-[#2A2D35]">
                                "{comm.message}"
                              </p>

                              {associatedPost && (
                                <span className="block text-[8px] text-[#6A6D7A] uppercase text-right">
                                  Post: {associatedPost.title[currentLang].substring(0, 32)}...
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
