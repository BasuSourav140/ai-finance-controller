import {
  INVOICE_EXTRACTION_SCHEMA,
} from "./extractionSchema";

import type {
  LLMConfig,
} from "../../types";


/*
 * ============================================================
 * ERRORS
 * ============================================================
 */

export class LLMApiError extends Error {

  readonly statusCode?: number;

  readonly retryAfterSeconds?: number;


  constructor(
    message: string,
    statusCode?: number,
    retryAfterSeconds?: number,
  ) {

    super(message);

    this.name =
      "LLMApiError";

    this.statusCode =
      statusCode;

    this.retryAfterSeconds =
      retryAfterSeconds;
  }
}


/*
 * ============================================================
 * RETRY-AFTER PARSER
 * ============================================================
 *
 * Some HTTP services expose a Retry-After header.
 */

function parseRetryAfterSeconds(
  response: Response,
): number | undefined {

  const headerValue =
    response.headers.get(
      "Retry-After",
    );


  if (!headerValue) {
    return undefined;
  }


  const seconds =
    Number(headerValue);


  if (
    Number.isFinite(seconds) &&
    seconds >= 0
  ) {

    return seconds;
  }


  return undefined;
}


/*
 * ============================================================
 * TYPES
 * ============================================================
 *
 * Generic chat-completions-style response contract.
 */

interface GenericLLMResponse {

  choices?: Array<{

    message?: {

      content?: unknown;

    };

  }>;

}


/*
 * ============================================================
 * EXTRACT RESPONSE CONTENT
 * ============================================================
 */

function extractResponseText(
  response: unknown,
): string {

  if (
    response === null ||
    typeof response !== "object"
  ) {

    throw new LLMApiError(
      "LLM returned an invalid API response.",
    );
  }


  const data =
    response as GenericLLMResponse;


  const content =
    data.choices?.[0]
      ?.message
      ?.content;


  if (
    typeof content !== "string" ||
    !content.trim()
  ) {

    throw new LLMApiError(
      "LLM returned an empty response.",
    );
  }


  return content.trim();
}


/*
 * ============================================================
 * CALL USER LLM
 * ============================================================
 *
 * The application uses a generic chat-completions-style
 * contract.
 *
 * The LLM is responsible ONLY for extracting invoice facts.
 *
 * Policy evaluation, risk calculation, violations and
 * recommendations are handled deterministically by the
 * application.
 */

export async function callLLM(
  prompt: string,
  config: LLMConfig,
): Promise<string> {

  if (
    !config.endpoint.trim()
  ) {

    throw new Error(
      "LLM endpoint is required.",
    );
  }


  const headers: Record<string, string> = {

    "Content-Type":
      "application/json",

  };


  /*
   * API key is optional.
   *
   * When supplied, use the conventional Bearer
   * authentication scheme.
   */

  if (
    config.apiKey?.trim()
  ) {

    headers.Authorization =
      `Bearer ${config.apiKey.trim()}`;
  }


  let response: Response;


  try {

    response =
      await fetch(
        config.endpoint.trim(),
        {
          method: "POST",

          headers,

          body: JSON.stringify({

            model:
              config.model?.trim() ||
              undefined,

            messages: [

              {
                role: "user",

                content:
                  prompt,
              },

            ],

            /*
             * Deterministic extraction is preferred here.
             *
             * The LLM is extracting structured facts rather
             * than making policy decisions.
             */

            temperature: 0,

            /*
             * Invoice extraction should produce only a
             * small JSON object.
             *
             * This prevents unnecessarily long generations
             * from small local models.
             */

            reasoning_effort: "none",

            /*
             * Request structured JSON output.
             *
             * Compatible endpoints can use this schema to
             * constrain their response.
             */

            response_format: {

              type: "json_schema",

              json_schema: {

                name:
                  "invoice_extraction",

                strict:
                  true,

                schema:
                  INVOICE_EXTRACTION_SCHEMA,

              },

            },

          }),
        },
      );

  } catch {

    throw new LLMApiError(
      "Unable to reach the configured LLM endpoint. " +
      "Please check the endpoint and network connection.",
    );
  }


  /*
   * ==========================================================
   * HTTP ERROR HANDLING
   * ==========================================================
   */

  if (!response.ok) {

    let errorBody:
      unknown = null;


    try {

      errorBody =
        await response.json();

    } catch {
      // Keep errorBody as null.
    }


    let message =
      `LLM request failed with status ${response.status}.`;


    if (
      errorBody !== null &&
      typeof errorBody === "object"
    ) {

      const body =
        errorBody as {
          error?: {
            message?: string;
          };
        };


      if (
        typeof body.error?.message ===
        "string"
      ) {

        message =
          body.error.message;
      }
    }


    /*
     * Rate limiting is an API error.
     *
     * It must NOT enter the JSON self-correction
     * loop in aiAgent.ts.
     */

    if (
      response.status === 429
    ) {

      const retryAfterSeconds =
        parseRetryAfterSeconds(
          response,
        );


      throw new LLMApiError(

        retryAfterSeconds !==
        undefined

          ? `LLM rate limit reached. ` +
            `Please retry after approximately ` +
            `${Math.ceil(
              retryAfterSeconds,
            )} seconds.`

          : "LLM rate limit reached. Please try again later.",

        429,

        retryAfterSeconds,
      );
    }


    /*
     * Authentication / authorization.
     */

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      throw new LLMApiError(
        `LLM authentication failed: ${message}`,
        response.status,
      );
    }


    throw new LLMApiError(
      `LLM API error: ${message}`,
      response.status,
    );
  }


  /*
   * ==========================================================
   * PARSE API RESPONSE
   * ==========================================================
   */

  let data: unknown;


  try {

    data =
      await response.json();

  } catch {

    throw new LLMApiError(
      "LLM returned an invalid JSON API response.",
    );
  }


  return extractResponseText(
    data,
  );
}