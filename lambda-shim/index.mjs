// @ts-check
import http from "node:http";

const server = http.createServer((request, response) => {
  try {
    if (request.method !== "POST") {
      response.statusCode = 405;
      response.end();
      return;
    }
    if (request.url !== "/2015-03-31/functions/function/invocations") {
      response.statusCode = 400;
      response.end();
      return;
    }

    let body = [];
    request
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", async () => {
        try {
          const { handler } = await import("./package/index.js");
          const requestBody = Buffer.concat(body).toString("utf-8");
          const lambdaResponse = await handler(JSON.parse(requestBody));
          response.statusCode = 200;
          response.end(JSON.stringify(lambdaResponse));
        } catch (error) {
          console.error(error);
          response.statusCode = 500;
          response.end(error.message);
        }
      });
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end(error.message);
  }
});

server.listen(8080);
