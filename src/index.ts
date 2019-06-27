import axios from 'axios';

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
  return data['block_header']['raw_data']['number'];
};

const getLatestMongoDBBlock = async () => {
  const blocksCount = await Block.estimatedDocumentCount();
  const found = await Block.find({}).sort({ timeStamp: 1 }).skip(blocksCount - 1).limit(1);
  return found[0];
};

const main = async () => {
  const nowBlockNumber = await getNowBlockNumber();
  logger.info(`nowBlock number: #${JSON.stringify(nowBlockNumber)}`);
  const { blockNumber } = await getLatestMongoDBBlock();

  const diff = (nowBlockNumber - blockNumber);

  const payload = {
    attachments: [
      {
        fallback: `Status of Tron Events MongoDB Sync at ${Date.now()}`,
        color: diff > 10000 ? "#de4e2b" : diff > 1000 ? "warning" : diff > 100 ? "#439FE0" : "good",
        text: `Status of Tron Events MongoDB Sync at ${new Date().toUTCString()}`,
        fields: [
          {
            title: "TronWallet's Full Node nowBlock",
            value: nowBlockNumber,
            short: true
          }, {
            title: "Last InSync Block",
            value: blockNumber,
            short: true
          }, {
            title: "blocks behind Full Node",
            value: diff,
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
    logger.info(`response status: ${JSON.stringify(response)}`);
    process.exit(0);
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });