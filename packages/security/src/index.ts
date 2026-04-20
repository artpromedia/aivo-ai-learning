import * as jose from "jose";
import * as fs from "fs";
import * as path from "path";

export interface JWTPayload {
  sub: string;
  tenantId: string;
  role: string;
  email?: string;
  name?: string;
  impersonatedBy?: string;
}

let privateKey: jose.CryptoKey | Uint8Array;
let publicKey: jose.CryptoKey | Uint8Array;

export async function initKeys() {
  const privPem = process.env.JWT_PRIVATE_KEY;
  const pubPem = process.env.JWT_PUBLIC_KEY;

  if (privPem && pubPem) {
    privateKey = await jose.importPKCS8(privPem, "RS256");
    publicKey = await jose.importSPKI(pubPem, "RS256");
    return;
  }

  const keyDir = process.env.JWT_KEY_DIR || path.resolve(process.cwd(), "..", "..", ".local", "jwt-keys");
  const privPath = path.join(keyDir, "private.pem");
  const pubPath = path.join(keyDir, "public.pem");

  try {
    if (fs.existsSync(privPath) && fs.existsSync(pubPath)) {
      const privFile = fs.readFileSync(privPath, "utf8");
      const pubFile = fs.readFileSync(pubPath, "utf8");
      privateKey = await jose.importPKCS8(privFile, "RS256");
      publicKey = await jose.importSPKI(pubFile, "RS256");
      return;
    }
  } catch {}

  const { privateKey: priv, publicKey: pub } = await jose.generateKeyPair("RS256", { extractable: true });
  privateKey = priv;
  publicKey = pub;

  try {
    fs.mkdirSync(keyDir, { recursive: true });
    const privPemOut = await jose.exportPKCS8(priv as jose.CryptoKey);
    const pubPemOut = await jose.exportSPKI(pub as jose.CryptoKey);
    fs.writeFileSync(privPath, privPemOut, { mode: 0o600 });
    fs.writeFileSync(pubPath, pubPemOut, { mode: 0o644 });
  } catch {}
}

export async function signJWT(payload: JWTPayload, expiresIn = "15m"): Promise<string> {
  if (!privateKey) await initKeys();
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer("aivo:identity-svc")
    .sign(privateKey);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  if (!publicKey) await initKeys();
  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: "aivo:identity-svc",
  });
  return payload as unknown as JWTPayload;
}

export function getPublicKey() {
  return publicKey;
}

export async function getPublicKeyPEM(): Promise<string | null> {
  if (!publicKey) await initKeys();
  if (!publicKey) return null;
  const spki = await jose.exportSPKI(publicKey as jose.CryptoKey);
  return spki;
}

export { initKeys as initJWTKeys };

export {
  ADMIN_ENTERPRISE,
  loadAdminEnterpriseFlags,
  logAdminEnterpriseFlags,
  parseBoolFlag,
  parseIntFlag,
  type AdminEnterpriseFlags,
} from "./flags.js";

export {
  SURFACE_COOKIE_NAME,
  getSurfaceSecret,
  signSurfaceCookieValue,
  verifySurfaceCookieValue,
  b64urlEncode,
  type SurfaceCookieClaims,
} from "./surface-cookie.js";
