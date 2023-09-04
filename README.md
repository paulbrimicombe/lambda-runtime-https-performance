# Slow Lambda HTTPS request investigations

## What is this?

This project was created to investigate slow HTTPS requests for lambda cold-starts in various different NodeJS versions with various memory restrictions.

### What are all of these files?

- [lambda-shim](./lambda-shim/) — a basic HTTP server that provides the same invocation API as the [Lambda container image](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html)
- [package](./package) — the function code to be run. The handler function makes 20 parallel requests to the AWS Lambda API (any remote HTTPS API will do)
- [`docker-compose.yml`](./docker-compose.yml) — defines two containers: one uses the image from the [AWS ECR Public Gallery](https://gallery.ecr.aws/lambda/nodejs) and the other uses vanilla NodeJS image from [DockerHub](https://hub.docker.com/_/node) that installs and runs the `lambda-shim` API
- [`test.mjs`](./test.mjs) — a script that repeatedly invokes the function code using the Lambda and vanilla NodeJS containers, restarting the containers each time to simulate cold starts
- [`results`](./results) — some results from previous test runs

## How can I run these tests?

### Prerequisites

- Install `docker` (ensuring that you have the `docker-compose` plugin)
- Install a recent version of NodeJS (i.e. 16+) — this is used to run the test script, not execute the lambda code

### Running the tests

1. Edit the [`docker-compose`](./docker-compose.yml) file to set the required NodeJS version and memory restrictions for both docker containers
1. Run the test script using `node ./test.mjs > results.txt`. This restarts the docker contains and runs the lambda function code in each container 100 times, outputting the invocation times to standard out
