export function json(res, status, body) {
  return res.status(status).json(body);
}

export function requirePost(req, res) {
  if (req.method === 'POST') return true;
  res.setHeader('Allow', 'POST');
  json(res, 405, { error: 'Method not allowed.' });
  return false;
}
