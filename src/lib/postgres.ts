import { rootCertificates, type ConnectionOptions } from 'node:tls';

// Keep certificate and hostname verification enabled. URL SSL options must not
// replace the explicit CA configuration supplied to node-postgres.
export function postgresConnection(env: Record<string,string|undefined> = process.env): {connectionString:string;ssl:false|ConnectionOptions} {
  const url = new URL(env.DATABASE_URL!);
  const ca = env.DATABASE_CA_CERT?.replace(/\\n/g, '\n').trim();
  const secure = env.DATABASE_SSL === 'true' || !!ca;
  if (secure) for (const key of ['sslmode','sslcert','sslkey','sslrootcert','ssl','uselibpqcompat']) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: secure ? { rejectUnauthorized: true, ...(ca ? {ca:[...rootCertificates, ca]} : {}) } : false,
  };
}
