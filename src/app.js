import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import updateStatus from './updateStatus.js'
import allocateStatus from './allocateStatus.js';


export async function build(opts = {}) {

    var app = express();

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors())

    app.get('/', function (req, res, next) {
        res.send({ message: 'hello' })
    });

    // get current status
    app.get("/credentials/status", 
        async (req, res) => {
            res.send({ message: 'valid' })
        }
    )

    // allocate status
    app.post("/credentials/status", 
        async (req, res) => {
            try {
                const vc = req.body;
                const vcWithStatus = await allocateStatus(unSignedVC)
                return res.json(vcWithStatus)
            } catch (error) {
                console.log(error);
                return res.status(403).json(error);
            }
        })

    // update status
    // the body will look like:  {credentialId: '23kdr', credentialStatus: [{type: 'StatusList2021Credential', status: 'revoked'}]}
    app.post("/credentials/status", 
        async (req, res) => {
            try {
                
                if (!req.body || !Object.keys(req.body).length ) return res.status(400).send('No update request was provided in the body')
                const {credentialId, credentialStatus} = req.body;
                const status = credentialStatus[0].status
                const statusType = credentialStatus[0].type
                const authHeader = req.headers.authorization
                if (statusType === 'StatusList2021Credential') {
                    const statusResponse = await updateStatus(credentialId, status, authHeader)
                    return res.status(statusResponse.code).send(statusResponse.message)
                } else {
                    return res.status(400).send('StatusList2021Credential is the only supported revocation mechanism.')
                }
            } catch (error) {
                console.log(error);
                return res.status(500).json(error);
            }
        })

    return app;

}
