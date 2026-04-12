import * as jose from "jose";

export interface JWTPayload {
  sub: string;
  tenantId: string;
  role: string;
  email?: string;
  name?: string;
}

let privateKey: jose.KeyLike;
let publicKey: jose.KeyLike;

export async function initKeys() {
  const privPem = process.env.JWT_PRIVATE_KEY;
  const pubPem = process.env.JWT_PUBLIC_KEY;

  if (privPem && pubPem) {
    privateKey = await jose.importPKCS8(privPem, "RS256");
    publicKey = await jose.importSPKI(pubPem, "RS256");
  } else {
    const { privateKey: priv, publicKey: pub } = await jose.generateKeyPair("RS256");
    privateKey = priv;
    publicKey = pub;
  }
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

export { initKeys as initJWTKeys };
