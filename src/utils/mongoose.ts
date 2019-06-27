import * as mongoose from 'mongoose';
import logger from './logger';

const db = {
  connect(dataBaseUrl: string) {
    logger.info("MongoDB starting");

    const options = {
      useNewUrlParser: true,
      family: 4
    };

    // Add mongoose events
    this.addEvents(dataBaseUrl);

    mongoose.connect(dataBaseUrl, options);
    return mongoose;
  },

  createConnection(dataBaseUrl: string, options?: object) {
    return mongoose.createConnection(dataBaseUrl, options);
  },

  addEvents: (dataBaseUrl: string) => {

    // When successfully connected
    mongoose.connection.on('connected', () => logger.info("MongoDB started"));

    // If the connection throws an error
    mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err}`));

    // When the connection is disconnected
    mongoose.connection.on('disconnected', () => logger.warn("MongoDB connection closed"));

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        logger.warn("MongoDB closed");
        process.exit(0);
      });
    });
  }
};

export { mongoose, db };
