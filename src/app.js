/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import path from 'path';
import {
  decryptRequest,
  encryptResponse,
  FlowEndpointException,
} from "./encryption.js";
import { getNextScreen } from "./flow.js";
import crypto from "crypto";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config('../.env');

const app = express();

app.use(
  express.json({
    // store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },       
  })
);


const { APP_SECRET, PRIVATE_KEY1, PASSPHRASE = "", PORT = "3000" } = process.env;
let PRIVATE_KEY=process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
//  PRIVATE_KEY=process.env.PRIVATE_KEY.replace(/\\n/g, '');

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

app.post('/generic-test',(req,res)=>{
  
          
  
      const resp={
        status:"success"
      };  
  res.status(200).send(resp);

});

app.get("/mmlite-test",(req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post("/flow/test/eu1/1200000000/1665049962/117167154703177", async(req, res)=>{
  console.log(req.body);
try{
 const { screen, data, version, action} = req.body;
  console.log("req: "+ action);
  let resp = {}; 
  // handle health check request
  if (action === "ping") {
    resp = {
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
     resp =  {
      screen: "SIGNUP",
      data: {
       
       }
    };
  }
  if(action==="data_exchange"){
    if(screen==="SIGNUP"){
      resp = {
        screen: "TRAVEL_PACKAGES",
        data:{...data},
      }
    }
    if(screen=="TRAVEL_PACKAGES"){
        resp = {
          screen: "THANKYOU",
          data:{...data},
        }
      }
    }
  console.log("Response sent: ",resp);
  res.status(200).send(resp);
  return;
}catch(e){
  console.log(e);
}
  res.status(200).send({});
});


app.post("/flow/test/eu1/1200000000/1689244432", async(req, res)=>{
  console.log(req.body);
try{
 const { screen, data, version, action} = req.body;
  console.log("req: "+ action);
  let resp = {}; 
  // handle health check request
  if (action === "ping") {
    resp = {
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
     resp =  {
      screen: "SIGNUP",
      data: {
       
       }
    };
  }
  if(action==="data_exchange"){
    if(screen==="SIGNUP"){
      resp = {
        screen: "TRAVEL_PACKAGES",
        data:{...data},
      }
    }
    if(screen=="TRAVEL_PACKAGES"){
        resp = {
          screen: "THANKYOU",
          data:{...data},
        }
      }
    }
  console.log("Response sent: ",resp);
  res.status(200).send(resp);
  return;
}catch(e){
  console.log(e);
}
  res.status(200).send({});
});


app.post("/test/eu1/1200000000/1689244432/101767739661202", async(req, res)=>{
  console.log(req.body);
  const resp = await getNextScreen(req.body);
  res.status(200).send(resp);
});

app.post("/test/1200000000/1665049962/117167154703177", async (req, res) => {
  console.log(req.body);
  if (!PRIVATE_KEY) {
    throw new Error(
      'Private key is empty. Please check your env variable "PRIVATE_KEY".'
    );
  }

  if (!isRequestSignatureValid(req)) {
    // Return status code 432 if request signature does not match.
    // To learn more about return error codes visit: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes
    return res.status(432).send();
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

  // TODO: Uncomment this block and add your flow token validation logic.
  // If the flow token becomes invalid, return HTTP code 427 to disable the flow and show the message in `error_msg` to the user
  // Refer to the docs for details https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes

  /*
  if (!isValidFlowToken(decryptedBody.flow_token)) {
    const error_response = {
      error_msg: `The message is no longer available`,
    };
    return res
      .status(427)
      .send(
        encryptResponse(error_response, aesKeyBuffer, initialVectorBuffer)
      );
  }
  */

  const screenResponse = await getNextScreen(decryptedBody);
  console.log("👉 Response to Encrypt:", screenResponse);

  res.status(200).send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
});

app.post("/test", async (req, res) => {
  console.log(req.body);
  if (!PRIVATE_KEY) {
    throw new Error(
      'Private key is empty. Please check your env variable "PRIVATE_KEY".'
    );
  }

  // if (!isRequestSignatureValid(req)) {
  //   // Return status code 432 if request signature does not match.
  //   // To learn more about return error codes visit: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes
  //   return res.status(432).send();
  // }

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

  // TODO: Uncomment this block and add your flow token validation logic.
  // If the flow token becomes invalid, return HTTP code 427 to disable the flow and show the message in `error_msg` to the user
  // Refer to the docs for details https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes

  /*
  if (!isValidFlowToken(decryptedBody.flow_token)) {
    const error_response = {
      error_msg: `The message is no longer available`,
    };
    return res
      .status(427)
      .send(
        encryptResponse(error_response, aesKeyBuffer, initialVectorBuffer)
      );
  }
  */

  const screenResponse = await getNextScreen(decryptedBody);
  console.log("👉 Response to Encrypt:", screenResponse);
  console.log("final Response: ", encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
  res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
});


app.post("/", async (req, res) => {
  console.log(req.body);
  if (!PRIVATE_KEY) {
    throw new Error(
      'Private key is empty. Please check your env variable "PRIVATE_KEY".'
    );
  }

  if (!isRequestSignatureValid(req)) {
    // Return status code 432 if request signature does not match.
    // To learn more about return error codes visit: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes
    return res.status(432).send();
  }

  let decryptedRequest = null;
  try {
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
    // console.log(decryptedRequest);
  } catch (err) {
    console.error(err);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }

  const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
  console.log("💬 Decrypted Request:", decryptedBody);

  // TODO: Uncomment this block and add your flow token validation logic.
  // If the flow token becomes invalid, return HTTP code 427 to disable the flow and show the message in `error_msg` to the user
  // Refer to the docs for details https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes

  /*
  if (!isValidFlowToken(decryptedBody.flow_token)) {
    const error_response = {
      error_msg: `The message is no longer available`,
    };
    return res
      .status(427)
      .send(
        encryptResponse(error_response, aesKeyBuffer, initialVectorBuffer)
      );
  }
  */

  const screenResponse = await getNextScreen(decryptedBody);
  console.log("👉 Response to Encrypt:", screenResponse);

  res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
});

app.get("/", (req, res) => {
  res.status(200);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

function isRequestSignatureValid(req) {
  if (!APP_SECRET) {
    console.warn(
      "App Secret is not set up. Please Add your app secret in /.env file to check for request validation"
    );
    return true;
  }
  return true;

  const signatureHeader = req.get("x-hub-signature-256");
  const signatureBuffer = Buffer.from(
    signatureHeader.replace("sha256=", ""),
    "utf-8"
  );

  const hmac = crypto.createHmac("sha256", APP_SECRET);
  const digestString = hmac.update(req.rawBody).digest("hex");
  const digestBuffer = Buffer.from(digestString, "utf-8");

  if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    console.error("Error: Request Signature did not match");
    return false;
  }
  return true;
}
