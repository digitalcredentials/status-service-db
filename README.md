# Digital Credentials Consortium Status Service

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/status-service/main.yml?branch=main)](https://github.com/digitalcredentials/status-service/actions?query=workflow%3A%22Node.js+CI%22)

IMPORTANT NOTE ABOUT VERSIONING: If you are using a Docker Hub image of this repository, make sure you are reading the version of this README that corresponds to your Docker Hub version.  If, for example, you are using the image `digitalcredentials/status-service:0.1.0` then you'll want to use the corresponding tagged repo: [https://github.com/digitalcredentials/status-service/tree/v0.1.0](https://github.com/digitalcredentials/status-service/tree/v0.1.0).

## Table of Contents

- [Summary](#summary)
- [Environment Variables](#environment-variables)
- [Github Repositories](#github-repositories)
- [Signing Key](#signing-key)
- [Usage](#usage)
  - [Allocate a status position](#allocate-status-position)
  - [Revoke](#revoke)
- [Versioning](#versioning)
- [Logging](#logging)
- [Development](#development)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)

## Summary

A microservice (running as a nodejs express app) that allocates a [revocation status position](https://www.w3.org/TR/vc-status-list/) for a [Verifiable Credential](https://www.w3.org/TR/vc-data-model/), adds the position to the credential, and returns the credential. The status position can later be used to revoke the credential.

Implements two http endpoints:

 * [POST /credentials/status/allocate](https://w3c-ccg.github.io/vc-api/#issue-credential)
 * [POST /credentials/status](https://w3c-ccg.github.io/vc-api/#update-status)

The `/credentials/status` endpoint corresponds to the [VC-API /credentials/status endpoint](https://w3c-ccg.github.io/vc-api/#update-status)

## Environment Variables

We provide support for managing credential status in a variety of storage services. Currently, we support a [database integration](https://github.com/digitalcredentials/status-list-manager-db) for MongoDB and [Git integrations](https://github.com/digitalcredentials/status-list-manager-git) for GitHub and GitLab. For each service category, we have provided a sample `.env.*.example` file that you can use to initialize a `.env` file for your implementation.

#### General
Every credential status manager recognizes the following fields in an `.env` file:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `CRED_STATUS_SERVICE` | name representing storage service used to manage credential status: `mongodb`, `github`, `gitlab` | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |
| `CRED_STATUS_DID_SEED` | seed used to deterministically generate DID | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |
| `PORT` | http port on which to run the express app | 4008 | no |
| `ERROR_LOG_FILE` | log file for all errors - see [Logging](#logging) | N/A | no |
| `LOG_ALL_FILE` | log file for everything - see [Logging](#logging) | N/A | no |
| `CONSOLE_LOG_LEVEL` | console log level - see [Logging](#logging) | silly | no |
| `LOG_LEVEL` | log level for application - see [Logging](#logging) | silly | no |

#### MongoDB
There is a sample `.env` file provided called `.env.db.example` to help you get started with your own `.env` file. In addition to the general fields, every Git credential status manager recognizes the following fields in an `.env` file:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `STATUS_CRED_SITE_ORIGIN` | name of the owner account (personal or organization) in the source control service that will host the credential status resources | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |
| `CRED_STATUS_DB_URL` | URL of the database instance used to manage the credential status repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if the other set of `CRED_STATUS_DB_*` fields are not set |
| `CRED_STATUS_DB_HOST` | host of the database instance used to manage the credential status repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if `CRED_STATUS_DB_URL` is not set |
| `CRED_STATUS_DB_PORT` | port of the database instance used to manage the credential status repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if `CRED_STATUS_DB_URL` is not set |
| `CRED_STATUS_DB_USER` | username of user with read/write privileges on the database instance used to manage the credential status repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if `CRED_STATUS_DB_URL` is not set |
| `CRED_STATUS_DB_PASS` | password associated with `CRED_STATUS_DB_USER` | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if `CRED_STATUS_DB_URL` is not set |

#### Git
There is a sample `.env` file provided called `.env.git.example` to help you get started with your own `.env` file. In addition to the general fields, every Git credential status manager recognizes the following fields in an `.env` file:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| \*`CRED_STATUS_OWNER` | name of the owner account (personal or organization) in the source control service that will host the credential status resources | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |
| \*`CRED_STATUS_REPO_NAME` | name of the credential status repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |
| \*`CRED_STATUS_REPO_ID` | ID of the credential status repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if `CRED_STATUS_SERVICE` = `gitlab` |
| \*`CRED_STATUS_META_REPO_NAME` | name of the credential status metadata repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |
| \*`CRED_STATUS_META_REPO_ID` | ID of the credential status metadata repository | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true and if `CRED_STATUS_SERVICE` = `gitlab` |
| `CRED_STATUS_ACCESS_TOKEN` | Github access token for the credential status repositories | N/A | yes if `ENABLE_STATUS_ALLOCATION` is true |

\* You'll have to create Git repositories for `CRED_STATUS_REPO_NAME` and `CRED_STATUS_META_REPO_NAME` under the ownership of `CRED_STATUS_OWNER`, as they will be used to manage credential status. Full details of the implementation are [here](https://github.com/digitalcredentials/status-list-manager-git).

## Signing key

The status-service is configured with a default signing key that can only be used for testing and evaluation. 

In production, you must generate your own signing key and assign it to the CRED_STATUS_DID_SEED environment variable. An easy-ish way to generate a new key is explained [here](https://github.com/digitalcredentials/issuer-coordinator#generate-a-new-key). Those instructions will give you a json object with a 'seed' property.  Copy the value of that property and assign it to CRED_STATUS_DID_SEED. 

### DID Registries

So that a verifier knows that the status list was signed by a key that is really owned by the claimed issuer, the key (encoded as a DID) has to be confirmed as really belonging to that issuer.  This is typically done by adding the DID to a well known registry that the verifier checks when verifying a credential.

The DCC provides a number of registries that work with the verifiers in the Learner Credential Wallet and in the online web based [Verifier Plus](https://verifierplus.org).  The DCC registries use Github for storage.  To request that your DID be added to a registry, submit a pull request in which you've added your [DID](https://www.w3.org/TR/did-core/) to the registry file.

## Usage

The `/credentials/status/allocate' http endpoint is meant to be called from any software wanting to allocate a position, particularly by the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator) from within a Docker Compose network.

This express app can be run a few different ways:

- with with the `start` script in package.json
- directly from the DockerHub image:  `docker run -dp 4008:4008 digitalcredentials/status-service:0.1.0`
- with docker compose - see how we do that in the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

Note that to run this with Docker, you'll of course need to install Docker, which is very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

### Allocate Status Position

You can now allocate status positions for verifiable credentials.  Try it out with this CURL command, which you simply paste into the terminal:

```
curl --location 'http://localhost:4008/credentials/status/allocate' \
--header 'Content-Type: application/json' \
--data-raw '{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"
  ],
  "id": "urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential"
  ],
  "name": "DCC Test Credential",
  "issuer": {
    "type": [
      "Profile"
    ],
    "id": "did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q",
    "name": "Digital Credentials Consortium Test Issuer",
    "url": "https://dcconsortium.org",
    "image": "https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png"
  },
  "issuanceDate": "2023-08-02T17:43:32.903Z",
  "credentialSubject": {
    "type": [
      "AchievementSubject"
    ],
    "achievement": {
      "id": "urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922",
      "type": [
        "Achievement"
      ],
      "achievementType": "Diploma",
      "name": "Badge",
      "description": "This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.",
      "criteria": {
        "type": "Criteria",
        "narrative": "This credential was issued to a student that demonstrated proficiency in the Python programming language that occurred from **February 17, 2023** to **June 12, 2023**."
      },
      "image": {
        "id": "https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png",
        "type": "Image"
      }
    },
    "name": "Jane Doe"
  }
}'
```

This should return the same credential but with an allocated status. It should look something like this (it will be all smushed up, but you can format it in something like [json lint](https://jsonlint.com):


```
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json",
        "https://w3id.org/vc/status-list/2021/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    "id": "urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c",
    "type": [
        "VerifiableCredential",
        "OpenBadgeCredential"
    ],
    "name": "DCC Test Credential",
    "issuer": {
        "type": [
            "Profile"
        ],
        "id": "did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q",
        "name": "Digital Credentials Consortium Test Issuer",
        "url": "https://dcconsortium.org",
        "image": "https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png"
    },
    "issuanceDate": "2023-08-02T17:43:32.903Z",
    "credentialSubject": {
        "type": [
            "AchievementSubject"
        ],
        "achievement": {
            "id": "urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922",
            "type": [
                "Achievement"
            ],
            "achievementType": "Diploma",
            "name": "Badge",
            "description": "This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.",
            "criteria": {
                "type": "Criteria",
                "narrative": "This credential was issued to a student that demonstrated proficiency in the Python programming language that occurred from **February 17, 2023** to **June 12, 2023**."
            },
            "image": {
                "id": "https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png",
                "type": "Image"
            }
        },
        "name": "Jane Doe"
    },
    "credentialStatus": {
        "id": "https://jchartrand.github.io/status-test-three/DKSPRCX9WB#5",
        "type": "StatusList2021Entry",
        "statusPurpose": "revocation",
        "statusListIndex": 5,
        "statusListCredential": "https://jchartrand.github.io/status-test-three/DKSPRCX9WB"
    }
}
```

Now your next step would be to sign this Verifiable Credential. You could, for example, pass the VC (with its newly allocated status position) to the [DCC signing-service](https://github.com/digitalcredentials/signing-service) which will sign and return the signed copy.  To see how this is can all be coordinated, take a look at the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator).

NOTE: CURL can get a bit clunky if you want to experiment more (like say by changing what goes into the VC before signing), so you might consider trying [Postman](https://www.postman.com/downloads/) which makes it easier to construct and send http calls.


### Revoke

Revocation is fully explained in the StatusList2021 specifivation and the git status repo implemenation but amounts to POSTing an object to the revocation endpoint, like so:

```
{credentialId: '23kdr', credentialStatus: [{type: 'StatusList2021Credential', status: 'revoked'}]}
```

Fundamentally, you are just posting up the id of the credential.


## Versioning

The status-service is primarily intended to run as a docker image within a docker compose network, typically as part of a flow that is orchestrated by the [DCC Issuer Coordinator](https://github.com/digitalcredentials/issuer-coordinator) and the [DCC Workflow Coordinator](https://github.com/digitalcredentials/workflow-coordinator). 

For convenience we've published the images for the status-service and the other services used by the coordinators, as well as for the coordinators themselves, to Docker Hub so that you don't have to build them locally yourself from the github repositories.

The images on Docker Hub will of course at times be updated to add new functionality and fix bugs. Rather than overwrite the default (`latest`) version on Docker Hub for each update, we've adopted the [Semantic Versioning Guidelines](https://semver.org) with our docker image tags.

We DO NOT provide a `latest` tag so you must provide a tag name (i.e, the version number) for the images in your docker compose file.

To ensure you've got compatible versions of the services and the coordinator, the `major` number for each should match. At the time of writing, the versions for each are at 0.1.0, and the `major` number (the leftmost number) agrees across all three.

If you do ever want to work from the source code in the repository and build your own images, we've tagged the commits in Github that were used to build the corresponding Docker image. So a github tag of v0.1.0 coresponds to a docker image tag of 0.1.0

## Logging

We support the following log levels:

```
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
```

Logging is configured with environment variables, as defined in the [Environment Variables](#environment-variables) section.

By default, everything is logged to the console (log level `silly`).

You may set the log level for the application as whole, e.g.,

```LOG_LEVEL=http```

Which would only log messages with severity 'http' and all below it (info, warn, error). 

The default is to log everything (level 'silly').

You can also set the log level for console logging, e.g.,

```CONSOLE_LOG_LEVEL=debug```

This would log everything for severity 'debug' and lower (i.e., verbose, http, info, warn, error). This of course assumes that you've set the log level for the application as a whole to at least the same level.

The default log level for the console is 'silly', which logs everything.

There are also two log files that can be enabled:

* errors (only logs errors)
* all (logs everything - all log levels)

Enable each log by setting an env variable for each, indicating the path to the appropriate file, like this example:

```
LOG_ALL_FILE=logs/all.log
ERROR_LOG_FILE=logs/error.log
```

If you don't set the path, the log is disabled.

## Development

### Installation

Clone code then cd into directory and:

```
npm install
npm run dev
```

### Testing

Testing uses supertest, jest, and nock to test the endpoints.  To run tests:

```npm run test```

Because the revocation (status) system uses github to store status, calls are made out to github during issuance.  Rather than have to make these calls for every test, and possibly in cases where outgoing http calls aren't ideal, we've used mocked the @digitalcredentials/credential-status-manager-git package.

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2023 Digital Credentials Consortium.
