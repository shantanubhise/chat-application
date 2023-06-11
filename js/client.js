const socket = io('http://localhost:8000', { transports: ['websocket'] })

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');
var audio = new Audio('Message notification.mp3');

const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageContainer.append(messageElement);
    if (position == 'left') {
        audio.play();
    }
}

const userName = prompt("Enter your name to join.");

socket.emit('new-user-joined', userName);

socket.on('user-joined', userName => {
    append(`${userName} has joined`, 'right');
})

socket.on('receive', data => {
    append(`${data.name} : ${data.message}`, 'left');
})

socket.on('left-chat', userName => {
    append(`${userName} has left the chat`, 'left');
})

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    append(`You : ${message}`, 'right');
    socket.emit('send', message);
    messageInput.value = '';

})
