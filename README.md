# Digital Credentials Consortium Status Service

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/status-service/main.yml?branch=main)](https://github.com/digitalcredentials/status-service/actions?query=workflow%3A%22Node.js+CI%22)


## Table of Contents

- [Summary](#summary)
- [Environment Variables](#environment-variables)
- [Github Repositories](#github-repositories)
- [Signing Key](#signing-key)
- [Usage](#usage)
  - [Allocate a status position](#allocate-status-position)
  - [Revoke](#revoke)
- [Development](#development)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)

## Summary

Allocates a [revocation status position](https://www.w3.org/TR/vc-status-list/) for a [Verifiable Credential](https://www.w3.org/TR/vc-data-model/), adds the position to the credential, and returns the credential. The status position can later be used to revoke the credential.

Implements two http endpoints:

 * [POST /credentials/status/allocate](https://w3c-ccg.github.io/vc-api/#issue-credential)
 * [POST /credentials/status](https://w3c-ccg.github.io/vc-api/#update-status)

The `/credentials/status` endpoint corresponds to the [VC-API /credentials/status endpoint](https://w3c-ccg.github.io/vc-api/#update-status)

## Environment Variables

There is a sample .env file provided called .env.example to help you get started with your own .env file. The supported fields:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | http port on which to run the express app | 4007 | no |
| `CRED_STATUS_OWNER` | name of the owner account (personal or organization) in the source control service that will host the credential status resources | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_REPO_NAME` | name of the credential status repository | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_META_REPO_NAME` | name of the credential status metadata repository | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_ACCESS_TOKEN` | Github access token for the credential status repositories | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_DID_SEED` | seed used to deterministically generate DID | no | yes if ENABLE_STATUS_ALLOCATION is true |

## Github Repositories

You'll have to create two new github repositories that will be used exclusively to manage the status.  Full details of the implementation are [here](https://github.com/digitalcredentials/status-list-manager-git)

For this MVP implementation of the issuer we've only exposed the github options, but if you would like to use gitlab instead, just let us know and we can expose those options.

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
- directly from the DockerHub image:  `docker run -dp 3000:4008 digitalcredentials/status-service`
- with docker compose - see how we do that in the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

Note that to run this with Docker, you'll of course need to install Docker, which is very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

### Allocate Status Position

You can now allocate status positions for verifiable credentials.  Try it out with this CURL command, which you simply paste into the terminal:

```
curl --location 'http://localhost:3000/credentials/status/allocate/test' \
--header 'Content-Type: application/json' \
--data-raw '{ 
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"
  ],
  "id": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1", 
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential"
  ],
  "issuer": {
    "id": "the issuer code will set this as the issuing DID", 
    "type": "Profile",
    "name": "DCC Test Issuer",
    "description": "A test DID used to issue test credentials",
    "url": "https://digitalcredentials.mit.edu",
    "image": {
	    "id": "https://certificates.cs50.io/static/success.jpg",
	    "type": "Image"
	  }	
  },
  "issuanceDate": "2020-01-01T00:00:00Z", 
  "expirationDate": "2025-01-01T00:00:00Z",
  "name": "Successful Installation",
  "credentialSubject": {
      "type": "AchievementSubject",
     "name": "Me!",
     "achievement": {
      	"id": "http://digitalcredentials.mit.edu",
      	"type": "Achievement",
      	"criteria": {
        	"narrative": "Successfully installed the DCC issuer."
      	},
      	"description": "DCC congratulates you on your successful installation of the DCC Issuer.", 
      	"name": "Successful Installation",
      	"image": {
	    	"id": "https://certificates.cs50.io/static/success.jpg",
	    	"type": "Image"
	  	}
      }
  	}
}'
```

This should return the same credential but with an allocated status. It should look something like this (it will be all smushed up, but you can format it in something like [json lint](https://jsonlint.com):


```
{
	"@context": ["https://www.w3.org/2018/credentials/v1", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json", "https://w3id.org/vc/status-list/2021/v1", "https://w3id.org/security/suites/ed25519-2020/v1"],
	"id": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1",
	"type": ["VerifiableCredential", "OpenBadgeCredential"],
	"issuer": {
		"id": "did:key:z6Mkf2rgv7ef8FmLJ5Py87LMa7nofQgv6AstdkgsXiiCUJEy",
		"type": "Profile",
		"name": "DCC Test Issuer",
		"description": "A test DID used to issue test credentials",
		"url": "https://digitalcredentials.mit.edu",
		"image": {
			"id": "https://certificates.cs50.io/static/success.jpg",
			"type": "Image"
		}
	},
	"issuanceDate": "2020-01-01T00:00:00Z",
	"expirationDate": "2025-01-01T00:00:00Z",
	"name": "Successful Installation",
	"credentialSubject": {
		"type": "AchievementSubject",
		"name": "Me!",
		"achievement": {
			"id": "http://digitalcredentials.mit.edu",
			"type": "Achievement",
			"criteria": {
				"narrative": "Successfully installed the DCC issuer."
			},
			"description": "DCC congratulates you on your successful installation of the DCC Issuer.",
			"name": "Successful Installation",
			"image": {
				"id": "https://certificates.cs50.io/static/success.jpg",
				"type": "Image"
			}
		}
	},
    "credentialStatus": {
        "id": "https://jchartrand.github.io/dcc-status-test/O92GZS2H21#1",
        "type": "StatusList2021Entry",
        "statusPurpose": "revocation",
        "statusListIndex": 1,
        "statusListCredential": "https://jchartrand.github.io/dcc-status-test/O92GZS2H21"
    }
}
```

NOTE: CURL can get a bit clunky if you want to experiment, so you might consider trying [Postman](https://www.postman.com/downloads/) which makes it very easy to construct and send http calls.


### Revoke

Revocation is fully explained in the StatusList2021 specifivation and the git status repo implemenation but amounts to POSTing an object to the revocation endpoint, like so:

```
{credentialId: '23kdr', credentialStatus: [{type: 'StatusList2021Credential', status: 'revoked'}]}
```

Fundamentally, you are just posting up the id of the credential.

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
