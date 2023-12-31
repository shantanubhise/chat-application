// Use the default port 3000 if not specified
const envPort = window.location.port || '3000';
const socket = io(`http://localhost:${envPort}`, { transports: ['websocket'] });

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.getElementById('messages');
var audio = new Audio('../assets/audios/Message notification.mp3');

// Prompt for the username once when the page loads
const userName = prompt("Enter your name to join.");
socket.emit('new-user-joined', userName);

// Function to append messages to the chat container
const appendMessage = (data, position='left') => {
    let {message, name, senderId} = data;
    if(senderId === socket.id){
        position = 'right';
        name = 'You';
    }
    const messageElement = document.createElement('li');
    messageElement.innerText = `${name}: ${message}`;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageContainer.appendChild(messageElement);
    if (position == 'left') {
        audio.play();
    }
};

// Event: user joined
socket.on('user-joined', userName => {
    appendMessage({'name': userName, 'message': ' has joined', 'senderId': '123'});
});

// Event: receive message
socket.on('receive', data => {
    appendMessage(data);
});

// Event: user left
socket.on('left-chat', userName => {
    appendMessage({'name':userName, 'message': ' has left the chat', 'senderId': '123'});
});

// Event: form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    // appendMessage(`You: ${message}`, 'right');
    socket.emit('send', message);
    messageInput.value = '';
});
