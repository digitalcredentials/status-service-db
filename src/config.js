
let CONFIG;
const defaultPort = 4008

export function setConfig() {
  CONFIG = parseConfig();
}

function parseConfig() {
  const env = process.env
  const config = Object.freeze({
    enableHttpsForDev: env.ENABLE_HTTPS_FOR_DEV?.toLowerCase() === 'true',
    port: env.PORT ? parseInt(env.PORT) : defaultPort,
    credStatusService: env.CRED_STATUS_SERVICE,
    credStatusDidSeed: env.CRED_STATUS_DID_SEED,
    credStatusAccessToken: env.CRED_STATUS_ACCESS_TOKEN, 
    credStatusRepoName: env.CRED_STATUS_REPO_NAME, 
    credStatusMetaRepoName: env.CRED_STATUS_META_REPO_NAME, 
    credStatusOwnerAccountName: env.CRED_STATUS_REPO_OWNER
  });
  return config
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



