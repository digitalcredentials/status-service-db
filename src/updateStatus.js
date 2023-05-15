import { getStatusManager } from './getStatusManager.js';
const statusManager = await getStatusManager()

/*
VC-API response codes
Response	Description	Body
200	Credential status successfully updated	
400	Bad Request	
404	Credential not found	
500	Internal Server Error
403 Forbidden
401 Unauthorized
*/

async function checkAccessToken(authHeader) {
    if (!authHeader) {
        return { code: 401, message: 'No authorization header was provided.' }
    }
    const [scheme, accessToken] = authHeader.split(' ');
    if (! scheme === 'Bearer') {
        return { code: 401, message: 'Access token must be of type Bearer.' }
    }
    if (! await statusManager.hasStatusAuthority(accessToken)) {
        return { code: 403, message: "You provided a token that isn't authorized or may have expired." }
    }
}

const updateStatus = async (credentialId, credentialStatus, authHeader) => {
    try {
        const authErrorResponse = await checkAccessToken(authHeader)
        if (authErrorResponse) return authErrorResponse;

        const statusCredential = await statusManager.updateStatus({
            credentialId,
            credentialStatus
        });

        return { code: 200, message: "Credential status successfully updated" }
    } catch (e) {
        if (e instanceof CredentialNotFoundError) {
            return {code: 404, message: "Credential Not Found"}
          }
        console.log(e)
        return { code: 400, message: "Bad Request" }
    }

}

export default updateStatus