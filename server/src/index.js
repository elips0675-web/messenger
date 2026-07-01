import 'dotenv/config';
import { createServer } from 'http';
import { PeerServer } from 'peer';
import app from './app.js';
import { initIO } from './ws.js';
import { rootLogger } from './logger.js';

const httpServer = createServer(app);

initIO(httpServer);

const PEER_PORT = process.env.PEER_PORT || 3002;
PeerServer({ port: PEER_PORT, path: '/' });
rootLogger.info(`PeerJS server running on port ${PEER_PORT}`);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  rootLogger.info(`Messenger API running on port ${PORT}`);
});

export default app;
