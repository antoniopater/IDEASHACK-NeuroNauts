import { aiBriefResponseSchema, deriveBriefTitle } from "@/lib/brief-schema";
import { dbGetBriefForCompany, dbListApplicationsForBrief } from "@/lib/app-db";
import { hasSupabaseServiceConfig } from "@/lib/server-env";
import type { Metadata } from "next";
import type { ApplicationRow } from "@/lib/application-row";
import ApplicationsManageClient from "./applications-manage-client";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function CompanyBriefApplicationsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <p className="text-gray-700 text-center">
          Brak tokenu dostępu. Użyj linku z wiadomości e-mail.
        </p>
      </div>
    );
  }

  if (!hasSupabaseServiceConfig()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <p className="text-red-600">Brak konfiguracji bazy danych (Supabase lub tryb lokalny JSON).</p>
      </div>
    );
  }

  const brief = await dbGetBriefForCompany(params.id);

  if (!brief || !brief.company_access_token || brief.company_access_token !== token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <p className="text-gray-700 text-center max-w-md">
          Link jest nieprawidłowy lub nie masz dostępu do tego briefu.
        </p>
      </div>
    );
  }

  const fc = aiBriefResponseSchema.safeParse(brief.final_content);
  const briefTitle = fc.success ? deriveBriefTitle(fc.data.cel_rd) : "Brief";

  const rawApps = await dbListApplicationsForBrief(params.id);

  if (rawApps === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <p className="text-red-600">Nie udało się wczytać aplikacji.</p>
      </div>
    );
  }

  const applications = rawApps as ApplicationRow[];

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Aplikacje na brief</h1>
          <p className="text-sm text-gray-600 mt-1">{briefTitle}</p>
        </header>
        <ApplicationsManageClient briefId={params.id} token={token} applications={applications} />
      </div>
    </div>
  );
}
