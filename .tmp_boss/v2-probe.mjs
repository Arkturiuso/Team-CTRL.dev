const BASE = 'http://localhost:7085';
const login = `bossv2_${Date.now()}`;
const password = 'Test1234!';

const post = async (path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const get = async (path, token) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

(async () => {
  const reg = await post('/api/register', { login, password });
  console.log('register', reg.status, reg.json?.success ?? reg.json?.Success);
  const auth = await post('/api/auth/login', { login, password });
  const token = auth.json?.data?.tokens?.accessToken;
  console.log('login', auth.status, Boolean(token), login);

  const level = await get('/api/level/6', token);
  const map = level.json?.data?.mapData ?? level.json?.data?.map_data ?? level.json?.data?.map;
  console.log('level', level.status, 'map keys', map?.keys?.length, 'boss', map?.boss?.name ?? map?.boss?.Name);

  for (let i = 0; i < 3; i++) {
    const reset = await post(`/api/execution/reset/6`, {}, token);
    const state = reset.json?.data ?? reset.json;
    console.log('reset', i, reset.status, JSON.stringify({
      x: state.x,
      y: state.y,
      key: state.keyPosition,
      fakes: state.fakeKeys,
      hint: state.bossHint,
      aim: state.bossAim,
      hp: state.playerHp,
    }));
  }

  const levelToHuman = await get('/api/level/6', token);
  console.log('level payload keys', Object.keys(levelToHuman.json?.data ?? {}));
})();
