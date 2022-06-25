import './LoadEnv'; // Must be the first import
import 'log-timestamp';
import ormconfig from './ormconfig';
import { getConnectionManager } from "typeorm";
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { createServer} from "http";
import { Server as SocketServer} from "socket.io";
import { Server as HttpServer} from "http";
import request from 'request';
import * as Sentry from "@sentry/node";
// Importing @sentry/tracing patches the global hub for tracing to work.
import * as Tracing from "@sentry/tracing";

import { customSocketAuth } from './components/middlewares';
import { createSocket } from './socketInterface';
import { services } from './components';
import { MultiPlayer } from "./games/meta/MultiPlayer";
import LudoMultiplayer from "./games/ludo/server"
import { SocialMediaRedirects } from "./social"


(async () => {
	const connectionManager = getConnectionManager();
	const connection = connectionManager.create(ormconfig);
	await connection.connect();

	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV  || 'development',

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});

	const app = express();

	// Middlewares
	app.use(bodyParser.json());
	var options = {
		"origin": "*",
		"methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
		"preflightContinue": false,
		"optionsSuccessStatus": 204
	  }
	app.use(cors(options));

	const server = createServer(app);
	const io = createSocket(server);	
	const metaNsp = io.of('/meta');
	const ludoNsp = io.of('/ludo');

	metaNsp.use(customSocketAuth);
	ludoNsp.use(customSocketAuth);

	const multiplayer = new MultiPlayer(metaNsp);
	new LudoMultiplayer(ludoNsp);

	// Mount REST on /api
	app.use('/v1', services);
	const port = parseInt(process.env.PORT || '8000');
	server.listen(port, '0.0.0.0', () =>
		console.log(`Server listening on 0.0.0.0:${port}`)
	);
	
	// Social Media redirects
	app.get('/discord', SocialMediaRedirects.discord);
	app.get('/telegram', SocialMediaRedirects.telegram);

	setInterval(function(){
		multiplayer.syncData()
	}, 100);

	//Hack to keep Heroku awake.
	const pingUrl = `${process.env.BASE_URL}/ping`;
	const ping = () => request(pingUrl, (error, response, body) => {
		console.log('Ping:error:', error); // Print the error if one occurred
		console.log('Ping:statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('Ping:body:', body); // Print body of response received
	});

	setInterval(function(){
		ping();
	}, 300000);

})();
