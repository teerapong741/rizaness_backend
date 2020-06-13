import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import server from './server';

const { DB_USER, DB_PASSWORD, DB_NAME, PORT } = process.env;

const createServer = async () => {
	try {
		await mongoose.connect(
			`mongodb+srv://${DB_USER}:${DB_PASSWORD}@merllllin-ovvts.gcp.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
			{ useUnifiedTopology: true }
		);
		const app = express();
		server.applyMiddleware({ app });
		app.listen({ port: PORT }, () =>
			console.log(
				`Server ready at http://localhost:${PORT}${server.graphqlPath}`
			)
		);
	} catch (error) {
		console.log(error);
	}
};

createServer();
