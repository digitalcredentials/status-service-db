import { getStatusManager } from './status.js';

const allocateStatus = async (verifiableCredential) => {
    const statusManager = await getStatusManager()
    return verifiableCredential.credentialStatus ? 
        verifiableCredential :
        await statusManager.allocateStatus(verifiableCredential)
}

export default allocateStatus