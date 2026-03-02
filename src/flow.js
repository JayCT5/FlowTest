/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "axios";

const NAME_BY_FLOW_TOKEN = {
  9888907479: "Varun",
  9987102608: "Jay",
  9930079420: "Deepak",
  8554075758: "Puranjay",
  7989960625: "Mahesh",
  9887151689: "Anshul",
  9304180922: "Rakesh",
  9167050204: "Arya",
};

const WEATHER_API_KEY = "RYYXDWZM4URE6UWHTJDKLA4HV";

export const getNextScreen = async (decryptedBody) => {
  const {
    screen,
    data = {},
    action,
    flow_token: flowToken,
  } = decryptedBody;
  console.log(data);
  console.log(`action: ${action}`);

  if (action === "ping") {
    return buildPingResponse();
  }

  if (data?.error) {
    return buildClientErrorResponse(data);
  }

  if (action === "INIT") {
    return buildInitResponse(flowToken);
  }

  if (action === "data_exchange") {
    return handleDataExchange({ screen, data, flowToken });
  }

  console.error("Unhandled request body:", decryptedBody);
  throw new Error(
    "Unhandled endpoint request. Make sure you handle the request action and screen logged above.",
  );
};

function buildPingResponse() {
  return {
    data: {
      status: "active",
    },
  };
}

function buildClientErrorResponse(data) {
  console.warn("Received client error:", data);
  return {
    data: {
      acknowledged: true,
    },
  };
}

function buildInitResponse(flowToken) {
  const userName = NAME_BY_FLOW_TOKEN[flowToken];
  return {
    screen: "WELCOME",
    data: {
      name: userName,
      city: "Mumbai",
      age: "20",
      toDisplay: `Hi, ${userName}`,
    },
  };
}

async function handleDataExchange({ screen, data, flowToken }) {
  switch (screen) {
    case "MY_SCREEN":
      console.info("Input name:", data?.name);
      return {
        screen: "SUCCESS",
        data: {
          extension_message_response: {
            params: {
              flow_token: flowToken,
            },
          },
        },
      };

    case "RECOMMEND":
      return {
        screen: "RATE",
        data: {
          extension_message_response: {
            params: {
              flow_token: flowToken,
              data,
            },
          },
        },
      };

    case "WELCOME":
      return handleWelcomeScreen({ data, flowToken });

    case "SIGNUP":
      return {
        screen: "TRAVEL_PACKAGES",
        data: { ...data },
      };

    case "TRAVEL_PACKAGES":
      return {
        screen: "THANKYOU",
        data: { ...data },
      };

    case "WEATHER":
      return handleWeatherScreen({ data, flowToken });

    default:
      throw new Error(`Unhandled screen in data_exchange: ${screen}`);
  }
}

async function handleWelcomeScreen({ data, flowToken }) {
  if (data.option === "1_Check_my_age") {
    const response = await axios.get(
      `https://api.agify.io?name=${encodeURIComponent(data.name || "")}`,
    );
    console.log("Response from age api");
    console.log(response.data);

    const age = response.data?.age == null ? "unknown" : String(response.data.age);
    return {
      screen: "YOUR_AGE",
      data: {
        age,
        name: data.name,
        flow_token: flowToken,
        toDisplay: `Hi ${data.name}, your expected age is ${age}.`,
        extension_message_response: {
          params: {
            flow_token: flowToken,
          },
        },
      },
    };
  }

  // Preserve previous behavior where WELCOME falls through to SIGNUP transition.
  return {
    screen: "TRAVEL_PACKAGES",
    data: { ...data },
  };
}

async function handleWeatherScreen({ data, flowToken }) {
  const response = await axios.get(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
      data.city || "",
    )}?unitGroup=us&key=${WEATHER_API_KEY}&contentType=json`,
  );
  console.log("Response weather age api");
  console.log(response.data.description);

  const weatherDescription = response.data?.description || "Weather data unavailable";
  return {
    screen: "TODAYS_WEATHER",
    data: {
      name: data.name,
      weather: weatherDescription,
      city: data.city,
      flow_token: flowToken,
      toDisplay: `Expected weather in city ${data.city} is, ${weatherDescription}`,
      extension_message_response: {
        params: {
          flow_token: flowToken,
        },
      },
    },
  };
}
