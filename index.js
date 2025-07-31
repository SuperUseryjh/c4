
function addCORSHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', 'https://c4.mr-onion-blog.fun');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export default {
  async fetch(request, env, ctx) {
    // 处理 OPTIONS 请求 (CORS 预检请求)
    if (request.method === 'OPTIONS') {
      return addCORSHeaders(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);

    if (url.pathname === '/login' && request.method === 'POST') {
      return addCORSHeaders(await handleLogin(request, env));
    }

    if (url.pathname === '/guess' && request.method === 'POST') {
      return addCORSHeaders(await handleGuess(request, env));
    }

    return addCORSHeaders(new Response('Not Found', { status: 404 }));
  },
};

const sessions = new Map(); // 内存会话存储 (为简单起见，不持久化)

async function handleLogin(request, env) {
  const { username } = await request.json();
  if (!username) {
    return new Response('Username is required', { status: 400 });
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { username, score: 0 });

  return new Response(JSON.stringify({ sessionId }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGuess(request, env) {
  const { sessionId, guess } = await request.json();
  if (!sessionId || guess === undefined) {
    return new Response('Session ID and guess are required', { status: 400 });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return new Response('Invalid session', { status: 401 });
  }

  const targetNumber = Math.floor(Math.random() * 100) + 1;

  if (guess === targetNumber) {
    let scoreStr = await env.BOMB_KV.get(session.username);
    let score = scoreStr ? parseInt(scoreStr) : 0;
    score++;
    await env.BOMB_KV.put(session.username, score.toString());

    return new Response(JSON.stringify({ correct: true, targetNumber, newScore: score }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ correct: false, targetNumber }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
