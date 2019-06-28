import axios from 'axios';
import * as moment from 'moment';

import logger from './utils/logger';
import Block from './models/Block';

const {
  FULL_NODE_URL,
  SLACK_WEBHOOK_TOKEN
} = process.env;

const grpc = axios.create({
  baseURL: FULL_NODE_URL,
  timeout: 5000
});

const slackWebhook = axios.create({
  baseURL: 'https://hooks.slack.com',
  timeout: 5000
})

const getNowBlockNumber = async () => {
  const { data } = await grpc.post('/wallet/getnowblock');
  return {
    number: data['block_header']['raw_data']['number'],
    timestamp: data['block_header']['raw_data']['timestamp']
  }
};

const getLatestMongoDBBlock = async () => {
  const blocksCount = await Block.estimatedDocumentCount();
  const found = await Block.find({}).sort({ timeStamp: 1 }).skip(blocksCount - 1).limit(1);
  return found[0];
};

const main = async () => {
  const nowBlock = await getNowBlockNumber();
  logger.info(`nowBlock number: #${nowBlock.number}`);
  const {
    blockNumber,
    timeStamp
  } = await getLatestMongoDBBlock();
  logger.info(`latest block from Tron Events MongoDB: #${blockNumber}`);
  const diffBlocks = (nowBlock.number - blockNumber);

  const timeBehind = moment(timeStamp).from(nowBlock.timestamp, true);

  const payload = {
    attachments: [
      {
        fallback: `Status of Tron Events MongoDB Sync at ${Date.now()}`,
        color: diffBlocks > 10000 ? "#de4e2b" : diffBlocks > 1000 ? "warning" : diffBlocks > 100 ? "#439FE0" : "good",
        text: `Status of Tron Events MongoDB Sync at ${new Date().toUTCString()}`,
        fields: [
          {
            title: "Full Node nowBlock",
            value: `${nowBlock.number} (${moment(nowBlock.timestamp, "x").fromNow()})`,
            short: true
          }, {
            title: "Last InSync Block",
            value: `${blockNumber} (${timeBehind} behind)`,
            short: true
          }
        ]
      }
    ]
  };

  const response = await slackWebhook.post(`/services/${SLACK_WEBHOOK_TOKEN}`, payload);
  return response;
};

main()
  .then((response) => {
    logger.info(`response status: ${JSON.stringify(response.statusText)}`);
    process.exit(0);
  })
  .catch(err => {
    logger.error(err.stack);
    process.exit(1);
  });