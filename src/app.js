/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import path from "path";
import {
  decryptRequest,
  encryptResponse,
  FlowEndpointException,
} from "./encryption.js";
import { getNextScreen } from "./flow.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

dotenv.config("../.env");

const app = express();

app.use(
  express.json({
    // store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  }),
);

const {
  PASSPHRASE = "",
  PORT = "3000",
} = process.env;
const PRIVATE_KEY = process.env.PRIVATE_KEY?.replace(/\\n/g, "\n") || "";

/*
Example:
```-----[REPLACE THIS] BEGIN RSA PRIVATE KEY-----
MIIE...
...
...AQAB
-----[REPLACE THIS] END RSA PRIVATE KEY-----```
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.post("/generic-test", (req, res) => {
  const resp = {
    status: "success",
  };
  res.status(200).send(resp);
});

app.get("/mmlite-test", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const plainFlowRoutes = [
  "/flow/test/eu1/1200000000/1665049962/117167154703177",
  "/flow/test/eu1/1200000000/1689244432",
];

for (const route of plainFlowRoutes) {
  app.post(route, handlePlainFlowRequest);
}

app.post("/test/eu1/1200000000/1689244432/101767739661202", async (req, res) => {
  console.log(req.body);
  try {
    const resp = await getNextScreen(req.body);
    return res.status(200).send(resp);
  } catch (error) {
    console.error(error);
    return res.status(500).send({});
  }
});

const encryptedFlowRoutes = [
  "/test/1200000000/1665049962/117167154703177",
  "/test",
  "/",
];

for (const route of encryptedFlowRoutes) {
  app.post(route, handleEncryptedFlowRequest);
}

app.get("/", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

async function handlePlainFlowRequest(req, res) {
  console.log(req.body);
  try {
    const { screen, data, action } = req.body;
    const resp = getPlainFlowResponse({ screen, data, action });
    console.log("Response sent: ", resp);
    return res.status(200).send(resp);
  } catch (error) {
    console.error(error);
    return res.status(200).send({});
  }
}

function getPlainFlowResponse({ screen, data, action }) {
  // handle health check request
  if (action === "ping") {
    return {
      data: {
        status: "active",
      },
    };
  }

  // handle error notification
  if (data?.error) {
    console.warn("Received client error:", data);
    return {
      data: {
        acknowledged: true,
      },
    };
  }

  // handle initial request when opening the flow
  if (action === "INIT") {
    return {
      screen: "SIGNUP",
      data: {},
    };
  }

  if (action === "data_exchange") {
    if (screen === "SIGNUP") {
      return {
        screen: "TRAVEL_PACKAGES",
        data: { ...data },
      };
    }

    if (screen === "TRAVEL_PACKAGES") {
      return {
        screen: "THANKYOU",
        data: { ...data },
      };
    }
  }

  return {};
}

async function handleEncryptedFlowRequest(req, res) {
  console.log(req.body);
  if (!PRIVATE_KEY) {
    return res
      .status(500)
      .send({
        error:
          'Private key is empty. Please check your env variable "PRIVATE_KEY".',
      });
  }

  let decryptedRequest = null;
  try {
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  } catch (err) {
    console.error(err);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }

  const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
  console.log("💬 Decrypted Request:", decryptedBody);

  try {
    const screenResponse = await getNextScreen(decryptedBody);
    console.log("👉 Response to Encrypt:", screenResponse);
    const encryptedResponse = encryptResponse(
      screenResponse,
      aesKeyBuffer,
      initialVectorBuffer,
    );
    return res.status(200).send(encryptedResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
}
