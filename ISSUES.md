# S3-Clone Code Review – Issue List

Issues discovered during code review. These are new findings not yet tracked in GitHub.

---

## Issue 1 – Missing Input Validation on Auth Endpoints

**Severity:** High
**Files:** `controller/auth.js`

The `register` and `login` endpoints accept user input directly without validating format or sanitizing values before database operations.

- Email format is never validated (the `validator` package is installed but unused in auth controller)
- Password is only checked against the mongoose schema minimum after the `bcrypt` hash step; schema errors surface as raw 500 responses

**Expected behavior:** Validate email format and required fields before any DB or hashing operation. Return a clear 400 with field-level errors on invalid input.

---

## Issue 2 – Unvalidated File Path in `getFile` Allows Potential Path Traversal

**Severity:** High
**Files:** `controller/file.js` (line ~144)

`getFile` passes `file.path` (a value stored in MongoDB) directly to `res.sendFile()` without verifying the resolved path stays inside the expected uploads directory. If a record's `path` field were ever manipulated, an attacker could retrieve arbitrary files.

**Expected behavior:** Resolve the path and assert it starts with the expected uploads directory before serving.

---

## Issue 3 – Weak Password Validation in User Model

**Severity:** Medium
**Files:** `models/user.js`

The password validator only rejects passwords containing the literal string `"password"` and enforces a 7-character minimum. Trivially weak passwords such as `1234567` or `aaaaaaa` pass validation.

**Expected behavior:** Enforce complexity rules (upper/lower case, digit, special character, minimum 8 characters) or integrate a strength estimator library.

---

## Issue 4 – JWT Tokens Stored as Plain Text in MongoDB

**Severity:** Medium
**Files:** `models/user.js` (tokens array)

Active session tokens are persisted as plain strings in the `tokens` array. A database dump exposes every live session.

**Expected behavior:** Store a hash (e.g., SHA-256) of each token. On logout or validation, hash the incoming token and compare. This prevents token theft from a DB breach.

---

## Issue 5 – Race Condition in File Upload (TOCTOU)

**Severity:** Medium
**Files:** `controller/file.js` (lines ~19–22)

File uniqueness is checked with a `findOne` query followed by a separate `save()` call. Two concurrent uploads with the same filename can both pass the existence check and create duplicate records.

**Expected behavior:** Use a MongoDB unique index on `{bucket, filename, owner}` and handle the duplicate key error (`code 11000`) gracefully instead of relying on application-level checks.

---

## Issue 6 – No Pagination Input Validation

**Severity:** Low
**Files:** `controller/bucket.js` (lines ~51–52), `controller/file.js`

`page` and `pageSize` are parsed from query parameters with `parseInt()` but are never validated. Negative values, zero, or extremely large numbers reach the Mongoose `skip`/`limit` calls unchanged and can cause unexpected behavior.

**Expected behavior:** Clamp page to `≥ 1` and pageSize to a sensible range (e.g., 1–100) before use.

---

## Issue 7 – Hard-Coded Relative Upload Path

**Severity:** Low
**Files:** `controller/bucket.js` (line ~38), `controller/fileUpload.js`

Upload paths are constructed with `path.join('uploads', ...)` using a relative path. The resolved directory depends on the working directory when the process was started, leading to inconsistent behavior in different environments.

**Expected behavior:** Resolve the uploads root against `__dirname` or an environment variable (e.g., `UPLOAD_DIR`).

---

## Issue 8 – No Structured Logging

**Severity:** Low
**Files:** Throughout the codebase

All logging relies on `console.log` and `console.error`. There is no log level, correlation ID, or structured format. Debugging production incidents and building an audit trail is impractical.

**Expected behavior:** Integrate a logging library (e.g., `winston`, `pino`) with configurable levels and structured JSON output.

---

## Issue 9 – No MongoDB Connection Resilience

**Severity:** Low
**Files:** `server.js`

The application only handles the initial connection error at startup. It does not listen for `disconnect` or `error` events that fire if the connection is lost after startup, nor does it configure `autoReconnect` / retry options.

**Expected behavior:** Add `mongoose.connection.on('error', ...)` and `mongoose.connection.on('disconnected', ...)` handlers and configure automatic reconnect behavior.

---

## Issue 10 – Inconsistent API Response Format

**Severity:** Low
**Files:** Multiple controllers

Error responses mix `res.send(string)`, `res.json({error})`, `res.json({warning})`, and `res.send(errorObject)`. Clients cannot reliably parse error payloads.

**Expected behavior:** Standardize on a single error shape (e.g., `{ error: { message, code } }`) across all controllers and document it in the Swagger spec.
