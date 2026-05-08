import { industryOptions } from "@/lib/brief-schema";

const industryToClass: Record<string, string> = {
  "Industrial Manufacturing": "bg-slate-100 text-slate-800 border-slate-200",
  "Pharmaceuticals & Biotech": "bg-emerald-100 text-emerald-900 border-emerald-200",
  "Energy & Renewables": "bg-amber-100 text-amber-900 border-amber-200",
  "IT & Software": "bg-blue-100 text-blue-900 border-blue-200",
  "Chemistry & Materials": "bg-violet-100 text-violet-900 border-violet-200",
  "Agriculture & Food": "bg-lime-100 text-lime-900 border-lime-200",
  "Transport & Logistics": "bg-orange-100 text-orange-900 border-orange-200",
  "Medicine & HealthTech": "bg-teal-100 text-teal-900 border-teal-200",
  FinTech: "bg-indigo-100 text-indigo-900 border-indigo-200",
  Other: "bg-gray-100 text-gray-800 border-gray-200",
};

export function industryBadgeClass(industry: string): string {
  return industryToClass[industry] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export const filterIndustryOptions = [...industryOptions];
