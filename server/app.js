// Node server which will handle socket io connections.
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const Redis = require('ioredis');
const sequelize = require('./sequelize');
const Message = require('./models/message');
const { connectToKafka, produceMessage, subscribeToTopic } = require('./kafka');



// Sync Sequelize models with the database
sequelize.sync()
    .then(() => {
        console.log('Sequelize models synced with the database');
    })
    .catch((error) => {
        console.error('Error syncing Sequelize models:', error.message);
    });


const app = express();
const server = http.createServer(app);
const io = socketIO(server);
connectToKafka();

// Create a new Redis instance for communication between server instances
const redisSubscriber = new Redis({
    host: 'localhost',
    port: 6379
});

const redisPublisher = new Redis({
    host: 'localhost',
    port: 6379
});


// Subscribe to the 'MESSAGES' channel in Redis
redisSubscriber.subscribe('MESSAGES');

const users = {};

io.on('connection', socket => {
    console.log(`User connected. Socket ID: ${socket.id}`);
    // Event: new user joined
    socket.on('new-user-joined', name => {
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
    });

    // Event: send message
    socket.on('send', async (message) => {
        // socket.broadcast.emit('receive', { message: message, name: users[socket.id] });
        try {
            const data = {
                message,
                name: users[socket.id],
                senderId: socket.id
            }
            // Publish the message to the 'MESSAGES' channel in Redis
            await redisPublisher.publish('MESSAGES', JSON.stringify(data));
            // Publish the message to the 'MESSAGES' topic in Kafka
            await produceMessage('MESSAGES', data);
        } catch (error) {
            console.error('Error publishing message to Redis:', error.message);
        }
    });

    // Event: user disconnects
    socket.on('disconnect', message => {
        socket.broadcast.emit('left-chat', users[socket.id]);
        delete users[socket.id];
    });
});

// Handle messages received from Redis within the Socket.IO connection
redisSubscriber.on('message', async (channel, message) => {
    try {
        if (channel === "MESSAGES") {
            const data = JSON.parse(message);
            console.log('Received data from Redis:', data);

            // Broadcast the message to all connected clients
            io.emit('receive', data);
        }
    } catch (error) {
        console.error('Error processing message from Redis:', error.message);
    }
});

// Initialize variables for message batch and batch size
const messageBatch = [];
const batchSize = 10;

// Function to process and save the batch of messages to the database
async function processAndSaveBatch(batch) {
    try {
        console.log('Processing message batch', batch.length);
        if (batch.length > 0) {
            // Process and save the batch of messages to the database using Sequelize
            await Message.bulkCreate(batch)
            console.log('Batch of messages saved to the database:', batch);
        }
    } catch (error) {
        console.error('Error processing and saving batch to the database:', error.message);
    }
}

subscribeToTopic('MESSAGES', async (data) => {
    try {
        console.log('Received data from Kafka:', data);

        // Add the message to the batch for processing
        messageBatch.push({
            content: data.message,
            created_by: data.name,
        });
        console.log('messageBatch length:', messageBatch.length);

        // Check if the batch size is reached
        if (messageBatch.length >= batchSize) {
            const batchToProcess = extractAndClearBatch();
            await processAndSaveBatch(batchToProcess);
        }
    } catch (error) {
        console.error('Error processing message from Kafka:', error.message);
    }
});

// Periodically process and save remaining messages in the batch
setInterval(async () => {
    const batchToProcess = extractAndClearBatch();
    await processAndSaveBatch(batchToProcess);
}, 5 * 1000);

// Function to create a copy of the message batch and clear it
function extractAndClearBatch() {
    const batchCopy = [...messageBatch];
    messageBatch.length = 0;
    return batchCopy;
}

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Use the 'static' middleware to serve other static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Redis Error Handling
redisPublisher.on('error', error => {
    console.error('Redis Publisher Error:', error.message);
});
redisSubscriber.on('error', error => {
    console.error('Redis Subscriber Error:', error.message);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

