# fcp-mpdp-admin

![Build](https://github.com/defra/fcp-mpdp-admin/actions/workflows/publish.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-mpdp-admin&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-mpdp-admin)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-mpdp-admin&metric=bugs)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-mpdp-admin)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-mpdp-admin&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-mpdp-admin)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-mpdp-admin&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-mpdp-admin)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_fcp-mpdp-admin&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_fcp-mpdp-admin)
[![Dependabot](https://badgen.net/github/dependabot/DEFRA/fcp-mpdp-admin)](https://github.com/DEFRA/fcp-mpdp-admin/security/dependabot)

Admin service for the Making Payment Data Public (MPDP) service.

MPDP is part of the Farming and Countryside Programme (FCP).

## Requirements

### Docker

This application is intended to be run in a Docker container to ensure consistency across environments.

Docker can be installed from [Docker's official website](https://docs.docker.com/get-docker/).

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

Build the Docker container:

```
npm run docker:build
```

Run the application in `development` mode:

```bash
npm run docker:dev
```

### Testing

To test the application:

```bash
npm run docker:test
```

Tests can also be run in watch mode to support Test Driven Development (TDD):

```bash
npm run docker:test:watch
```

### Debugging

VS Code launch configurations for debugging inside Docker are provided in [.vscode/launch.json](./.vscode/launch.json).

To debug the running application, start it with `npm run docker:dev` and then run the **Docker: Attach to App** launch configuration.

To debug the tests, start them paused for the debugger with `npm run docker:test:debug` and then run the **Docker: Attach to Tests** launch configuration.

### npm scripts

All available npm scripts can be seen in [package.json](./package.json)
To view them in your command line:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

## Service-to-service authentication

This service optionally attaches a short-lived JWT to every outbound request to the backend API. This is disabled by default and intended to be enabled in deployed environments when the backend has `SERVICE_AUTH_ENABLED=true`.

When enabled, the service obtains a JWT from the AWS STS `GetWebIdentityToken` API on startup, caches it in memory, and refreshes it automatically before it expires. The token is attached as a `Bearer` header on all backend requests.

The AWS SDK reads the `AWS_ROLE_ARN` and `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` environment variables automatically - these are injected by ECS and do not need to be set manually.

### Environment variables

| Variable | Required when enabled | Description |
|---|---|---|
| `SERVICE_AUTH_ENABLED` | ✅ | Set to `true` to enable. Default: `false` |
| `SERVICE_AUTH_AUDIENCE` | optional | JWT audience sent in the token request - must match the backend's expected audience. Default: `fcp-mpdp-backend` |
| `SERVICE_AUTH_TOKEN_DURATION` | optional | Token lifetime in seconds (max 900). Default: `300` |

## SonarQube Cloud

Instructions for setting up SonarQube Cloud can be found in [sonar-project.properties](./sonar-project.properties).

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
