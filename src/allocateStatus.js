import status from './status.js';

const allocateStatus = async (verifiableCredential) => {
    const statusManager = await status.getStatusManager()
    const result = verifiableCredential.credentialStatus ? 
        verifiableCredential :
        await statusManager.allocateStatus(verifiableCredential)
    return result
}

export default allocateStatus