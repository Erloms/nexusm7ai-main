// src/lib/ai-models.ts

interface AIModel {
  id: string;
  name: string;
  group?: string;
  provider: 'pollinations' | 'google' | 'groq' | 'openrouter';
  internalModelName?: string; // For providers where the 'id' might not be the exact model name for their API
}

export const AI_MODELS: AIModel[] = [
  // Pollinations.ai models (user confirmed usable)
  { id: "openai", name: "OpenAI GPT-4o-mini", group: "Pollinations.ai", provider: "pollinations" },
  { id: "llama", name: "Llama 3.3 70B", group: "Pollinations.ai", provider: "pollinations" },
  { id: "mistral", name: "Mistral Nemo", group: "Pollinations.ai", provider: "pollinations" },
  { id: "deepseek", name: "DeepSeek-V3", group: "Pollinations.ai", provider: "pollinations" },
  { id: "deepseek-r1", name: "DeepSeek-R1 Distill Qwen 32B", group: "Pollinations.ai", provider: "pollinations" },
  { id: "phi", name: "Phi-4 Multimodal Instruct", group: "Pollinations.ai", provider: "pollinations" },
  { id: "qwen-coder", name: "Qwen 2.5 Coder 32B", group: "Pollinations.ai", provider: "pollinations" },

  // Google models
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", group: "Google", provider: "google", internalModelName: "gemini-1.5-pro-latest" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", group: "Google", provider: "google", internalModelName: "gemini-1.5-flash-latest" },

  // Groq models
  { id: "llama-4-maverick", name: "Llama 4 Maverick 17B", group: "Groq", provider: "groq", internalModelName: "meta-llama/llama-4-maverick-17b-128e-instruct" },
  { id: "llama-prompt-guard", name: "Llama Prompt Guard 86M", group: "Groq", provider: "groq", internalModelName: "meta-llama/llama-prompt-guard-2-86m" },
  { id: "deepseek-r1-distill-llama", name: "DeepSeek R1 Distill Llama 70B", group: "Groq", provider: "groq", internalModelName: "deepseek-r1-distill-llama-70b" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", group: "Groq", provider: "groq", internalModelName: "llama-3.3-70b-versatile" },

  // OpenRouter models
  { id: "gemma-3n-4b", name: "Gemma 3n 4B", group: "OpenRouter", provider: "openrouter", internalModelName: "google/gemma-3n-e4b-it:free" },
  { id: "qwen3-235b-a22b", name: "Qwen 3 235B A22B", group: "OpenRouter", provider: "openrouter", internalModelName: "qwen/qwen3-235b-a22b:free" },
  { id: "deepseek-r1-openrouter", name: "DeepSeek R1", group: "OpenRouter", provider: "openrouter", internalModelName: "deepseek/deepseek-r1:free" },
  { id: "deepseek-chat-v3", name: "DeepSeek Chat V3", group: "OpenRouter", provider: "openrouter", internalModelName: "deepseek/deepseek-chat-v3-0324:free" },
  { id: "deepcoder-14b-preview", name: "Deepcoder 14B Preview", group: "OpenRouter", provider: "openrouter", internalModelName: "agentica-org/deepcoder-14b-preview:free" },
  { id: "llama-4-maverick-openrouter", name: "Llama 4 Maverick", group: "OpenRouter", provider: "openrouter", internalModelName: "meta-llama/llama-4-maverick:free" },
  { id: "kimi-dev-72b", name: "Kimi Dev 72B", group: "OpenRouter", provider: "openrouter", internalModelName: "moonshotai/kimi-dev-72b:free" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", group: "OpenRouter", provider: "openrouter", internalModelName: "anthropic/claude-3-haiku:free" },
];