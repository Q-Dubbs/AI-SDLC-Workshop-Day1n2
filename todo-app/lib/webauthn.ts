import 'server-only';

export function getWebAuthnConfig() {
  const rpID = process.env.RP_ID;
  const rpName = process.env.RP_NAME;
  const rpOrigin = process.env.RP_ORIGIN;

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
