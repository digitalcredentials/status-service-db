let CONFIG;

export async function setConfig() {
  CONFIG = parseConfig();
}

function parseConfig() {
  if (!process.env.PORT) {
    throw new Error("Environment variable 'PORT' is not set");
  }

  return Object.freeze({
    enableHttpsForDev: process.env.ENABLE_HTTPS_FOR_DEV?.toLowerCase() === 'true',
    port: parseInt(process.env.PORT),
    credStatusDidSeed: process.env.CRED_STATUS_DID_SEED,
    credStatusService: process.env.CRED_STATUS_SERVICE,
    credStatusAccessToken: process.env.CRED_STATUS_ACCESS_TOKEN, 
    credStatusRepoName: process.env.CRED_STATUS_REPO_NAME, 
    credStatusMetaRepoName: process.env.CRED_STATUS_META_REPO_NAME, 
    credStatusRepoOrgName: process.env.CRED_STATUS_REPO_ORG_NAME
  });
}

export function getConfig() {
  if (!CONFIG) {
    setConfig()
  }
  return CONFIG;
}

export function resetConfig() {
  CONFIG = null;
}



