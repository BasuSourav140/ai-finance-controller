import type { LLMConfig } from "../../types";

/*
 * ============================================================
 * LLM CONFIGURATION
 * ============================================================
 *
 * The Finance Controller is provider-neutral at the
 * application layer.
 *
 * The user supplies:
 *
 * - Inference endpoint
 * - Optional API key
 * - Optional model name
 *
 * Configuration is stored locally in the browser for
 * convenience in the current client-side architecture.
 */

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  endpoint: "",
  apiKey: "",
  model: "",
};

const LLM_CONFIG_STORAGE_KEY =
  "ai-finance-controller-llm-config";

/*
 * ============================================================
 * LOAD CONFIGURATION
 * ============================================================
 */

export function loadLLMConfig(): LLMConfig {
  try {
    const stored =
      localStorage.getItem(
        LLM_CONFIG_STORAGE_KEY,
      );

    if (!stored) {
      return {
        ...DEFAULT_LLM_CONFIG,
      };
    }

    const parsed: unknown =
      JSON.parse(stored);

    if (
      parsed === null ||
      typeof parsed !== "object"
    ) {
      return {
        ...DEFAULT_LLM_CONFIG,
      };
    }

    const config =
      parsed as Partial<LLMConfig>;

    return {
      endpoint:
        typeof config.endpoint === "string"
          ? config.endpoint
          : "",
      apiKey:
        typeof config.apiKey === "string"
          ? config.apiKey
          : "",
      model:
        typeof config.model === "string"
          ? config.model
          : "",
    };
  } catch {
    return {
      ...DEFAULT_LLM_CONFIG,
    };
  }
}

/*
 * ============================================================
 * SAVE CONFIGURATION
 * ============================================================
 */

export function saveLLMConfig(
  config: LLMConfig,
): void {
  try {
    localStorage.setItem(
      LLM_CONFIG_STORAGE_KEY,
      JSON.stringify({
        endpoint:
          config.endpoint,
        apiKey:
          config.apiKey ?? "",
        model:
          config.model ?? "",
      }),
    );
  } catch {
    /*
     * Storage failures should not prevent
     * the application from continuing to run.
     */
  }
}