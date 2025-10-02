function log(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const payload = { level, message, timestamp, ...context };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

module.exports = {
  info: (message, context) => log('info', message, context),
  error: (message, context) => log('error', message, context),
  warn: (message, context) => log('warn', message, context),
};
