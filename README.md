# WhatsApp Flow Endpoint Server

Example Node.js endpoint server for WhatsApp Flows.

## Flow Endpoint Docs

Refer to the official docs:
https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint

## Warning

- This repo is intended for prototyping/demo use and is not production-ready.
- Keep private keys and credentials out of public/shared projects.
- Use a separate test key pair and replace it with production keys in your own infrastructure.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Generate a test key pair:
   ```bash
   node src/keyGenerator.js {passphrase}
   ```
3. Set environment variables (at minimum for encrypted routes):
   ```env
   PASSPHRASE="my-secret"

   PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
   ...
   -----END RSA PRIVATE KEY-----"
   ```
4. Start the server:
   ```bash
   npm start
   ```

Server runs on `PORT` (default `3000`).

## Route Overview

### Health and Utility

- `GET /` -> health response.
- `POST /generic-test` -> returns `{ "status": "success" }`.
- `GET /mmlite-test` -> serves `src/index.html`.

### Encrypted Flow Endpoints

These routes decrypt request payloads, call `getNextScreen`, and encrypt the response:

- `POST /`
- `POST /test`
- `POST /test/1200000000/1665049962/117167154703177`

### Plain Demo Endpoints

These routes are non-encrypted demo/test helpers:

- `POST /flow/test/eu1/1200000000/1665049962/117167154703177`
- `POST /flow/test/eu1/1200000000/1689244432`
- `POST /test/eu1/1200000000/1689244432/101767739661202`

## Notes

- `src/flow.js` is demo flow logic and can be customized freely.
- Signature verification is currently not enforced in this project setup.
- Main flow logic lives in `src/flow.js`.
