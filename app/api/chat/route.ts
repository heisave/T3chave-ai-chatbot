type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT =
  "You are The T3chave, a friendly, concise and helpful AI assistant. " +
  "Answer clearly, keep replies focused, and use Markdown formatting when it helps readability.";

const DEFAULT_MODEL = "gemini-flash-latest";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let messages: ChatMessage[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.messages)) {
      messages = body.messages.filter(
        (m: ChatMessage) =>
          m &&
          typeof m.content === "string" &&
          (m.role === "user" || m.role === "assistant")
      );
    }
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const res = await fetch(
      `${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Gemini API error:", res.status, detail);

      // Surface Google's own message (e.g. quota, billing, model errors)
      let message = `Gemini request failed (${res.status}).`;
      try {
        const parsed = JSON.parse(detail);
        if (typeof parsed?.error?.message === "string") {
          message = parsed.error.message;
        }
      } catch {
        // keep the generic message
      }

      return Response.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const reply: string = Array.isArray(parts)
      ? parts
          .map((p: { text?: string }) => p?.text ?? "")
          .join("")
          .trim()
      : "";

    if (!reply) {
      const reason = data?.promptFeedback?.blockReason;
      return Response.json(
        {
          error: reason
            ? `The request was blocked: ${reason}.`
            : "The model returned an empty response.",
        },
        { status: 502 }
      );
    }

    return Response.json({ reply });
  } catch (error) {
    console.error("Failed to reach Gemini:", error);
    return Response.json(
      { error: "Could not reach the AI service." },
      { status: 502 }
    );
  }
}
