import 'server-only';

export function getWebAuthnConfig() {
  const isProduction = process.env.NODE_ENV === 'production';

  const rpID = process.env.RP_ID ?? (!isProduction ? 'localhost' : undefined);
  const rpName = process.env.RP_NAME ?? (!isProduction ? 'Todo App' : undefined);
  const rpOrigin = process.env.RP_ORIGIN ?? (!isProduction ? 'http://localhost:3000' : undefined);

  if (!rpID || !rpName || !rpOrigin) {
    throw new Error('RP_ID, RP_NAME, and RP_ORIGIN must be configured');
  }

  const expectedOrigin = rpOrigin.includes(',')
    ? rpOrigin
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : rpOrigin;

  return {
    rpID,
    rpName,
    expectedOrigin,
  };
}
