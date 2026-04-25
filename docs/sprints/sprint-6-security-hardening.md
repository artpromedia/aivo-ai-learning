# Sprint 6 — Security Hardening

> **Priority**: 🟡 MEDIUM — Essential before handling real child data  
> **Estimated effort**: 3–4 days  
> **Scope**: MFA wiring, encryption-at-rest config, security scan enforcement, auth on unprotected routes

---

## Prompt 6.1 — Wire MFA Settings UI to Backend

### Context

The backend has a complete email-based MFA flow:
- `services/identity-svc/src/routes/auth.ts` line 144: `MFA_FORCED_ROLES` forces MFA for
  PLATFORM_ADMIN, DISTRICT_ADMIN, SALES, etc.
- Lines 251-254: Login detects `mfaRequired` and auto-enables for forced roles.
- Lines 117-141: `sendMfaCode()` sends codes via comms-svc, generates MFA JWT.
- Lines 858-859: MFA verification endpoint exists.

The frontend `apps/web/src/components/settings/MfaSettings.tsx` exists but may not be
fully wired. The login flow needs to handle the MFA challenge step.

### Files to verify/modify

- `apps/web/src/components/settings/MfaSettings.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/providers/auth-provider.tsx`

### Task

1. **Login MFA challenge**: When the login response returns an MFA token instead of an
   access token (indicating MFA is required), show a code entry screen:
   - 6-digit input with auto-focus on each digit
   - "Check your email" message
   - Submit to `POST /api/auth/verify-mfa` with the MFA JWT + code
   - On success, receive the real access token
   - Handle expiry: "Code expired, request a new one" link

2. **MFA Settings page**: Verify it can:
   - Show current MFA status (enabled/disabled, method: email)
   - Enable MFA for parents who want extra security (optional for PARENT role)
   - Disable MFA (with re-authentication)
   - Show which roles have forced MFA

3. **Test the full flow**: Login → MFA code sent → enter code → dashboard.

### Acceptance criteria

- Admin users see MFA challenge on login.
- Parents can optionally enable MFA from settings.
- MFA code entry UI is accessible (keyboard navigable, ARIA labels).
- Expired code shows clear error with retry option.

---

## Prompt 6.2 — Authentication on Learning & Tutor Service Routes

### Context

`services/learning-svc/src/routes/sessions.ts` and `services/tutor-svc/src/routes/chat.ts`
have no authentication middleware. Anyone with the service URL can create sessions, send
messages, and update gradebook entries.

The gradebook update route (line 133-175) has a partial check:
```typescript
if (!serviceToken && !authHeader && !isInternalCall) {
  const remoteIp = request.ip;
  if (remoteIp && !remoteIp.startsWith("127.") && ...) {
    return reply.code(401).send({ error: "Authentication required" });
  }
}
```
This IP-based check is fragile and won't work in Kubernetes where all traffic
comes from internal IPs.

### Files to modify

- `services/learning-svc/src/routes/sessions.ts`
- `services/learning-svc/src/index.ts`
- `services/tutor-svc/src/routes/chat.ts`
- `services/tutor-svc/src/index.ts`

### Task

1. Add a shared `authenticate` preHandler (similar to identity-svc's pattern) to both
   services:
   ```typescript
   async function authenticate(req, reply) {
     const auth = req.headers.authorization;
     // Accept JWT from user
     if (auth?.startsWith("Bearer ")) {
       req.user = await verifyJWT(auth.slice(7));
       return;
     }
     // Accept service-to-service token
     const serviceToken = req.headers["x-service-token"];
     if (serviceToken === process.env.INTERNAL_SERVICE_TOKEN) {
       req.user = { sub: "service", role: "service", tenantId: "" };
       return;
     }
     reply.status(401).send({ error: "Unauthorized" });
   }
   ```

2. Apply `preHandler: authenticate` to all session and gradebook routes.

3. For internal service calls (brain-svc → learning-svc), use the `INTERNAL_SERVICE_TOKEN`
   env var pattern so services can still communicate.

4. Remove the IP-based check from the gradebook update route.

5. Add `INTERNAL_SERVICE_TOKEN` to `.env.example`.

### Acceptance criteria

- Unauthenticated request to `/api/learning/sessions` returns 401.
- Request with valid JWT succeeds.
- Internal service call with service token succeeds.
- IP-based auth hack removed.

---

## Prompt 6.3 — Document Encryption-at-Rest Requirements

### Context

No explicit encryption-at-rest configuration exists in the codebase for the database or
file storage. IEP documents (containing sensitive disability information) are stored with
`file_url` references to S3.

### Files to create/modify

- `docs/security-architecture.md` (new)
- `infra/helm/` or `infra/terraform/` (if applicable — document config)

### Task

1. Create `docs/security-architecture.md` documenting:
   - **Database encryption**: Require PostgreSQL TDE or cloud-provider encryption
     (e.g., AWS RDS encryption, Hetzner volume encryption).
   - **S3 encryption**: Require `AES-256` server-side encryption on the S3 bucket.
     Add to bucket policy: `"s3:x-amz-server-side-encryption": "AES256"`.
   - **Transit encryption**: All inter-service communication over TLS. Document
     the TLS termination point (ingress controller, service mesh, etc.).
   - **Sensitive field handling**: List which DB columns contain sensitive data:
     - `iep_documents.parsed_data` — IEP content
     - `iep_profiles.disability_categories`, `accommodations`, `goals`
     - `learners.diagnoses`
     - `sensory_profiles.*`
     - `parent_assessments.responses`
   - **Key rotation**: Document key rotation policy for JWT keys, DB encryption
     keys, and S3 encryption keys.

2. If Helm/Terraform configs exist, add encryption settings:
   - RDS: `storage_encrypted = true`
   - S3: `server_side_encryption_configuration { rule { ... AES256 } }`

3. Add a startup check to `identity-svc` that warns if `NODE_ENV=production` and
   `DATABASE_URL` doesn't use `sslmode=require`.

### Acceptance criteria

- `docs/security-architecture.md` exists with all sections.
- Production DB connection requires SSL (startup warning if not).
- S3 encryption documented and configured if Terraform exists.

---

## Prompt 6.4 — Security Scan Enforcement in CI

### Context

`.github/workflows/security-scan.yml` runs pnpm audit, pip-audit, Trivy, TruffleHog,
and Bandit — but almost every step uses `continue-on-error: true` or `|| true`.
Critical vulnerabilities are silently ignored.

### File to modify

`.github/workflows/security-scan.yml`

### Task

1. **TruffleHog** (secret detection): Remove `continue-on-error`. A verified secret
   in the repo is always a blocker.

2. **Trivy** (vulnerability scan): Keep `continue-on-error` but add a follow-up step
   that parses the SARIF output and fails if any `CRITICAL` severity findings exist.

3. **pnpm audit & pip-audit**: Add a summary step that counts HIGH+ vulnerabilities.
   If count > 0, post a PR comment with the findings. Don't block (dependencies may
   have known issues with no fix), but make visible.

4. **Bandit** (Python SAST): Parse the JSON output. Fail on `HIGH` confidence +
   `HIGH` severity findings. Warn on others.

5. Add a final `security-summary` job that aggregates all results and posts a
   single PR comment.

### Acceptance criteria

- Committed secrets always block merge.
- Critical Trivy findings block merge.
- HIGH Bandit findings block merge.
- Dependency audit findings are surfaced as PR comments.
- Summary comment posted on every PR.

---

## Definition of Done for Sprint 6

- [ ] MFA challenge flow works end-to-end (login → code → dashboard)
- [ ] All learning-svc and tutor-svc routes require authentication
- [ ] Security architecture document published
- [ ] Production DB connection requires SSL
- [ ] Secret detection blocks PRs
- [ ] Critical vulnerability findings block PRs
