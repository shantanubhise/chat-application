const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
  logLevel: logLevel.INFO, // Set the log level as needed
});

let producer;
let consumer;
let admin;

async function connectToKafka() {
  producer = kafka.producer();
  consumer = kafka.consumer({ groupId: 'my-chat-group' });
  admin = kafka.admin();

  await producer.connect();
  await consumer.connect();
  await admin.connect();

  // Create the 'MESSAGES' topic if it doesn't exist
  await admin.createTopics({
    topics: [{ topic: 'MESSAGES' }],
  });
  console.log('Kafka producer, consumer, and admin connected');
}

async function getProducer() {
  if (!producer) {
    throw new Error('Kafka producer not initialized. Call connectToKafka() first.');
  }
  return producer;
}

async function getConsumer() {
  if (!consumer) {
    throw new Error('Kafka consumer not initialized. Call connectToKafka() first.');
  }
  return consumer;
}

async function produceMessage(topic, message) {
  try {
    const producer = await getProducer();
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) },
      ],
    });

    console.log('Message sent to Kafka:', message);
  } catch (error) {
    console.error('Error producing message to Kafka:', error.message);
  }
}

async function subscribeToTopic(topic, callback) {
  try {
    const consumer = await getConsumer();

    // Subscribe to the specified topic
    await consumer.subscribe({ topic });

    // Run the consumer to start receiving messages
    await consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value);
        callback(data);
      },
    });

    console.log(`Subscribed to Kafka topic: ${topic}`);
  } catch (error) {
    console.error('Error subscribing to topic:', error.message);
  }
}

module.exports = {
  connectToKafka,
  // getProducer,
  // getConsumer,
  produceMessage,
  subscribeToTopic,
};
