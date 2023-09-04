#! /usr/bin/env node

import ChildProcess from "node:child_process";
import http from "node:http";
import { setTimeout } from "node:timers/promises";

const LOCAL_LAMBDA = "LOCAL_LAMBDA";
const NODEJS = "VANILLA_NODEJS";

const agent = new http.Agent({
  keepAlive: true,
});

const docker = async (args = []) => {
  await new Promise((resolve, reject) => {
    ChildProcess.spawn("docker", args, {
      stdio: "inherit",
    })
      .on("error", reject)
      .on("close", (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`Docker process exited with codes ${code} ${signal}`));
      });
  });
};

const callLambdaAPI = async ({
  type = LOCAL_LAMBDA,
  path = "/",
  options,
  body = "",
}) => {
  const port = type === LOCAL_LAMBDA ? 9090 : 9191;
  const startTime = process.hrtime.bigint();

  return await new Promise((resolve, reject) =>
    http
      .request(`http://localhost:${port}${path}`, {
        ...options,
        agent,
      })
      .on("error", reject)
      .on("response", (response) => {
        response
          .on("data", () => {})
          .on("end", () => {
            resolve({
              response,
              responseTime: process.hrtime.bigint() - startTime,
            });
          });
      })
      .end(body)
  );
};

const invokeLambda = async ({ type = LOCAL_LAMBDA }) => {
  return await callLambdaAPI({
    type,
    path: "/2015-03-31/functions/function/invocations",
    options: {
      method: "POST",
    },
    body: JSON.stringify({}),
  });
};

const waitForContainers = async ({ retries = 10 } = {}) => {
  if (retries === 0) {
    throw new Error(`Run out of retries`);
  }

  try {
    await setTimeout(100);
    await Promise.all([
      callLambdaAPI({ type: LOCAL_LAMBDA, options: { method: "HEAD" } }),
      callLambdaAPI({ type: NODEJS, options: { method: "HEAD" } }),
    ]);
  } catch {
    await waitForContainers({ retries: retries - 1 });
  }
};

const dockerComposeUp = () => docker(["compose", "up", "-d"]);
const dockerComposeKill = () => docker(["compose", "kill"]);

for (let i = 0; i < 100; i += 1) {
  await dockerComposeKill();
  await dockerComposeUp();

  await waitForContainers();

  const { responseTime: lambdaResponseTime } = await invokeLambda({
    type: LOCAL_LAMBDA,
  });
  const { responseTime: nodeResponseTime } = await invokeLambda({
    type: NODEJS,
  });

  console.log(lambdaResponseTime / 1_000_000n, nodeResponseTime / 1_000_000n);
}

await dockerComposeKill();
