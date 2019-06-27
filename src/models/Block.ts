import mongoose, { dataBase } from './db';

interface IBlock {
  blockHash: string;
  blockNumber: number;
}

interface IBlockModel extends IBlock, mongoose.Document {
}

const BlockSchema: mongoose.Schema = new mongoose.Schema({
  blockNumber: { type: Number, unique: true, index: true },
  blockHash: { type: String, unique: true, index: true },
  timeStamp: { type: Date, index: true },
  transactionList: [String],
}, { collection: 'block' });

const Block: mongoose.Model<IBlockModel> = dataBase.model<IBlockModel>('Block', BlockSchema);

export default Block;
