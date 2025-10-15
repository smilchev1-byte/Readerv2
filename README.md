https://smilchev1-byte.github.io/Readerv2/



export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url=", { status: 400 });
    }

    // handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    try {
      const resp = await fetch(target, { redirect: "follow" });
      const body = await resp.text();

      return new Response(body, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Vary": "Origin",
          "Content-Type": resp.headers.get("content-type") || "text/html; charset=utf-8",
        },
      });
    } catch (err) {
      return new Response("Fetch failed: " + err.message, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Vary": "Origin",
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  },
};