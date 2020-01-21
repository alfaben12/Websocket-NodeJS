var express = require('express');

var app = express();
app.set('port', process.env.PORT || 8080);
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = app.get('port');

const api = require('./api/answers.json')

let questions = api.map((item) => {
    return item.question
})

app.use(express.static('public'));

server.listen(port, function () {
    console.log("Server listening on: http://localhost:%s", port);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var usernames = {};
var rooms = [];

io.sockets.on('connection', function (socket) {
    
    socket.on('adduser', function (data) {
        var username = data.username;
        var room = data.room;
        
        if (rooms.indexOf(room) != -1) {
            socket.username = username;
            socket.room = room;
            usernames[username] = username;
            socket.join(room);
            // socket.emit('updatechat', 'SERVER', 'Let chat with me');
            socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        } else {
            socket.emit('updatechat', 'SERVER', 'Please enter valid code.');
        }
    });
    
    socket.on('createroom', function (data) {
        var new_room = ("" + Math.random()).substring(2, 7);
        rooms.push(new_room);
        data.room = new_room;
        socket.emit('updatechat', 'BukaKopiBot', 'Selamat datang di BukaKopi chatbot 🥳🥳🥳');
        socket.emit('updatechat', 'BukaKopiBot', 'Fitur pendaftaran dengan Bot!');
        socket.emit('updatechat', 'BukaKopiBot', 'Siapa username Kamu?');
        socket.emit('roomcreated', data);
    });
    
    let step = 2 // 1-8
    let answers = []
    socket.on('sendchat', function (data) {
        
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        
        if (data.toLowerCase() == 'i love u') {
            io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "I Love U too ❤️❤️❤️");
        }else{
            if (step == 1) {
                socket.emit('updatechat', 'BukaKopiBot', 'Siapa username Kamu?');
                answers.push(data)
                step++;
            }else if (step == 2) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Apa email Kamu?");
                answers.push(data)
                step++;
            }else if (step == 3) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Siapa nama lengkap kamu?");
                answers.push(data)
                step++;
            }else if (step == 4) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Apa password Kamu?");
                answers.push(data)
                step++;
            }else if (step == 5) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Tinggal di Provinsi apa?");
                answers.push(data)
                step++;
            }else if (step == 6) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Tinggal di Kota apa?");
                answers.push(data)
                step++;
            }else if (step == 7) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Masukkan alamat lengkap Kamu?");
                answers.push(data)
                step++;
            } else if (step == 8) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Langkah terakhir masukkan No HP?");
                answers.push(data)
                step++;
            }else{
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Yay pendaftaran telah selesai");
            }
        }

        console.log(answers.length)
        // io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        // let message = data;
        // questions.forEach((question, index) => {
        //     if (data.toLowerCase() === question) {
        //         io.sockets.in(socket.room).emit('updatechat', "BOT", `BukaKopiBot ${api[index].answer}`);
        //     }
        //   })
    });
    
    socket.on('disconnect', function () {
        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        if (socket.username !== undefined) {
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
            socket.leave(socket.room);
        }
    });
});