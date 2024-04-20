import { build } from './src/app.js';
import { getConfig } from './src/config.js';
import http from 'http';
import https from 'https';
import logger from './src/utils/logger.js';

const run = async () => {
  const { port, enableHttpsForDev } = getConfig();
  const app = await build();

  if (enableHttpsForDev) {
    https
      .createServer(
        {
          key: fs.readFileSync('server-dev-only.key'),
          cert: fs.readFileSync('server-dev-only.cert')
        },
        app
      ).listen(port, () => logger.info(`Server running on port ${port} with https`));
  } else {
    http
      .createServer(app).listen(port, () => logger.info(`Server running on port ${port} with http`));
  }
};

run();
