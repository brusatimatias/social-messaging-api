// Standard success envelope for the whole API: { data: ... }. Errors are handled separately
// by app.js's error handler, which mirrors this with { error: { message } }.
function sendData(res, data, status = 200) {
  res.status(status).json({ data });
}

module.exports = { sendData };
