
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/login' && request.method === 'POST') {
      return handleLogin(request);
    }

    if (url.pathname === '/guess' && request.method === 'POST') {
      return handleGuess(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

const sessions = new Map(); // In-memory session store (for simplicity, not persistent)

async function handleLogin(request) {
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
