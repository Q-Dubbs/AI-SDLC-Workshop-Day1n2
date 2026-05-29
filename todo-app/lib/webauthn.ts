import 'server-only';

export function getWebAuthnConfig(request?: Request) {
  const isProduction = process.env.NODE_ENV === 'production';

  const configuredOrigin = process.env.RP_ORIGIN?.trim();
  const configuredName = process.env.RP_NAME?.trim();
  const configuredRpId = process.env.RP_ID?.trim();

  const fallbackOrigin = 'http://localhost:3000';
  const configuredOriginList = (configuredOrigin || (!isProduction ? fallbackOrigin : ''))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  let requestOrigin: string | null = null;
  let requestHostname: string | null = null;
  if (request) {
    try {
      const url = new URL(request.url);
      requestOrigin = url.origin;
      requestHostname = url.hostname;
    } catch {
      requestOrigin = null;
      requestHostname = null;
    }
  }

  const originList = Array.from(
    new Set([
      ...configuredOriginList,
      ...(!isProduction && requestOrigin ? [requestOrigin] : []),
    ])
  );

  if (originList.length === 0) {
    throw new Error('RP_ORIGIN must be configured');
  }

  const primaryOrigin = originList[0];

  let derivedRpId: string | undefined;
  try {
    derivedRpId = new URL(primaryOrigin).hostname;
  } catch {
    throw new Error('RP_ORIGIN must be a valid absolute URL');
  }

  const rpID = configuredRpId || (!isProduction ? requestHostname || undefined : undefined) || derivedRpId;
  const rpName = configuredName || (!isProduction ? 'Todo App (Local)' : 'Todo App');

  if (!rpID || !rpName) {
    throw new Error('RP_ID and RP_NAME must be configured');
  }

  const expectedOrigin = originList.length === 1 ? originList[0] : originList;

  return {
    rpID,
    rpName,
    expectedOrigin,
  };
}
