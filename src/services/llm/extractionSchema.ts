export const INVOICE_EXTRACTION_SCHEMA = {
  type: "object",

  properties: {

    vendor_name: {
      type: "string",
    },

    total_amount: {
      type: "number",
    },

    category: {
      type: "string",
    },

    invoice_date: {
      type: "string",
    },

    department_code: {
      type: "string",
    },

  },

  required: [
    "vendor_name",
    "total_amount",
    "category",
    "invoice_date",
    "department_code",
  ],

  additionalProperties: false,

} as const;


export type InvoiceExtractionSchema =
  typeof INVOICE_EXTRACTION_SCHEMA;