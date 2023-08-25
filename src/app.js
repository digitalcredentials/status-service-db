import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import status from './status.js';
import revoke from './revoke.js'
import allocateStatus from './allocateStatus.js'

export async function build(opts = {}) {

    await status.initializeStatusManager()

    var app = express();

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors())

    app.get('/', function (req, res, next) {
        res.send({ message: 'status-service server status: ok.' })
    });

    // allocate status
    app.post("/credentials/status/allocate",
        async (req, res) => {
            try {
                const vc = req.body;
                if (!req.body || !Object.keys(req.body).length) return res.status(400).send({code: 400, message: 'A verifiable credential was not provided in the body.'})

                const vcWithStatus = await allocateStatus(vc)
                return res.json(vcWithStatus)
            } catch (error) {
                console.log(error);
                return res.status(403).json({code: 403, error, message: "Error when allocating status position."});
            }
        })

    // the body will look like:  {credentialId: '23kdr', credentialStatus: [{type: 'StatusList2021Credential', status: 'revoked'}]}
    app.post("/credentials/status",
        async (req, res) => {
            try {
                
                if (!req.body || !Object.keys(req.body).length) return res.status(400).send({code: 400, message: 'No update request was provided in the body.'})

                const { credentialId, credentialStatus } = req.body;
                const status = credentialStatus[0].status
                const statusType = credentialStatus[0].type

                const statusResponse = (statusType === 'StatusList2021Credential') ?
                    await revoke(credentialId, status)
                    :
                    { code: 400, message: 'StatusList2021Credential is the only supported revocation mechanism.' }
               
                return res.status(statusResponse.code).send(statusResponse)
            } catch (error) {
                console.log(error);
                return res.status(500).json({code: 50, error, message: "Error updating credential status."});
            }
        })



    return app;

}
