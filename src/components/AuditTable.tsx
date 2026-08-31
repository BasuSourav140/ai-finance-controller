import {
  Eye,
  FileWarning,
} from "lucide-react";

import type {
  AuditedInvoice,
} from "../types";

import { StatusBadge } from "./StatusBadge";

interface AuditTableProps {
  invoices: AuditedInvoice[];
  onSelect: (
    invoice: AuditedInvoice
  ) => void;
}

export function AuditTable({
  invoices,
  onSelect,
}: AuditTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.025]">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vendor
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Policy
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actionable Insight
              </th>

              <th className="px-5 py-4" />
            </tr>
          </thead>

          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center"
                >
                  <FileWarning
                    size={30}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    No transactions audited yet.
                  </p>
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const failed =
                  invoice.policy_violation;

                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-200">
                        {invoice.vendor_name ||
                          "Unknown Vendor"}
                      </p>

                      {invoice.invoice_date && (
                        <p className="mt-1 text-xs text-slate-600">
                          {invoice.invoice_date}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-medium text-white">
                        ₹
                        {invoice.total_amount.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">
                        {invoice.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          failed
                            ? "FAIL"
                            : "PASS"
                        }
                      />
                    </td>

                    <td className="max-w-md px-5 py-4">
                      <p
                        className={
                          failed
                            ? "text-xs text-red-300"
                            : "text-xs text-slate-400"
                        }
                      >
                        {
                          invoice.strategic_recommendation
                        }
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onSelect(invoice)
                        }
                        className="rounded-lg border border-white/10 p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                        title="View audit details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}