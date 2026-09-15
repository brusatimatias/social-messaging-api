// CORS_ORIGINS is a comma-separated whitelist (e.g. "https://app.example.com,https://admin.example.com").
// Unset/empty means no cross-origin caller is allowed — safer default than "*".
function getCorsOrigins() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = getCorsOrigins;
