import type {
  AgentStatus,
  InvoiceResult,
} from "../types";

import {
  evaluatePolicy,
} from "./policyEngine";

import {
  generateRecommendation,
} from "./recommendationEngine";

const GEMINI_MODEL =
  "gemini-3.6-flash";

const MAX_RETRIES = 1;

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const POLICY_RULES = `
COMPANY EXPENSE POLICY

Rule 1:
Any meal expense over ₹3,000 must be flagged for review.

Rule 2:
Any software or SaaS expense must have a department_code.
If department_code is missing, flag the transaction.

Rule 3:
Every invoice must have a date.
If invoice date is missing, flag it as Critical Risk.
`;

class InvoiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "InvoiceValidationError";
  }
}


/*
 * GeminiApiError represents an error
 * returned by the Gemini API itself.
 *
 * retryable is intentionally kept separate
 * from JSON/schema self-correction.
 */
class GeminiApiError extends Error {
  readonly statusCode?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    statusCode?: number,
    retryAfterSeconds?: number
  ) {
    super(message);

    this.name =
      "GeminiApiError";

    this.statusCode =
      statusCode;

    this.retryAfterSeconds =
      retryAfterSeconds;
  }
}


export type AgentEvent =
  | {
      type: "status";
      status: AgentStatus;
      message: string;
    }
  | {
      type: "retry";
      attempt: number;
      message: string;
    };


export type AgentEventHandler =
  (event: AgentEvent) => void;


/*
 * ============================================================
 * VALIDATE GEMINI RESPONSE
 * ============================================================
 */

function validateInvoiceResult(
  value: unknown
): InvoiceResult {

  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new InvoiceValidationError(
      "Response must be a JSON object."
    );
  }

  const data =
    value as Record<string, unknown>;


  if (
    typeof data.vendor_name !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "vendor_name must be a string."
    );
  }


  if (
    typeof data.total_amount !==
      "number" ||
    !Number.isFinite(
      data.total_amount
    )
  ) {
    throw new InvoiceValidationError(
      "total_amount must be a finite number."
    );
  }


  if (
    typeof data.category !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "category must be a string."
    );
  }


  if (
    typeof data.policy_violation !==
    "boolean"
  ) {
    throw new InvoiceValidationError(
      "policy_violation must be a boolean."
    );
  }


  if (
    !Array.isArray(
      data.violation_details
    )
  ) {
    throw new InvoiceValidationError(
      "violation_details must be an array."
    );
  }


  if (
    !data.violation_details.every(
      (item) =>
        typeof item === "string"
    )
  ) {
    throw new InvoiceValidationError(
      "violation_details must contain strings only."
    );
  }


  if (
    typeof data.strategic_recommendation !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "strategic_recommendation must be a string."
    );
  }


  if (
    typeof data.invoice_date !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "invoice_date must be a string."
    );
  }


  if (
    typeof data.department_code !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "department_code must be a string."
    );
  }


  return {
    vendor_name:
      data.vendor_name,

    total_amount:
      data.total_amount,

    category:
      data.category,

    policy_violation:
      data.policy_violation,

    violation_details:
      data.violation_details,

    /*
     * Gemini does not determine
     * deterministic policy violations.
     *
     * policyEngine.ts fills this later.
     */
    violations: [],

    strategic_recommendation:
      data.strategic_recommendation,

    invoice_date:
      data.invoice_date,

    department_code:
      data.department_code,

    risk_level: "LOW",
  };
}


/*
 * ============================================================
 * EXTRACT GEMINI TEXT
 * ============================================================
 */

function extractGeminiText(
  response: unknown
): string {

  if (
    response === null ||
    typeof response !== "object"
  ) {
    throw new GeminiApiError(
      "Gemini returned an invalid API response."
    );
  }

  const data =
    response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };


  const text =
    data.candidates?.[0]
      ?.content
      ?.parts?.[0]
      ?.text;


  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    throw new GeminiApiError(
      "Gemini returned an empty response."
    );
  }


  return text.trim();
}


/*
 * ============================================================
 * REMOVE CODE FENCES
 * ============================================================
 */

function stripCodeFences(
  text: string
): string {

  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}


/*
 * ============================================================
 * PARSE GEMINI JSON
 * ============================================================
 */

function parseInvoiceResponse(
  responseText: string
): InvoiceResult {

  let parsed: unknown;


  try {

    parsed =
      JSON.parse(
        responseText
      );

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : "Unknown JSON parsing error.";


    throw new InvoiceValidationError(
      `Invalid JSON syntax: ${message}`
    );
  }


  return validateInvoiceResult(
    parsed
  );
}


/*
 * ============================================================
 * INITIAL PROMPT
 * ============================================================
 */

function buildInitialPrompt(
  invoiceText: string
): string {

  return `
You are the AI Finance Controller,
an autonomous financial document
extraction and policy-audit agent.

Your primary responsibility is to
accurately extract facts from the
supplied invoice or receipt.

${POLICY_RULES}

SOURCE DOCUMENT:
----------------
${invoiceText}
----------------

EXTRACTION REQUIREMENTS:

1. Extract the vendor name.
2. Extract the total monetary amount as a number.
3. Determine the expense category.
4. Extract the invoice date.
5. Extract the department_code if present.
6. If a required string value cannot be found,
   return an empty string.
7. Do not invent missing information.
8. total_amount MUST be a JSON number.

OUTPUT REQUIREMENTS:

Return EXACTLY one JSON object.

Do NOT use Markdown.
Do NOT use code fences.
Do NOT add explanations.

The JSON must contain exactly:

{
  "vendor_name": string,
  "total_amount": number,
  "category": string,
  "policy_violation": boolean,
  "violation_details": string[],
  "strategic_recommendation": string,
  "invoice_date": string,
  "department_code": string
}

The application will independently
verify all company policies using
a deterministic policy engine.

Return ONLY valid JSON.
`;
}


/*
 * ============================================================
 * SELF-CORRECTION PROMPT
 * ============================================================
 */

function buildCorrectionPrompt(
  invoiceText: string,
  previousResponse: string,
  errorMessage: string
): string {

  return `
You are correcting your previous response
as an AI Finance Controller.

Your previous response failed client-side
JSON/schema validation.

SELF-CORRECTION REQUIRED.

EXACT VALIDATION ERROR:
${errorMessage}

PREVIOUS RESPONSE:
${previousResponse}

SOURCE DOCUMENT:
----------------
${invoiceText}
----------------

COMPANY POLICY:
${POLICY_RULES}

Correct the exact validation problem.

IMPORTANT:

You failed to provide valid application JSON.

Provide ONLY JSON.
Do NOT use Markdown.
Do NOT use code fences.
Do NOT include explanations.
Do NOT include comments.

The JSON must contain exactly:

{
  "vendor_name": string,
  "total_amount": number,
  "category": string,
  "policy_violation": boolean,
  "violation_details": string[],
  "strategic_recommendation": string,
  "invoice_date": string,
  "department_code": string
}

Make sure:

- vendor_name is a string.
- total_amount is a number.
- category is a string.
- policy_violation is a boolean.
- violation_details is an array of strings.
- strategic_recommendation is a string.
- invoice_date is a string.
- department_code is a string.

Do not invent information.

Return ONLY valid JSON.
`;
}


/*
 * ============================================================
 * PARSE RETRY-AFTER
 * ============================================================
 *
 * Gemini may return retry information in the
 * response body or HTTP headers.
 */

function parseRetryAfterSeconds(
  response: Response,
  errorBody: unknown
): number | undefined {

  const headerValue =
    response.headers.get(
      "Retry-After"
    );


  if (headerValue) {

    const seconds =
      Number(
        headerValue
      );

    if (
      Number.isFinite(seconds) &&
      seconds >= 0
    ) {
      return seconds;
    }
  }


  if (
    errorBody !== null &&
    typeof errorBody === "object"
  ) {

    const body =
      errorBody as {
        error?: {
          details?: Array<{
            retryDelay?: string;
          }>;
        };
      };


    const retryDelay =
      body.error
        ?.details
        ?.find(
          (detail) =>
            typeof detail.retryDelay ===
            "string"
        )
        ?.retryDelay;


    if (retryDelay) {

      const match =
        retryDelay.match(
          /([\d.]+)s/
        );


      if (match) {

        const seconds =
          Number(
            match[1]
          );

        if (
          Number.isFinite(
            seconds
          )
        ) {
          return seconds;
        }
      }
    }
  }


  return undefined;
}


/*
 * ============================================================
 * GEMINI API REQUEST
 * ============================================================
 */

async function callGemini(
  prompt: string,
  apiKey: string
): Promise<string> {

  let response: Response;


  try {

    response =
      await fetch(
        `${GEMINI_API_URL}?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                role: "user",

                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],

            generationConfig: {
              temperature: 0.1,

              responseMimeType:
                "application/json",
            },
          }),
        }
      );

  } catch {

    throw new GeminiApiError(
      "Unable to reach Gemini API. Check your network connection."
    );
  }


  if (!response.ok) {

    let errorBody:
      unknown = null;


    try {

      errorBody =
        await response.json();

    } catch {
      // Keep errorBody as null.
    }


    let apiMessage =
      `Gemini API request failed with status ${response.status}.`;


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
        apiMessage =
          body.error.message;
      }
    }


    /*
     * ========================================================
     * QUOTA / RATE LIMIT
     * ========================================================
     *
     * 429 errors are NOT JSON validation failures.
     *
     * Therefore they must NEVER enter the
     * self-correction retry loop.
     */

    if (
      response.status === 429
    ) {

      const retryAfterSeconds =
        parseRetryAfterSeconds(
          response,
          errorBody
        );


      throw new GeminiApiError(
        retryAfterSeconds !==
          undefined
          ? `Gemini quota or rate limit reached. Please retry after approximately ${Math.ceil(
              retryAfterSeconds
            )} seconds.`
          : "Gemini quota or rate limit reached. Please try again later.",
        429,
        retryAfterSeconds
      );
    }


    /*
     * Invalid API key / authentication.
     */

    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403
    ) {

      throw new GeminiApiError(
        `Gemini authentication or request error: ${apiMessage}`,
        response.status
      );
    }


    throw new GeminiApiError(
      `Gemini API error: ${apiMessage}`,
      response.status
    );
  }


  const data =
    await response.json();


  return extractGeminiText(
    data
  );
}


/*
 * ============================================================
 * UI TIMING
 * ============================================================
 */

function waitForUIUpdate(
  milliseconds = 1200
): Promise<void> {

  return new Promise(
    (resolve) => {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );
}


/*
 * ============================================================
 * MAIN AI FINANCE CONTROLLER PIPELINE
 * ============================================================
 */

export async function processInvoice(
  text: string,
  apiKey: string,
  onEvent?: AgentEventHandler
): Promise<InvoiceResult> {

  /*
   * Basic validation.
   */

  if (!text.trim()) {

    throw new Error(
      "Invoice or receipt text cannot be empty."
    );
  }


  if (!apiKey.trim()) {

    throw new Error(
      "Gemini API key is required."
    );
  }


  let attempt = 0;


  let prompt =
    buildInitialPrompt(
      text
    );


  let previousResponse =
    "";


  let lastError =
    "Unknown agent error.";


  /*
   * ==========================================================
   * STAGE 1 — DOCUMENT EXTRACTION
   * ==========================================================
   */

  onEvent?.({
    type: "status",

    status: "extracting",

    message:
      "Extracting transaction data from document...",
  });


  while (
    attempt <= MAX_RETRIES
  ) {

    try {

      /*
       * Gemini document extraction.
       */

      const response =
        await callGemini(
          prompt,
          apiKey
        );


      previousResponse =
        response;


      /*
       * ========================================================
       * STAGE 2 — JSON VALIDATION
       * ========================================================
       */

      onEvent?.({
        type: "status",

        status: "validating",

        message:
          "Gemini response received. Validating JSON and schema...",
      });


      await waitForUIUpdate(
        1200
      );


      const normalizedResponse =
        attempt > 0
          ? stripCodeFences(
              response
            )
          : response;


      const invoice =
        parseInvoiceResponse(
          normalizedResponse
        );


      /*
       * ========================================================
       * STAGE 3 — POLICY EVALUATION
       * ========================================================
       */

      onEvent?.({
        type: "status",

        status: "evaluating",

        message:
          "Applying deterministic company expense policies...",
      });


      await waitForUIUpdate(
        1200
      );


      const policyResult =
        evaluatePolicy(
          invoice
        );


      /*
       * Recommendation is generated from
       * the deterministic policy result.
       */

      const recommendation =
        generateRecommendation(
          policyResult.violation_details,
          policyResult.risk_level
        );


      /*
       * ========================================================
       * STAGE 4 — COMPLETE
       * ========================================================
       */

      onEvent?.({
        type: "status",

        status: "complete",

        message:
          "Audit completed successfully.",
      });


      /*
       * Final result.
       */

      return {
        ...invoice,

        policy_violation:
          policyResult.policy_violation,

        violation_details:
          policyResult.violation_details,

        violations:
          policyResult.violations,

        strategic_recommendation:
          recommendation,

        risk_level:
          policyResult.risk_level,
      };


    } catch (error) {

      /*
       * ========================================================
       * GEMINI API ERROR
       * ========================================================
       *
       * API errors do NOT trigger self-correction.
       *
       * This includes:
       *
       * - 400
       * - 401
       * - 403
       * - 429
       * - 500
       * - network failures
       */

      if (
        error instanceof
        GeminiApiError
      ) {

        onEvent?.({
          type: "status",

          status: "error",

          message:
            error.message,
        });


        throw error;
      }


      /*
       * ========================================================
       * NON-VALIDATION ERROR
       * ========================================================
       */

      if (
        !(
          error instanceof
          InvoiceValidationError
        )
      ) {

        throw error;
      }


      /*
       * ========================================================
       * VALIDATION ERROR
       * ========================================================
       *
       * Only malformed/schema-invalid Gemini output
       * reaches this section.
       */

      lastError =
        error.message;


      /*
       * ========================================================
       * RETRY LIMIT
       * ========================================================
       */

            if (
        attempt >= MAX_RETRIES
      ) {

        onEvent?.({
          type: "status",

          status: "error",

          message:
            "Self-correction failed. Manual review required.",
        });

        throw new Error(
          `AI Agent failed after ${
            attempt + 1
          } attempts: ${lastError}`,
          {
            cause: error,
          }
        );
      }


      /*
       * ========================================================
       * SELF-CORRECTION
       * ========================================================
       */

      attempt += 1;


  


      onEvent?.({
        type: "status",

        status: "correcting",

        message:
          "AI response failed validation. Starting self-correction...",
      });


      onEvent?.({
        type: "retry",

        attempt,

        message:
          `Retrying Gemini with exact validation error: ${lastError}`,
      });


      prompt =
        buildCorrectionPrompt(
          text,
          previousResponse,
          lastError
        );


      await waitForUIUpdate(
        1200
      );
    }
  }


  throw new Error(
    `AI Agent failed: ${lastError}`
  );
}