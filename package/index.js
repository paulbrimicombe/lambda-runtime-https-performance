const https = require("https");

const CONNECTION_URL = "https://lambda.eu-west-1.amazonaws.com";

const agent = new https.Agent({
  keepAlive: true,
});

const connectToRemote = async () => {
  await console.info("Connecting to remote");
  await new Promise((resolve, reject) =>
    https
      .request(CONNECTION_URL, {
        agent,
        method: "HEAD",
      })
      .on("response", (response) => {
        response.on("data", () => {}).on("end", () => resolve(response));
      })
      .on("error", reject)
      .end()
  );
};

const handler = async (event) => {
  console.log("START", event);

  await Promise.allSettled(new Array(20).fill(0).map(connectToRemote)).then(
    (responses) => {
      responses
        .filter((response) => response.status === "rejected")
        .forEach((response) => console.error(response.reason));
      console.error("Remote connections complete!");
    }
  );

  console.log("END");
};

module.exports = { handler };
