import { registerLegacyHandlers } from './app/events.js';
import { startApp } from './app/bootstrap.js';

registerLegacyHandlers();
startApp();

