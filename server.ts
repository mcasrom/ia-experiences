import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { BLOG_POSTS } from "./src/data/posts";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// JSON database file configuration for dynamic entries and comments
const DB_FILE = path.join(process.cwd(), "db.json");

interface DBLayout {
  posts: any[];
  comments: any[];
}

function getDatabase(): DBLayout {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultDb: DBLayout = {
        posts: BLOG_POSTS,
        comments: [
          {
            id: "comm-1",
            postId: "post-1",
            authorName: "SysOperator",
            avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=SysOperator",
            message: "Excelente artículo sobre el espacio latente y la temperatura. En Hetzner Cloud la latencia ronda los 45ms.",
            timestamp: "2026-06-18T12:00:00Z"
          },
          {
            id: "comm-2",
            postId: "post-1",
            authorName: "DevUser",
            avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=DevUser",
            message: "Thanks for the multi-language token factor analysis. Super clear!",
            timestamp: "2026-06-18T13:42:00Z"
          },
          {
            id: "comm-3",
            postId: "post-2",
            authorName: "DockerFan",
            avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=DockerFan",
            message: "Ollama run under CPU is indeed slow. I migrated to RTX 4070 and it runs incredibly smooth.",
            timestamp: "2026-06-15T10:15:00Z"
          }
        ]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading database:", e);
    return { posts: BLOG_POSTS, comments: [] };
  }
}

function saveDatabase(db: DBLayout) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing database:", e);
  }
}

// ==================== SEO & PWA ENDPOINTS ====================

// 1. Robots.txt dynamic serve
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /api/admin/

Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
`);
});

// 2. Sitemap.xml dynamic indexation builder
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const host = `${req.protocol}://${req.get("host")}`;
  const db = getDatabase();
  
  const urls = [
    { loc: "", changefreq: "daily", priority: "1.0" },
    { loc: "/#blog", changefreq: "daily", priority: "0.9" },
    { loc: "/#playground", changefreq: "weekly", priority: "0.8" },
    { loc: "/#metrics", changefreq: "weekly", priority: "0.7" },
    { loc: "/#pwa-admin", changefreq: "daily", priority: "0.8" },
    { loc: "/#about", changefreq: "monthly", priority: "0.5" }
  ];

  db.posts.forEach((post) => {
    urls.push({
      loc: `/posts/${post.slug}`,
      changefreq: "weekly",
      priority: "0.8"
    });
  });

  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${host}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`);
});

// 3. Dynamic manifest.json for Progressive Web App (PWA) installation
app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "NEURAL OPS - LATENT SPACES LAB",
    short_name: "NEURALOPS",
    description: "Bilingual logbook on Linux, Ollama execution parameters, sitemap validation and progressive offline worker capabilities.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0A0B0D",
    theme_color: "#00FF41",
    icons: [
      {
        src: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  });
});

// 4. Dynamic sw.js Service Worker caching logic
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`// Auto-generated Service Worker for NEURAL OPS PWA
const CACHE_NAME = 'neural-ops-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API queries to avoid stale responses on telemetry parameters
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log("Network request failed, serving offline cache", err);
      });
      return cachedResponse || fetchPromise;
    })
  );
});
`);
});

// ==================== ADMINISTRATIVE & COMMENTS APIs ====================

// A. Get list of posts (dynamic + seeded static records merged)
app.get("/api/posts", (req, res) => {
  const db = getDatabase();
  res.json(db.posts);
});

// B. Upload new architecture post (Admin protected by password lock)
app.post("/api/posts", (req, res) => {
  const { password, post } = req.body;
  if (password !== "admin-ops-2026") {
    return res.status(403).json({ error: "Access denied. Invalid password." });
  }

  if (!post || !post.title || !post.content || !post.title.en || !post.title.es) {
    return res.status(400).json({ error: "Required post payloads are missing or incomplete." });
  }

  const db = getDatabase();
  const titleEn = post.title.en;
  const slug = post.slug || titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  // Verify duplicates slug
  if (db.posts.some((p) => p.slug === slug)) {
    return res.status(400).json({ error: "A post with this identical slug/title already exists." });
  }

  const newPost = {
    id: `post-${Date.now()}`,
    slug,
    category: post.category || "Infrastructure",
    tags: post.tags && Array.isArray(post.tags) ? post.tags : ["General"],
    date: post.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    readTime: post.readTime || "6 min read",
    author: post.author || "M. Castro",
    stats: { stars: 0, reads: 0 },
    headerImage: post.headerImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    title: post.title,
    summary: post.summary || { en: titleEn.substring(0, 100) + "...", es: (post.title.es).substring(0, 100) + "..." },
    content: post.content
  };

  db.posts.unshift(newPost);
  saveDatabase(db);
  res.json({ success: true, post: newPost });
});

// C. Delete existing post (Admin protected by password lock)
app.delete("/api/posts/:id", (req, res) => {
  const password = req.query.password || req.body.password;
  if (password !== "admin-ops-2026") {
    return res.status(403).json({ error: "Access denied. Invalid password." });
  }

  const db = getDatabase();
  const id = req.params.id;
  const initialLength = db.posts.length;
  db.posts = db.posts.filter((p) => p.id !== id);
  // Also delete associated comments
  db.comments = db.comments.filter((c) => c.postId !== id);

  if (db.posts.length === initialLength) {
    return res.status(404).json({ error: "Requested post identifier not found." });
  }

  saveDatabase(db);
  res.json({ success: true, message: "Architectural post removed successfully." });
});

// D. Get comments for a post (or all comments)// D. Get comments for a post (or all comments)
app.get("/api/comments", (req, res) => {
  const db = getDatabase();
  const { postId, password } = req.query;

  // If the admin password is correct, return ALL comments (approved + pending)
  if (password === "admin-ops-2026") {
    if (postId) {
      const postComments = db.comments.filter((c) => c.postId === postId);
      return res.json(postComments);
    }
    return res.json(db.comments);
  }

  // Otherwise, only return approved/standard comments (reverse compatibility check too)
  if (postId) {
    const postComments = db.comments.filter(
      (c) => c.postId === postId && (c.status === "approved" || !c.status)
    );
    return res.json(postComments);
  }

  const approvedComments = db.comments.filter((c) => c.status === "approved" || !c.status);
  res.json(approvedComments);
});

// E. Add user comment (Very low friction - accepts nickname and message; moderates for profanity)
app.post("/api/comments", async (req, res) => {
  const { postId, authorName, message, avatarUrl } = req.body;
  if (!postId || !authorName || !message || !authorName.trim() || !message.trim()) {
    return res.status(400).json({ error: "postId, authorNickname and comment message are mandatory." });
  }

  const db = getDatabase();
  
  // Make sure post exists
  if (!db.posts.some((p) => p.id === postId)) {
    return res.status(404).json({ error: "Associated target post not found." });
  }

  const cleanMessage = message.substring(0, 1000).trim();
  
  // Analyze content using local filters + Gemini AI check!
  const moderationResult = await analyzeCommentContent(cleanMessage);

  const newComment = {
    id: `comm-${Date.now()}`,
    postId,
    authorName: authorName.substring(0, 36).trim(),
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName.trim())}`,
    message: cleanMessage,
    timestamp: new Date().toISOString(),
    status: moderationResult.isProfane ? "pending" : "approved",
    moderatorFlag: moderationResult.isProfane,
    moderatorReason: moderationResult.isProfane ? moderationResult.explanation : undefined
  };

  db.comments.push(newComment);
  saveDatabase(db);

  res.json({ 
    success: true, 
    comment: newComment,
    retained: moderationResult.isProfane,
    reason: moderationResult.isProfane ? moderationResult.explanation : undefined
  });
});

// F. Delete/Moderate user comment (Admin protected by password lock)
app.delete("/api/comments/:id", (req, res) => {
  const password = req.query.password || req.body.password;
  if (password !== "admin-ops-2026") {
    return res.status(403).json({ error: "Access denied. Invalid password." });
  }

  const db = getDatabase();
  const id = req.params.id;
  const initialLength = db.comments.length;
  db.comments = db.comments.filter((c) => c.id !== id);

  if (db.comments.length === initialLength) {
    return res.status(440).json({ error: "Target comment not found." });
  }

  saveDatabase(db);
  res.json({ success: true, message: "Comment moderated/removed." });
});

// G. Approve a pending comment (Admin protected by password lock)
app.put("/api/comments/:id/approve", (req, res) => {
  const { password } = req.body;
  if (password !== "admin-ops-2026") {
    return res.status(403).json({ error: "Access denied. Invalid password." });
  }

  const db = getDatabase();
  const id = req.params.id;
  const comment = db.comments.find((c) => c.id === id);

  if (!comment) {
    return res.status(404).json({ error: "Target comment not found." });
  }

  comment.status = "approved";
  comment.moderatorFlag = false;

  saveDatabase(db);
  res.json({ success: true, comment });
});

// Lazy initialization of Gemini client as per guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Playground requests may fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_LOCAL_DEV",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Advanced Content Moderation check with fallback local dictionary
async function analyzeCommentContent(text: string): Promise<{ isProfane: boolean; explanation: string }> {
  // Check local dictionary of common vulgarities/swears (bilingual) for absolute offline safety
  const badWordsSpanish = [
    "mierda", "gilipollas", "cabron", "cabrón", "puta", "puto", "joder", "concha", "coño", "cono", "maricon", "maricón", 
    "pendejo", "hijo de puta", "hijodeputa", "chupa", "culiado", "culiazo", "pingo", "verga", "zorra", "mamadas"
  ];
  const badWordsEnglish = ["shit", "fuck", "asshole", "bitch", "bastard", "cunt", "dick", "fucker", "motherfucker"];
  
  const lowercaseText = text.toLowerCase();
  for (const word of [...badWordsSpanish, ...badWordsEnglish]) {
    if (lowercaseText.includes(word)) {
      return { 
        isProfane: true, 
        explanation: `Filtro local detectó palabra no permitida: "${word}"` 
      };
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { isProfane: false, explanation: "Gemini API Key missing - local dictionary checks passed." };
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analiza el siguiente comentario de un usuario en un blog técnico y determina si contiene malas palabras, groserías, insultos, contenido soez, obsceno o de muy mal gusto en español o inglés.
Responde estrictamente con un JSON válido en este preciso formato, sin markdown ni comillas externas adicionales de bloques de código:
{
  "isProfane": true, o false,
  "explanation": "breve descripción en español de la palabra soez detectada o por qué es ofensivo"
}

Comentario: "${text.replace(/"/g, '\\"')}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const body = response.text?.trim() || "";
    const parsed = JSON.parse(body);
    return {
      isProfane: !!parsed.isProfane,
      explanation: parsed.explanation || "Filtro de Inteligencia Artificial (Gemini)."
    };
  } catch (err) {
    console.warn("Gemini Content Moderation pipeline fallback used.", err);
    return { isProfane: false, explanation: "Fallback de Red - Filtro local completado." };
  }
}

// REST API for dynamic AI response comparison (illustrating temperature, system instructions, and boundaries)
app.post("/api/prompt-compare", async (req, res) => {
  const { prompt, profile } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "A valid prompt string is required." });
  }

  const selectedProfile = profile || "default";

  // Define professional configuration profiles to showcase differences in AI behaviors
  let config: any = {};
  let systemInstruction = "";
  let profileLabel = "";
  let systemBehaviorDesc = "";

  switch (selectedProfile) {
    case "factual":
      config = {
        temperature: 0.1,
        topP: 0.1,
        maxOutputTokens: 800,
      };
      systemInstruction = "You are a professional, highly precise, strictly factual Linux Systems Architect and AI researcher. Answer in a factual, direct, concise, and academic tone. Do NOT extrapolate or assume anything. Use Spanish if asked in Spanish, otherwise English.";
      profileLabel = "Strictly Factual & Deterministic (Low Temp)";
      systemBehaviorDesc = "Temperature 0.1: Minimizes random sampling. Results are highly deterministic, focused on precision and technical correctness, reducing creative drift or hallucinations.";
      break;

    case "creative":
      config = {
        temperature: 1.2,
        topP: 0.95,
        maxOutputTokens: 1000,
      };
      systemInstruction = "You are a highly creative and expressive AI philosopher. Answer the prompt using vivid analogies, deep structural storytelling, and speculative insights. Introduce philosophical nuances and colorful comparisons. Use Spanish if asked in Spanish, otherwise English.";
      profileLabel = "Creative & Speculative (High Temp)";
      systemBehaviorDesc = "Temperature 1.2: Elevates random sampling space. Highlights broader vocabulary and complex analogies, but increases the probability of speculative reasoning or technical hallucinations.";
      break;

    case "concise":
      config = {
        temperature: 0.7,
        maxOutputTokens: 120, // Strict cutoff
      };
      systemInstruction = "You are an executive assistant. Summarize your response into a single, punchy paragraph. Do not exceed 80 words. Be direct.";
      profileLabel = "Strictly Bound Executive (Low Token Budget)";
      systemBehaviorDesc = "Max Output Tokens 120: Encforces a strict hard token budget. Shows how the token length limits force compression and prevent long-winded compliance.";
      break;

    case "unconstrained":
    default:
      config = {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1500,
      };
      systemInstruction = "You are a helpful intellectual companion. Provide a comprehensive, detailed exploration with structure, code/tables if applicable, and deep context. Use Spanish if asked in Spanish, otherwise English.";
      profileLabel = "Balanced Explorer (Balanced Temp)";
      systemBehaviorDesc = "Temperature 0.7: Balanced trade-off. Delivers well-structured layouts, tables, and in-depth explanations suitable for standard web interactions.";
      break;
  }

  // Inject systemInstruction directly into the configuration as supported by @google/genai
  config.systemInstruction = systemInstruction;

  const startTime = Date.now();

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: config,
    });

    const latencyMs = Date.now() - startTime;
    const text = response.text || "No response received from the model.";

    // Roughly estimate tokens as per standard visual approximations (1 token ~ 4 characters)
    const estimatedInputTokens = Math.ceil(prompt.length / 4) + Math.ceil(systemInstruction.length / 4);
    const estimatedOutputTokens = Math.ceil(text.length / 4);
    const totalTokens = estimatedInputTokens + estimatedOutputTokens;

    return res.json({
      success: true,
      text: text,
      metadata: {
        profile: selectedProfile,
        profileLabel,
        systemBehaviorDesc,
        latencyMs,
        tokens: {
          input: estimatedInputTokens,
          output: estimatedOutputTokens,
          total: totalTokens,
        },
        exactPayloadSent: {
          model: "gemini-3.5-flash",
          config: {
            temperature: config.temperature,
            topP: config.topP || "default",
            maxOutputTokens: config.maxOutputTokens,
            systemInstruction: "[Injected System Instruction Overview]"
          }
        }
      }
    });

  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error("Gemini API Error details:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error during AI generation.",
      latencyMs,
      fallbackData: {
        text: `[FALLBACK SIMULATION] Debido a la falta de credenciales o un error de conexión, simulamos la respuesta para demostrar el comportamiento técnico del perfil seleccionado.\n\n` + 
              `**Perfil:** ${profileLabel}\n` +
              `**Comportamiento de temperatura:** El nivel de muestreo probabilístico configurado produce respuestas predecibles y enfocadas.\n\n` +
              `**Análisis técnico del Prompt:** "${prompt}"\n` +
              `En un entorno productivo con conexión API a Hetzner, este perfil procesaría el prompt usando exactamente esta configuración, regulando las alucinaciones si la temperatura es baja o expandiendo el vocabulario abstracto si la temperatura es alta.`,
        metadata: {
          profile: selectedProfile,
          profileLabel,
          systemBehaviorDesc,
          latencyMs,
          tokens: {
            input: Math.ceil(prompt.length / 4),
            output: 220,
            total: Math.ceil(prompt.length / 4) + 220,
          },
          exactPayloadSent: {
            model: "gemini-3.5-flash",
            config: {
              temperature: config.temperature,
              topP: config.topP || "default",
              maxOutputTokens: config.maxOutputTokens,
              systemInstruction: systemInstruction.substring(0, 40) + "..."
            }
          }
        }
      }
    });
  }
});

// Configure Vite middleware in development or static assets in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Server middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static file server active pointing to /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on public port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
