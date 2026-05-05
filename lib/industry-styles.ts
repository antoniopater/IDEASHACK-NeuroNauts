import { industryOptions } from "@/lib/brief-schema";

const industryToClass: Record<string, string> = {
  "Produkcja przemysłowa": "bg-slate-100 text-slate-800 border-slate-200",
  "Farmaceutyka i biotech": "bg-emerald-100 text-emerald-900 border-emerald-200",
  "Energetyka i OZE": "bg-amber-100 text-amber-900 border-amber-200",
  "IT i oprogramowanie": "bg-blue-100 text-blue-900 border-blue-200",
  "Chemia i materiały": "bg-violet-100 text-violet-900 border-violet-200",
  "Rolnictwo i żywność": "bg-lime-100 text-lime-900 border-lime-200",
  "Transport i logistyka": "bg-orange-100 text-orange-900 border-orange-200",
  "Medycyna i health tech": "bg-teal-100 text-teal-900 border-teal-200",
  Fintech: "bg-indigo-100 text-indigo-900 border-indigo-200",
  Inne: "bg-gray-100 text-gray-800 border-gray-200",
};

export function industryBadgeClass(industry: string): string {
  return industryToClass[industry] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export const filterIndustryOptions = [...industryOptions];
