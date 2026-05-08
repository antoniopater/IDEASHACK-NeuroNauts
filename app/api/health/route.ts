import { dbHealthCheckLocal } from "@/lib/app-db";
import { isLocalJsonDb } from "@/lib/db-mode";
import { completeChat } from "@/lib/llm-chat";
import {
  hasLlmConfigured,
  hasSupabasePublicConfig,
} from "@/lib/server-env";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Status = "ok" | "error" | "local";

export async function GET() {
  let supabase: Status = "error";
  let llm: Status = "error";

  if (isLocalJsonDb()) {
    supabase = (await dbHealthCheckLocal()) ? "local" : "error";
  } else if (hasSupabasePublicConfig()) {
    try {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await client.from("briefs").select("id").limit(1);
      supabase = error ? "error" : "ok";
    } catch {
      supabase = "error";
    }
  }

  if (hasLlmConfigured()) {
    try {
      await completeChat({
        purpose: "ping",
        system: "Respond with exactly one word: OK.",
        user: "ping",
        maxTokens: 16,
      });
      llm = "ok";
    } catch {
      llm = "error";
    }
  }

  return NextResponse.json({
    supabase,
    llm,
    anthropic: llm,
  });
}
