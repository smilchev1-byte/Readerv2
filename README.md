https://smilchev1-byte.github.io/Readerv2/



export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');
    if (!target) {
      return new Response('Missing ?url=', { status: 400 });
    }
    try {
      const r = await fetch(target);
      const txt = await r.text();
      return new Response(txt, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    } catch (err) {
      return new Response('Fetch failed: ' + err.message, { status: 500 });
    }
  }
}