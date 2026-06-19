/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "en" | "es";

export interface Post {
  id: string;
  slug: string;
  title: {
    en: string;
    es: string;
  };
  category: string;
  summary: {
    en: string;
    es: string;
  };
  content: {
    en: string;
    es: string;
  };
  headerImage: string;
  date: string;
  readTime: string;
  tags: string[];
  author: string;
  stats: {
    stars: number;
    reads: number;
  };
}

export interface PromptProfile {
  id: string;
  name: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  details: {
    en: string;
    es: string;
  };
  temperature: number;
  maxTokens: number;
}

export interface PlaygroundResult {
  text: string;
  metadata: {
    profile: string;
    profileLabel: string;
    systemBehaviorDesc: string;
    latencyMs: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    exactPayloadSent: {
      model: string;
      config: {
        temperature: number;
        topP: string | number;
        maxOutputTokens: number;
        systemInstruction: string;
      };
    };
  };
  isFallback?: boolean;
}
