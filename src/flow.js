/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "axios";

const get_name = {
  "9888907479": "Varun",
  "9987102608": "Jay",
  "9930079420": "Deepak",
  "8554075758": "Puranjay",
  "7989960625": "Mahesh",
  "9887151689": "Anshul",
  "9304180922": "Rakesh",
  "9167050204": "Arya"
};

export const getNextScreen = async (decryptedBody) => {
  const { screen, data, version, action, flow_token } = decryptedBody;
  console.log(decryptedBody.data);
  console.log("action: "+ action);

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
      screen: "WELCOME",
      data: {
        // custom data for the screen
        name: `${get_name[flow_token]}`,
        city:'Mumbai',
        age: '20',
        toDisplay: `Hi, ${get_name[flow_token]}`,
      },
    };
    return {
      screen: "Home",
      data: {
        // custom data for the screen
        title: `Hi, ${get_name[flow_token]}`,
        order_details: `Your order Galaxy watch, is out for delivery!`,
        flow_token: flow_token,
      },
    };
    
    return {
      screen: "MY_SCREEN",
      data: {
        // custom data for the screen
        greeting: "Hey there! 👋",
      },
    };
  }

  if (action === "data_exchange") {
    // handle the request based on the current screen
    switch (screen) {
      case "MY_SCREEN":
        // TODO: process flow input data
        console.info("Input name:", data?.name);

        // send success response to complete and close the flow
        return {
          screen: "SUCCESS",
          data: {
            extension_message_response: {
              params: {
                flow_token,
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
                flow_token: flow_token,
                data: decryptedBody.data,
              },
            },
          },
        };
      case "WELCOME":
        if (decryptedBody.data.option === "1_Check_my_age") {
          const res = await axios.get(
            `https://api.agify.io?name=${decryptedBody.data.name}`
          );
          console.log("Response from age api");
          console.log(res.data);
          return {
            screen: "YOUR_AGE",
            data: {
              age: res.data.age.toString(),
              name: decryptedBody.data.name, flow_token: flow_token,
              toDisplay:`Hi ${decryptedBody.data.name}, your expected age is ${res.data.age.toString()}.`,
              extension_message_response: {
                params: {
                  flow_token: flow_token,
                },
              },
            },
          };
        };
        case " if(screen==="SIGNUP"){
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
    }"
        return {
          screen: "WEATHER",
          data: {
            name: decryptedBody.data.name,
            flow_token: flow_token,
            toDisplay:'Please enter your city!',
            extension_message_response: {
              params: {
                flow_token: flow_token,
              },
            },
          },
        };
      case "WEATHER":
        const res = await axios.get(
          `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${decryptedBody.data.city}?unitGroup=us&key=RYYXDWZM4URE6UWHTJDKLA4HV&contentType=json`
        );
        console.log("Response weather age api");
        console.log(res.data.description);
         return {
              screen: "TODAYS_WEATHER",
              data: {
                name: decryptedBody.data.name, weather: res.data.description, city: decryptedBody.data.city, flow_token: flow_token,
                toDisplay:`Expected weather in city ${decryptedBody.data.city} is, ${res.data.description}`,
                extension_message_response: {
                  params: {
                    flow_token: flow_token,
                  },
                },
              },
            };
      default:
        break;
    }
  }

  console.error("Unhandled request body:", decryptedBody);
  throw new Error(
    "Unhandled endpoint request. Make sure you handle the request action & screen logged above."
  );
};
