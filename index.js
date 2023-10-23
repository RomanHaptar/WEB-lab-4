const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = {};
let colors = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const name = data.name;
        const color = data.color;
        if(users[name]) {
            socket.emit('duplicate user', "Це ім'я вже використовується. Будь ласка, виберіть інше ім'я.");
            return;
        } else {
            users[name] = socket;
            colors[name] = color;
            io.emit('chat message', { name: 'Server', message: name + ' приєднався до чату', color: '#000000' });
            io.emit('join', { name: name, color: colors[name] }); 
            io.emit('users', Object.keys(users).map(user => ({ name: user, color: colors[user] }))); 
        }
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { name: data.name, message: data.message, color: data.color });
    });

    socket.on('disconnect', () => {
        let name;
        for(let user in users) {
            if(users[user] === socket) {
                name = user;
                delete users[user];
                delete colors[user];
            }
        }
        if(name) {
            io.emit('users', Object.keys(users));
            io.emit('chat message', { name: 'Server', message: name + ' вийшов з чату', color: '#000000' });
        }
    });
});

server.listen(3000, () => {
    console.log('Сервер прослуховує порт 3000');
});
