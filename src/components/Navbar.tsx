/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Language } from "../types";
import { Cpu, Terminal, Github, Globe, Menu, X } from "lucide-react";

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({
  currentLang,
  onLanguageChange,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: "blog", label: { en: "Architecture Blog", es: "Blog de Arquitectura" } },
    { id: "playground", label: { en: "Interactive Arena", es: "Arena Interactiva" } },
    { id: "metrics", label: { en: "System Metrics", es: "Métricas de Sistemas" } },
    { id: "pwa-admin", label: { en: "PWA, SEO & Admin", es: "PWA, SEO y Admin" } },
    { id: "about", label: { en: "About & Contact", es: "Sobre Mí y Contacto" } },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#111318]/95 backdrop-blur-md border-b border-[#2A2D35] text-[#E0E0E0]">
      {/* Design top micro bar */}
      <div className="h-10 border-b border-[#2A2D35] flex items-center justify-between px-4 sm:px-6 bg-[#0A0B0D] select-none font-mono text-[10px]">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
          </div>
          <span className="text-[#6A6D7A] hidden xs:inline">/home/user/ia-experiences/main.sh</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="tracking-[0.15em] font-bold text-[#6A6D7A] uppercase">
            STATUS: <span className="text-[#00FF41]">OPERATIONAL</span>
          </div>
          <span className="text-[#2A2D35]">|</span>
          <div className="tracking-[0.1em] font-bold text-[#6A6D7A] uppercase">
            LANG: [{currentLang.toUpperCase()}]
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand Frame */}
          <div 
            onClick={() => setActiveTab("blog")}
            className="flex items-center space-x-3 cursor-pointer group"
            id="brand-logo"
          >
            <div className="p-2 bg-[#0A0B0D] border border-[#2A2D35] rounded group-hover:border-[#00FF41] transition-all">
              <Cpu className="h-5 w-5 text-[#00FF41]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-black tracking-tighter text-white uppercase group-hover:text-[#00FF41] transition-colors">
                  NEURAL<span className="text-[#00FF41]">OPS</span>
                </span>
                <span className="text-[9px] bg-[#0A0B0D] border border-[#2A2D35] text-[#00FF41] px-1.5 py-0.2 rounded font-mono">
                  v1.2
                </span>
              </div>
              <p className="text-[9px] text-[#6A6D7A] tracking-wider uppercase font-mono">
                {currentLang === "en" ? "AI & Systems Architecture" : "IA y Arquitectura de Sistemas"}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-2 font-mono text-xs">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded transition-all tracking-wide ${
                  activeTab === item.id
                    ? "bg-[#0A0B0D] border border-[#00FF41]/30 text-[#00FF41] font-semibold"
                    : "text-[#909399] hover:text-white hover:bg-[#0A0B0D]/50"
                }`}
              >
                {item.label[currentLang]}
              </button>
            ))}
          </div>

          {/* Right Sided Controls */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Bilingual Toggle BUTTON */}
            <div className="flex items-center bg-[#0A0B0D] border border-[#2A2D35] rounded p-1 font-mono text-[10px]">
              <button
                id="lang-en-btn"
                onClick={() => onLanguageChange("en")}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentLang === "en"
                    ? "bg-[#00FF41] text-[#0A0B0D] font-black"
                    : "text-[#6A6D7A] hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                id="lang-es-btn"
                onClick={() => onLanguageChange("es")}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentLang === "es"
                    ? "bg-[#00FF41] text-[#0A0B0D] font-black"
                    : "text-[#6A6D7A] hover:text-white"
                }`}
              >
                ES
              </button>
            </div>

            {/* GitHub Call to Action */}
            <a
              id="github-link-cta"
              href="https://github.com/mcasrom/ia-experiences"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0A0B0D] border border-[#2A2D35] hover:border-[#00FF41] rounded text-xs font-mono text-[#E0E0E0] transition-all"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile responsive toggle */}
          <div className="flex md:hidden items-center space-x-3">
            {/* Minimal Mobile Lang Change */}
            <button
              onClick={() => onLanguageChange(currentLang === "en" ? "es" : "en")}
              className="p-1.5 rounded bg-[#0A0B0D] border border-[#2A2D35] text-xs font-mono text-[#909399] hover:text-[#00FF41]"
            >
              <Globe className="h-3.5 w-3.5 inline mr-1" />
              {currentLang.toUpperCase()}
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded bg-[#0A0B0D] border border-[#2A2D35] text-[#909399] hover:text-[#00FF41] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111318] border-t border-[#2A2D35] py-4 px-4 space-y-2 font-mono text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 rounded transition-all ${
                activeTab === item.id
                  ? "bg-[#0A0B0D] border border-[#00FF41]/30 text-[#00FF41] font-semibold"
                  : "text-[#909399] hover:text-white hover:bg-[#0A0B0D]/50"
              }`}
            >
              {item.label[currentLang]}
            </button>
          ))}
          <div className="pt-4 border-t border-[#2A2D35] flex items-center justify-between">
            <span className="text-[#6A6D7A] text-[10px]">REPOS:</span>
            <a
              href="https://github.com/mcasrom/ia-experiences"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-[#00FF41] hover:underline"
            >
              <Github className="h-3.5 w-3.5 text-white" />
              <span>mcasrom/ia-experiences</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
