https://smilchev1-byte.github.io/Readerv2/



export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url=", { status: 400 });
    }

    // Обработка на OPTIONS (CORS preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      const response = await fetch(target, { redirect: "follow" });
      const text = await response.text();

      return new Response(text, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8",
        },
      });
    } catch (err) {
      return new Response("Fetch failed: " + err.message, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  },
};