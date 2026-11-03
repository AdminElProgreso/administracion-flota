// How check-alerts treats each HTTP method. Browsers send a CORS preflight (OPTIONS) without
// credentials and the gateway lets it through even with verify_jwt, so it must never run the job.
export type RequestAction = 'preflight' | 'run' | 'reject';

export function requestAction(method: string): RequestAction {
  if (method === 'OPTIONS') return 'preflight';
  if (method === 'POST') return 'run';
  return 'reject';
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
