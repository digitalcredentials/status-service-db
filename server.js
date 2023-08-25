import { build } from './src/app.js'
import { getConfig, setConfig } from "./src/config.js";
import http from "http"

const run = async () => {
  await setConfig()
  const { port, enableHttpsForDev } = getConfig();
  const app = await build();
  http.createServer(app).listen(port, () => console.log(`Server running on port ${port}`))
};

run();