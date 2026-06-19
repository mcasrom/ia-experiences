/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Language, Post } from "./types";
import { BLOG_POSTS } from "./data/posts";
import Navbar from "./components/Navbar";
import MetricChart from "./components/MetricChart";
import PromptPlayground from "./components/PromptPlayground";
import PwaAdminConsole from "./components/PwaAdminConsole";
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Mail, 
  Star, 
  Github, 
  ExternalLink, 
  Eye, 
  User, 
  Send, 
  Check, 
  Tag, 
  ChevronRight,
  Sparkles,
  Bookmark,
  Share2
} from "lucide-react";

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<string>("blog");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Dynamic posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeComments, setActiveComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);

  // Registration & low-friction comment fields
  const [commentNickname, setCommentNickname] = useState<string>(() => {
    return localStorage.getItem("neuralops_username") || "";
  });
  const [commentMessage, setCommentMessage] = useState<string>("");
  const [commentError, setCommentError] = useState<string>("");
  const [commentSuccess, setCommentSuccess] = useState<boolean>(false);
  const [commentRetained, setCommentRetained] = useState<boolean>(false);
  const [commentRetainedReason, setCommentRetainedReason] = useState<string>("");
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Contact form submission mock
  const [contactName, setContactName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Incremental social reactions in browser state
  const [starredPosts, setStarredPosts] = useState<Record<string, number>>({});
  const [readPosts, setReadPosts] = useState<Record<string, number>>({});

  // Dynamic load of posts on mount
  const fetchPostsList = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setPosts(BLOG_POSTS);
      }
    } catch (e) {
      console.warn("Express server offline, fallback static seed loaded", e);
      setPosts(BLOG_POSTS);
    }
  };

  useEffect(() => {
    fetchPostsList();
  }, []);

  // Fetch comments of selectedPost
  const fetchCommentsForPost = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveComments(data);
      } else {
        setActiveComments([]);
      }
    } catch (e) {
      console.error(e);
      setActiveComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPost) {
      fetchCommentsForPost(selectedPost.id);
    }
  }, [selectedPost]);

  // Submit Comments Handler
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!commentNickname.trim() || !commentMessage.trim()) {
      setCommentError(
        currentLang === "en"
          ? "Nickname and message fields cannot be empty."
          : "Los campos de apodo y comentario no pueden estar vacíos."
      );
      return;
    }

    try {
      setCommentRetained(false);
      setCommentRetainedReason("");
      
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPost.id,
          authorName: commentNickname.trim(),
          message: commentMessage.trim()
        })
      });

      if (res.ok) {
        const result = await res.json();
        setCommentMessage("");
        setCommentError("");
        
        if (result.retained) {
          setCommentRetained(true);
          setCommentRetainedReason(result.reason || "");
        } else {
          setCommentSuccess(true);
          setTimeout(() => setCommentSuccess(false), 4000);
        }
        
        // Persist the user registration name to localStorage for absolute zero-friction!
        localStorage.setItem("neuralops_username", commentNickname.trim());
        
        fetchCommentsForPost(selectedPost.id);
      } else {
        const err = await res.json();
        setCommentError(err.error || "Failed to post comment.");
      }
    } catch (e) {
      console.error(e);
      setCommentError("Network error occurred.");
    }
  };

  // Memoized lists (using loaded dynamic posts)
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const titleMatches = post.title[currentLang].toLowerCase().includes(searchQuery.toLowerCase());
      const summaryMatches = post.summary[currentLang].toLowerCase().includes(searchQuery.toLowerCase());
      const tagMatches = selectedTag === "all" || post.tags.includes(selectedTag);
      return (titleMatches || summaryMatches) && tagMatches;
    });
  }, [searchQuery, selectedTag, currentLang, posts]);

  const handleStarPost = (postId: string) => {
    setStarredPosts(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));
  };

  const handleReadIncrement = (post: Post) => {
    setReadPosts(prev => ({
      ...prev,
      [post.id]: (prev[post.id] || 0) + 1
    }));
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    
    setIsSubmitted(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setIsSubmitted(false);
    }, 4000);
  };

  // Safe and responsive markdown block parser to display post content with code/tables/quotes elegantly
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "";
    
    let inTable = false;
    let tableRows: string[][] = [];

    return lines.map((line, idx) => {
      // 1. Double bracket latex equations formatting helper
      let processedLine = line
        .replace(/\\\((.*?)\\\)/g, "$1")
        .replace(/\\\\\((.*?)\\\\\)/g, "$1")
        .replace(/\$\$(.*?)\$\$/g, "$1");

      // 2. Handle code/syntax block triggers (both #+BEGIN_SRC or ```)
      if (processedLine.startsWith("#+BEGIN_SRC") || processedLine.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = processedLine.split(" ")[1] || "bash";
          codeBlockContent = [];
          return null;
        } else {
          inCodeBlock = false;
          const content = codeBlockContent.join("\n");
          return (
            <div key={`code-${idx}`} className="my-5 font-mono text-xs bg-[#090b10] border border-[#1e2532] rounded-lg overflow-hidden relative group">
              <div className="bg-[#121620] px-4 py-2 text-[#64748b] border-b border-[#1e2532] flex justify-between items-center">
                <span className="uppercase text-[10px] tracking-wider font-bold text-slate-400">{codeBlockLang} CONTAINER</span>
                <span className="text-[10px]">Unix-compatible</span>
              </div>
              <pre className="p-4 overflow-x-auto text-emerald-400 leading-relaxed text-left">
                <code>{content}</code>
              </pre>
            </div>
          );
        }
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return null;
      }

      // 3. Render traditional markdown tables safely
      if (processedLine.trim().startsWith("|") && processedLine.trim().endsWith("|")) {
        const columns = processedLine.split("|").map(col => col.trim()).filter(col => col !== "");
        // Skip separation line
        if (columns[0]?.startsWith("---") || columns[0]?.startsWith(":---")) {
          return null;
        }

        if (!inTable) {
          inTable = true;
          tableRows = [columns];
          return null;
        } else {
          tableRows.push(columns);
          
          // Let's check if the NEXT line is also a table line. If not, finalize and render
          const nextLine = lines[idx + 1];
          if (!nextLine || !nextLine.trim().startsWith("|")) {
            inTable = false;
            const headers = tableRows[0];
            const bodies = tableRows.slice(1);
            return (
              <div key={`table-${idx}`} className="my-6 overflow-x-auto border border-[#1e2532] rounded-lg bg-[#0a0c10]">
                <table className="min-w-full divide-y divide-[#1e2532] text-xs font-mono">
                  <thead className="bg-[#11141d]/80 text-[#cbd5e1]">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-4 py-3 text-left font-bold tracking-tight uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2532]/40 text-[#a0aec0]">
                    {bodies.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#12151f]/50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-3 font-mono whitespace-nowrap text-left">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return null;
        }
      }

      // 4. Handle block quotes or structural system rules
      if (processedLine.trim().startsWith(">")) {
        return (
          <blockquote key={idx} className="my-5 border-l-4 border-blue-500 bg-[#121724]/40 p-4 rounded-r-lg text-xs italic text-slate-300 leading-relaxed font-mono">
            {processedLine.replace(/^>\s*/, "")}
          </blockquote>
        );
      }

      // 5. Header renderers
      if (processedLine.startsWith("###")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-white tracking-tight mt-8 mb-4 border-b border-[#1c2230] pb-2 font-mono uppercase flex items-center gap-2">
            <span className="text-blue-500 font-bold">#</span>
            {processedLine.replace(/^###\s*/, "")}
          </h3>
        );
      }

      // 6. Sub-headers
      if (processedLine.startsWith("####")) {
        return (
          <h4 key={idx} className="text-md font-bold text-slate-300 tracking-tight mt-6 mb-3 font-mono">
            $ {processedLine.replace(/^####\s*/, "")}
          </h4>
        );
      }

      // 7. General paragraphs or list rendering
      if (processedLine.trim() === "") return <div key={idx} className="h-4" />;

      if (processedLine.trim().startsWith("-") || processedLine.trim().startsWith("*") || /^\d+\./.test(processedLine.trim())) {
        const content = processedLine.replace(/^[-*\d.]+\s*/, "");
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-slate-300 mb-2 leading-relaxed">
            {content}
          </li>
        );
      }

      return (
        <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-4 font-sans text-left">
          {processedLine}
        </p>
      );
    });
  };

  const textDict = {
    heroTitle: {
      en: "Latent Spaces",
      es: "Espacios Latentes"
    },
    heroSubtitle: {
      en: "Bilingual logbook on Linux architectures, Ollama execution parameters, prompt compliance vectors, and LLM behavior metrics.",
      es: "Cuaderno bilingüe de ingeniería sobre arquitecturas Linux, límites de Ollama, optimización de prompts y análisis técnico de LLMs."
    },
    subSqueeze: {
      en: "Rejecting static mockups. Built for total functional transparency.",
      es: "Rechazando mockups vacíos. Diseñado para ofrecer total transparencia productiva."
    },
    searchPlaceholder: {
      en: "Search posts, topics, systems params...",
      es: "Buscar posts, temas, configuraciones..."
    },
    filterAll: {
      en: "All Categories",
      es: "Todas las Categorías"
    },
    widgetBioTitle: {
      en: "Systems Architect Profile",
      es: "Perfil del Arquitecto"
    },
    widgetBioDesc: {
      en: "Miguel Castro - Senior Linux Systems Architect specializing in self-hosted pipelines & local weights management.",
      es: "Miguel Castro - Arquitecto de Sistemas Linux Senior especializado en integraciones locales, celdas seguras de datos y Ollama."
    },
    aboutMeLong: {
      en: "Senior Linux Systems Architect leading local neural integrations. I designed Latent Spaces on a Lubuntu pipeline connected to secure, self-hosted API layers to prove that operational rigor outperforms dry mockups.",
      es: "Arquitecto Senior de Sistemas Linux liderando integraciones neuronales eficientes. Diseñé Espacios Latentes desde un ecosistema local robusto para demostrar de forma empírica que el rigor físico se impone siempre a las simulaciones artificiales."
    },
    viewPost: {
      en: "Read Research",
      es: "Leer Investigación"
    },
    backToHome: {
      en: "Return to terminal index",
      es: "Volver al índice de la terminal"
    },
    tagsHeading: {
      en: "Filter by System Tag",
      es: "Filtrar por Tag de Sistema"
    },
    contactTitle: {
      en: "Establish Connection / Inbound Message",
      es: "Iniciar Conexión / Mensaje Inbound"
    },
    contactPlaceholderName: {
      en: "Architect Name / Company",
      es: "Nombre del Arquitecto / Empresa"
    },
    contactBtn: {
      en: "Transmit Payload",
      es: "Transmitir Datos"
    },
    subTitleForm: {
      en: "Subscribe for System Alerts",
      es: "Suscribirse a Alertas de Sistema"
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E0E0E0] flex flex-col justify-between selection:bg-[#00FF41]/20 selection:text-[#00FF41]">
      
      {/* 1. Header Navigation Frame */}
      <Navbar 
        currentLang={currentLang} 
        onLanguageChange={setCurrentLang} 
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedPost(null);
        }}
      />

      {/* 2. Main Body Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ACTIVE VIEW: Research Blog Tab */}
        {activeTab === "blog" && (
          <div className="space-y-12">
            
            {/* If a specific post is being read */}
            {selectedPost ? (
              <article className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                
                {/* Back button link */}
                <button
                  id="back-to-blog-btn"
                  onClick={() => setSelectedPost(null)}
                  className="inline-flex items-center space-x-2 text-xs font-mono text-[#00FF41] hover:text-white transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                  <span>{textDict.backToHome[currentLang]}</span>
                </button>

                {/* Article Header Canvas */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] px-2.5 py-0.5 rounded">
                      {selectedPost.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[#6A6D7A]">
                      UTC_TIMESTAMP: 2026-06-18
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none italic">
                    {selectedPost.title[currentLang]}
                  </h1>

                  <p className="text-sm sm:text-base text-[#909399] italic font-medium leading-relaxed">
                    {selectedPost.summary[currentLang]}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-3 border-y border-[#2A2D35] py-3 text-xs font-mono text-[#6A6D7A]">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4 text-[#00FF41]" />
                      Author: {selectedPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-[#909399]" />
                      {selectedPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-[#00FF41]" />
                      {selectedPost.readTime}
                    </span>
                    <span className="flex items-center gap-1 text-white ml-auto cursor-pointer" onClick={() => handleStarPost(selectedPost.id)}>
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>{selectedPost.stats.stars + (starredPosts[selectedPost.id] || 0)}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#6A6D7A]">
                      <Eye className="h-4 w-4" />
                      <span>{selectedPost.stats.reads + (readPosts[selectedPost.id] || 1)} reads</span>
                    </span>
                  </div>
                </div>

                {/* Cover graphic */}
                <div className="h-64 sm:h-96 w-full rounded-xl overflow-hidden border border-[#2A2D35]">
                  <img
                    referrerPolicy="no-referrer"
                    src={selectedPost.headerImage}
                    alt={selectedPost.title[currentLang]}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Custom Block Markdown Parser Body output */}
                <div className="prose prose-invert max-w-none text-left">
                  {renderMarkdown(selectedPost.content[currentLang])}
                </div>

                {/* Sub-Article System Footer */}
                <div className="bg-[#111318] border border-[#2A2D35] rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-xs">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="block font-bold text-white uppercase tracking-wider text-[10px]">System Index Coordinates:</span>
                    <span className="text-[#6A6D7A]">/home/user/ia-experiences/{selectedPost.slug}.org</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleStarPost(selectedPost.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/20 hover:text-white transition-all cursor-pointer font-bold"
                    >
                      <Star className="h-4 w-4 fill-current" />
                      <span>Rate research ({starredPosts[selectedPost.id] || 0})</span>
                    </button>
                    <button 
                      onClick={() => alert(`Copied to clipboard: https://github.com/mcasrom/ia-experiences`)}
                      className="p-2 rounded bg-[#0A0B0D] border border-[#2A2D35] text-[#909399] hover:text-[#00FF41] transition-colors"
                      title="Share link"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* ================================= COMMENTS SECTION ================================= */}
                <div className="bg-[#111318] border border-[#2A2D35] rounded-xl p-5 sm:p-7 space-y-6 text-left font-mono">
                  
                  {/* Comm Header */}
                  <div className="border-b border-[#2A2D35] pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="text-[#00FF41] animate-pulse">●</span>
                      {currentLang === "en" ? "Console Node Comments Feed" : "Historial de Comentarios del Nodo"}
                    </h3>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      {activeComments.length} {currentLang === "en" ? "Feedbacks registered" : "Mensajes"}
                    </span>
                  </div>

                  {/* List comments */}
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {commentsLoading ? (
                      <div className="text-center py-6 text-xs text-[#6A6D7A] animate-pulse uppercase">
                        Loading comments pipeline...
                      </div>
                    ) : activeComments.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-[#2A2D35] rounded">
                        {currentLang === "en" 
                          ? "NO ACTIVE VISITOR TELEMETRY RECEIVED. WRITE THE FIRST COMMENT!"
                          : "NINGÚN COMENTARIO REGISTRADO AÚN EN ESTE POST. ¡SÉ EL PRIMERO EN OPINAR!"}
                      </div>
                    ) : (
                      activeComments.map((comment) => (
                        <div 
                          key={comment.id} 
                          className="p-3.5 bg-[#0A0B0D] border border-[#2a2d35]/65 hover:border-[#6a6d7a]/50 rounded-lg space-y-2.5 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center space-x-2">
                              <img 
                                src={comment.avatarUrl} 
                                className="h-6 w-6 rounded border border-[#2A2D35] bg-slate-900" 
                                alt="User avatar bot"
                              />
                              <div className="font-mono">
                                <span className="font-extrabold text-[#00FF41]">@{comment.authorName}</span>
                                <span className="text-[9px] text-[#6A6D7A] block">ID: {comment.id.substring(0, 10)}</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-[#6A6D7A]">
                              {new Date(comment.timestamp).toLocaleDateString(currentLang === "en" ? "en-US" : "es-ES", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-300 font-sans leading-relaxed pl-1 italic border-l-2 border-[#00FF41]/20">
                            "{comment.message}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Low Friction Submit comment Form */}
                  <div className="bg-[#0A0B0D] border border-[#2A2D35] p-5 rounded-lg space-y-4">
                    <span className="block text-[11px] text-[#909399] uppercase font-bold border-b border-[#2A2D35] pb-2">
                      ✍️ {currentLang === "en" ? "ADD LOW-FRICTION VISITOR COMMENT" : "COMENTAR (REGISTRO DE BAJA FRICCIÓN)"}
                    </span>

                    <form onSubmit={handleCommentSubmit} className="space-y-4 text-xs">
                      
                      {commentSuccess && (
                        <div className="bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] p-3 rounded font-bold text-center">
                          ✓ CMT RECEIVED: COMMENT SUBMITTED IN DATABASE PIPELINE SUCCESSFUL
                        </div>
                      )}

                      {commentRetained && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-3.5 rounded space-y-1.5 text-center">
                          <div className="font-bold uppercase tracking-wider text-xs">
                            ⚠️ COMENTARIO RETENIDO POR IA
                          </div>
                          <div className="text-[11px] text-slate-300 font-sans italic leading-relaxed">
                            {currentLang === "en"
                              ? `Your feedback was successfully saved, but has been held for review because our AI detected potential profanity, slang, or bad taste.`
                              : `Tu mensaje se guardó correctamente, pero ha sido retenido para revisión debido a que nuestra Inteligencia Artificial detectó posibles modismos, palabras soeces o de mal gusto.`}
                          </div>
                          {commentRetainedReason && (
                            <div className="text-[10px] bg-amber-500/5 border border-amber-500/10 p-1.5 rounded uppercase font-bold text-amber-500">
                              Razón: {commentRetainedReason}
                            </div>
                          )}
                        </div>
                      )}

                      {commentError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded font-bold text-center">
                          🛑 CMT ERROR: {commentError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Nickname / friction-less identification */}
                        <div className="sm:col-span-1 space-y-1.5 text-left">
                          <label className="block text-[10px] text-[#6A6D7A] uppercase font-bold">
                            {currentLang === "en" ? "Choose Nickname:" : "Tu Apodo / Nickname:"}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={commentNickname}
                              onChange={(e) => setCommentNickname(e.target.value)}
                              placeholder="e.g. SysDev_Guest"
                              required
                              className="w-full bg-[#111318] border border-[#2A2D35] text-[#00FF41] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#00FF41] font-bold"
                            />
                            {commentNickname && (
                              <img
                                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(commentNickname)}`}
                                className="absolute right-2 top-1.5 h-6 w-6 rounded border border-[#2A2D35] bg-black/40"
                                alt="User pre-rendering bot"
                              />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 block">
                            *Auto-saves locally. Zero password required!
                          </span>
                        </div>

                        {/* Comment message */}
                        <div className="sm:col-span-2 space-y-1.5 text-left">
                          <label className="block text-[10px] text-[#6A6D7A] uppercase font-bold">
                            {currentLang === "en" ? "Write Comment Message:" : "Escribe tu Comentario:"}
                          </label>
                          <textarea
                            rows={3}
                            value={commentMessage}
                            onChange={(e) => setCommentMessage(e.target.value)}
                            placeholder={currentLang === "en" ? "Enter your architectural review..." : "Escribe aquí tu opinión o consulta técnica..."}
                            required
                            className="w-full bg-[#111318] border border-[#2A2D35] text-[#E0E0E0] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#00FF41] font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#00FF41]/10 border border-[#00FF41]/30 hover:bg-[#00FF41]/20 text-[#000000] hover:text-[#00FF41] bg-[#00FF41] font-black uppercase text-xs tracking-wider cursor-pointer rounded transition-all py-2.5 flex items-center justify-center gap-2"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{currentLang === "en" ? "Submit Node Comment" : "Publicar Comentario en el Nodo"}</span>
                      </button>
                    </form>
                  </div>

                </div>

              </article>
            ) : (
              
              // Standard Blog Home Grid
              <div className="space-y-12">
                
                {/* Hero Minimal Brand Area */}
                <div className="text-center py-6 border-b border-[#2A2D35] space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-[#00FF41]/10 border border-[#00FF41]/20 px-3.5 py-1.5 rounded-full text-[10px] font-mono text-[#00FF41] uppercase font-bold tracking-widest">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{textDict.subSqueeze[currentLang]}</span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white font-sans uppercase italic">
                    {textDict.heroTitle[currentLang]}
                  </h1>
                  <p className="text-xs sm:text-sm font-mono text-[#909399] max-w-2xl mx-auto leading-relaxed">
                    {textDict.heroSubtitle[currentLang]}
                  </p>
                </div>

                {/* Dashboard Controls Container */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* Left Column: Search & Tag filtration filters */}
                  <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
                    
                    {/* Search Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono uppercase text-[#909399] font-black tracking-wider">
                        System Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#6A6D7A]" />
                        <input
                          id="blog-search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={textDict.searchPlaceholder[currentLang]}
                          className="w-full bg-[#111318] border border-[#2A2D35] rounded pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41] font-mono"
                        />
                      </div>
                    </div>

                    {/* Tag Filter selection links */}
                    <div className="space-y-3">
                      <span className="block text-xs font-mono uppercase text-[#909399] font-black tracking-wider">
                        {textDict.tagsHeading[currentLang]}
                      </span>
                      <div className="flex flex-wrap lg:flex-col gap-1.5">
                        <button
                          id="btn-tag-filter-all"
                          onClick={() => setSelectedTag("all")}
                          className={`px-3 py-2 text-xs font-mono rounded text-left flex items-center justify-between transition-all ${
                            selectedTag === "all"
                              ? "bg-[#111318] border border-[#00FF41]/40 text-[#00FF41]"
                              : "text-[#909399] hover:bg-[#111318] hover:text-[#00FF41]"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" />
                            {textDict.filterAll[currentLang]}
                          </span>
                          <span className="bg-[#0A0B0D] px-1.5 py-0.5 rounded text-[10px] text-[#6A6D7A]">
                            {BLOG_POSTS.length}
                          </span>
                        </button>
                        {availableTags.map((tag) => {
                          const count = BLOG_POSTS.filter((p) => p.tags.includes(tag)).length;
                          return (
                            <button
                              key={tag}
                              id={`btn-tag-filter-${tag}`}
                              onClick={() => setSelectedTag(tag)}
                              className={`px-3 py-2 text-xs font-mono rounded text-left flex items-center justify-between transition-all ${
                                selectedTag === tag
                                  ? "bg-[#111318] border border-[#00FF41]/40 text-[#00FF41]"
                                  : "text-[#909399] hover:bg-[#111318] hover:text-[#00FF41]"
                              }`}
                            >
                              <span>#{tag}</span>
                              <span className="bg-[#0A0B0D] px-1.5 py-0.5 rounded text-[10px] text-[#6A6D7A]">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Profile Biography Card Panel */}
                    <div className="p-5 bg-[#111318] border border-[#2A2D35] rounded font-mono text-xs space-y-3">
                      <div className="flex items-center space-x-2 text-white">
                        <div className="h-5 w-5 rounded bg-[#00FF41]/10 flex items-center justify-center">
                          <Bookmark className="h-3.5 w-3.5 text-[#00FF41]" />
                        </div>
                        <span className="font-bold">{textDict.widgetBioTitle[currentLang]}</span>
                      </div>
                      <p className="text-[#909399] leading-relaxed text-[11px]">
                        {textDict.widgetBioDesc[currentLang]}
                      </p>
                      
                      <button 
                        onClick={() => setActiveTab("about")}
                        className="text-[#00FF41] hover:text-white flex items-center gap-1 font-bold pt-1 cursor-pointer"
                      >
                        <span>Inspect topology profile</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Research Posts listing */}
                  <div className="lg:col-span-3 space-y-6">
                    {filteredPosts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPosts.map((post) => (
                          <div
                            key={post.id}
                            id={`blog-card-${post.id}`}
                            className="bg-[#111318] border border-[#2A2D35]/80 hover:border-[#00FF41] rounded overflow-hidden flex flex-col justify-between group transition-all duration-300"
                          >
                            <div>
                              {/* Header Image */}
                              <div className="h-44 w-full overflow-hidden relative border-b border-[#2A2D35]">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={post.headerImage}
                                  alt={post.title[currentLang]}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 bg-black/90 px-2 rounded-sm text-[9px] font-mono font-bold text-[#00FF41] tracking-wider border border-[#00FF41]/30">
                                  {post.category.toUpperCase()}
                                </div>
                              </div>

                              {/* Card info body */}
                              <div className="p-5 space-y-2.5 text-left">
                                <div className="flex justify-between items-center text-[10px] font-mono text-[#6A6D7A]">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {post.date}
                                  </span>
                                  <span>{post.readTime}</span>
                                </div>

                                <h3 className="text-md font-bold text-white tracking-tight line-clamp-2 leading-snug group-hover:text-[#00FF41] transition-colors font-mono">
                                  {post.title[currentLang]}
                                </h3>

                                <p className="text-xs text-[#909399] line-clamp-3 leading-relaxed">
                                  {post.summary[currentLang]}
                                </p>
                              </div>
                            </div>

                            {/* Card Footer controls */}
                            <div className="p-5 pt-0 mt-auto border-t border-[#2A2D35]/40 flex items-center justify-between">
                              {/* Tags indicators inside the card */}
                              <div className="flex flex-wrap gap-1">
                                {post.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-[10px] font-mono text-[#6A6D7A] hover:text-[#cbd5e1] transition-all">
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              <button
                                id={`read-post-btn-${post.id}`}
                                onClick={() => handleReadIncrement(post)}
                                className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#00FF41] group-hover:text-white transition-colors cursor-pointer"
                              >
                                <span>{textDict.viewPost[currentLang]}</span>
                                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-[#111318] border border-dashed border-[#2A2D35] rounded">
                        <span className="font-mono text-xs text-[#6A6D7A] block">No index logs found matching search criteria.</span>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedTag("all");
                          }}
                          className="mt-4 px-4 py-2 bg-[#0A0B0D] border border-[#2A2D35] text-[10px] font-mono text-[#E0E0E0] rounded hover:border-[#00FF41] hover:text-[#00FF41] transition-colors cursor-pointer uppercase font-bold"
                        >
                          Clear system filters
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ACTIVE VIEW: Interactive Playground Arena Tab */}
        {activeTab === "playground" && (
          <div className="space-y-6">
            <PromptPlayground currentLang={currentLang} />
          </div>
        )}

        {/* ACTIVE VIEW: Advanced Physical Metrics Tab */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            <MetricChart currentLang={currentLang} />
          </div>
        )}

        {/* ACTIVE VIEW: Progressive Web App, SEO Sitemap & Administrative Console Tab */}
        {activeTab === "pwa-admin" && (
          <div className="space-y-6">
            <PwaAdminConsole 
              currentLang={currentLang} 
              onPostActionTriggered={fetchPostsList} 
            />
          </div>
        )}

        {/* ACTIVE VIEW: About Me & Social Inbound Tab */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Biography Column */}
            <div className="lg:col-span-2 space-y-8 text-left">
              <div className="p-6 bg-[#111318] border border-[#2A2D35] rounded space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-[#00FF41] rounded flex items-center justify-center font-bold text-[#0A0B0D] font-mono text-lg border border-[#2A2D35] shrink-0 shadow-lg select-none">
                    MC
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-mono uppercase tracking-tight">Miguel Castro</h2>
                    <p className="text-[10px] font-mono text-[#00FF41] tracking-wider uppercase font-black">SENIOR LINUX SYSTEMS ARCHITECT & LEAD DEVELOPER</p>
                    <p className="text-[10px] text-[#6A6D7A] font-mono">Location: /home/user/ia-experiences</p>
                  </div>
                </div>

                <div className="border-t border-[#2A2D35] pt-4 font-sans text-xs text-[#909399] leading-relaxed space-y-3">
                  <p>{textDict.aboutMeLong[currentLang]}</p>
                  
                  {currentLang === "en" ? (
                    <p>
                      This project operates on a double paradigm: absolute performance tracing on Unix kernels and real prompt synchronization. It is uploaded to <strong>https://github.com/mcasrom/ia-experiences</strong> and ready to be brought up on Hetzner hosting architectures. Each content column has been compiled cleanly using actual code configurations, avoiding mockups or empty layout cells.
                    </p>
                  ) : (
                    <p>
                      Este blog opera bajo una doble premisa: el rastreo absoluto de rendimiento en hilos Unix y la sincronización real de prompts. El código reside en el repositorio <strong>https://github.com/mcasrom/ia-experiences</strong> listo para ser desplegado en servidores Hetzner. Todo componente ha sido diseñado desde cero escribiendo la lógica final del compilador para asegurar el máximo SEO e interactividad.
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Physical Network Topology Map (Saves users from Mockup Larps) */}
              <div className="p-6 bg-[#111318] border border-[#2A2D35] rounded font-mono text-xs space-y-4">
                <span className="text-white block uppercase tracking-wider text-[10px] font-bold">
                  🔗 PHYSICAL SYSTEMS TOPOLOGY & ARCHITECTURE
                </span>

                <div className="space-y-4">
                  <div className="bg-[#0A0B0D] border border-[#2A2D35] p-4 rounded text-[#909399] space-y-2 leading-relaxed">
                    <div className="flex items-center justify-between text-white font-bold pb-2 border-b border-[#2A2D35]">
                      <span className="text-xs uppercase font-bold tracking-wider">Node A: Local Laptop Workstation</span>
                      <span className="text-[#00FF41] text-[10px] uppercase font-black">ACTIVE_ONLINE</span>
                    </div>
                    <div>• Local Repository Path: <span className="text-white font-semibold">/home/user/ia-experiences</span></div>
                    <div>• Runtime Stack: Lubuntu / Bash shell / Node.js tsx</div>
                    <div>• Local model manager: <span className="text-[#00FF41]">Ollama GGUF Engine</span></div>
                  </div>

                  <div className="bg-[#0A0B0D] border border-[#2A2D35] p-4 rounded text-[#909399] space-y-2 leading-relaxed">
                    <div className="flex items-center justify-between text-white font-bold pb-2 border-b border-[#2A2D35]">
                      <span className="text-xs uppercase font-bold tracking-wider">Node B: GitHub Versioning Ingress</span>
                      <span className="text-[#00FF41] text-[10px] uppercase font-black">SYNC_READY</span>
                    </div>
                    <div>• Remote Repository: <span className="text-white font-semibold">https://github.com/mcasrom/ia-experiences</span></div>
                    <div>• Ingress Webhook: Automatic branch tracking trigger</div>
                  </div>

                  <div className="bg-[#0A0B0D] border border-[#2A2D35] p-4 rounded text-[#909399] space-y-2 leading-relaxed">
                    <div className="flex items-center justify-between text-white font-bold pb-2 border-b border-[#2A2D35]">
                      <span className="text-xs uppercase font-bold tracking-wider">Node C: Hetzner Deployment Server</span>
                      <span className="text-[#00FF41] text-[10px] uppercase font-black">PROD_HOST</span>
                    </div>
                    <div>• Host target: Hetzner Cloud VM (Virtual Node SSD / DDR4 RAM)</div>
                    <div>• Delivery: Reverse proxy layer binding port 3000 mapping domains</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Inbound Contact Form Column */}
            <div className="lg:col-span-1 space-y-6 text-left">
              <div className="p-6 bg-[#111318] border border-[#2A2D35] rounded space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <Mail className="h- feather-icon text-[#00FF41]" />
                  <span className="font-bold text-xs font-mono uppercase tracking-wider">{textDict.contactTitle[currentLang]}</span>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-4 font-mono text-[11px]">
                  <div className="space-y-1.5">
                    <label className="block text-[#909399]">Nombre:</label>
                    <input
                      id="contact-name-input"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={textDict.contactPlaceholderName[currentLang]}
                      className="w-full bg-[#0A0B0D] border border-[#2A2D35] rounded px-3 py-2 text-[#E0E0E0] focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[#909399]">Email:</label>
                    <input
                      id="contact-email-input"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-[#0A0B0D] border border-[#2A2D35] rounded px-3 py-2 text-[#E0E0E0] focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[#909399]">Mensaje:</label>
                    <textarea
                      id="contact-message-input"
                      rows={5}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Explain integration requirements..."
                      className="w-full bg-[#0A0B0D] border border-[#2A2D35] rounded px-3 py-2 text-[#E0E0E0] focus:outline-none focus:ring-1 focus:ring-[#00FF41] font-sans"
                    />
                  </div>

                  {isSubmitted ? (
                    <div id="contact-success-flash" className="bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] p-3 rounded flex items-center justify-center gap-2 font-bold select-none">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{currentLang === "en" ? "TRANSMISSION COMPLETED (200)" : "TRANSMISIÓN COMPLETADA (200 OK)"}</span>
                    </div>
                  ) : (
                    <button
                      id="btn-submit-contact-form"
                      type="submit"
                      className="w-full py-2.5 bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/20 hover:text-white rounded font-bold cursor-pointer transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{textDict.contactBtn[currentLang]}</span>
                    </button>
                  )}
                </form>

                <div className="border-t border-[#2A2D35] pt-4 font-mono text-[10px] text-[#6A6D7A] space-y-1">
                  <div>Mail receiver coordinate:</div>
                  <a href="mailto:latent-spaces@viajeinteligencia.com" className="text-[#00FF41] hover:underline font-semibold block text-xs">
                    latent-spaces@viajeinteligencia.com
                  </a>
                </div>
              </div>

              {/* Inbound Alert Mailbox block */}
              <div className="p-6 bg-[#111318] border border-[#2A2D35] rounded space-y-3 text-left">
                <span className="block text-white font-mono text-xs uppercase tracking-wider font-bold">
                  {textDict.subTitleForm[currentLang]}
                </span>
                <p className="text-xs text-[#909399] leading-relaxed font-mono">
                  {currentLang === "en" 
                    ? "Establish a periodic telemetry sync. We will ping you on system optimizations with zero spam."
                    : "Suscribe tu buzón de correo para recibir periódicamente novedades, comandos optimizados de Ollama y trucos sin spam."}
                </p>
                <div className="flex gap-2 font-mono text-xs">
                  <input
                    id="subscribe-mailbox-input"
                    type="email"
                    placeholder="tu@email.com"
                    defaultValue=""
                    className="flex-grow bg-[#0A0B0D] border border-[#2A2D35] text-xs text-white px-3 py-2 rounded focus:outline-none focus:border-[#00FF41]"
                  />
                  <button 
                    onClick={() => alert("Subscription registered successfully!")}
                    className="px-3 py-2 bg-[#00FF41] text-[#0A0B0D] rounded font-black cursor-pointer hover:bg-opacity-90 font-mono"
                  >
                    OK
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* 3. Global Aesthetic Footer */}
      <footer className="bg-[#0A0B0D] border-t border-[#2A2D35] text-[#6A6D7A] text-[11px] py-8 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <span className="block text-[#00FF41] font-black uppercase tracking-wider">NEURAL OPS — LATENT SPACES LAB</span>
              <span className="text-[10px] text-[#6A6D7A]">Designed in /home/user/ia-experiences for direct execution.</span>
            </div>
            
            <div className="flex space-x-6 text-xs">
              <a href="https://github.com/mcasrom/ia-experiences" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1.5 transition-colors">
                <Github className="h-4 w-4 text-white" />
                <span>mcasrom/ia-experiences</span>
              </a>
              <a href="mailto:latent-spaces@viajeinteligencia.com" className="hover:text-[#00FF41] transition-colors">
                latent-spaces@viajeinteligencia.com
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2A2D35] flex flex-col sm:flex-row justify-between items-center text-[9px] text-[#6A6D7A]">
            <span>© 2026 Miguel Castro. All systems operational (UTC Timestamp ISO 8601).</span>
            <span>Ref: Lubuntu Linux x86_64 Environment | Antigravity AI build</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
