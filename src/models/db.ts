import { db, mongoose } from '../utils/mongoose';

const {
  MONGO_URL
} = process.env;

const options = {
  useNewUrlParser: true,
  family: 4
};

export const dataBase = db.createConnection(MONGO_URL, options);

export default mongoose;
