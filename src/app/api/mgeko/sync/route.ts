import { createClient } from "@/lib/supabase/server";
import {
  runMgekoSync,
  type MgekoSyncProgress,
  type MgekoSyncResult,
} from "@/lib/mgeko/run-sync";

export const runtime = "nodejs";

const encoder = new TextEncoder();

type StreamEvent =
  | ({ type: "progress" } & MgekoSyncProgress)
  | { type: "result"; data: MgekoSyncResult }
  | { type: "error"; message: string };

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: StreamEvent,
) {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: { message: "Unauthorized." } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { sessionId?: string; bookmarkExportText?: string; csrfToken?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: { message: "Invalid JSON body." } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: { message: "sessionId is required." } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const bookmarkExportText = body.bookmarkExportText?.trim() || undefined;
  const csrfToken = body.csrfToken?.trim() || undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await runMgekoSync(
          { supabase, userId: user.id },
          { sessionId, bookmarkExportText, csrfToken },
          (progress) => {
            writeEvent(controller, { type: "progress", ...progress });
          },
        );
        writeEvent(controller, { type: "result", data: result });
      } catch (error) {
        writeEvent(controller, {
          type: "error",
          message: error instanceof Error ? error.message : "Sync failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
