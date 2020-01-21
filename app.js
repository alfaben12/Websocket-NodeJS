express = require('express');

var app = express();
app.set('port', process.env.PORT || 8080);
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = app.get('port');
const api = require('./api/answers.json')
const axios = require(`axios`)

let questions = api.map((item) => {
    return item.question
})

app.use(express.static('public'));

var fs = require('fs'); 

server.listen(port, function () {
    console.log("Server listening on: http://localhost:%s", port);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var usernames = {};
var rooms = [];
let province;
let city;

io.sockets.on('connection', async function (socket) {
    let address = socket.request.connection.remoteAddress;
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
    let answers = {}
    let count = 0;
    socket.on('sendchat', function (data) {
        count++
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        
        if (data.toLowerCase() == 'i love u') {
            io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "I Love U too "+ socket.username +" ❤️❤️❤️");
        }else{
            if (step == 1) {
                socket.emit('updatechat', 'BukaKopiBot', 'Siapa username Kamu?');
                answers.username = data
                step = 2;
            }else if (step == 2) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Apa email Kamu?");
                answers.username = data
                step = 3;
            }else if (step == 3) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Siapa nama lengkap kamu?");
                answers.email = data
                step = 4;
            }else if (step == 4) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Apa password Kamu?");
                answers.full_name = data
                step = 5;
            }else if (step == 5) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Boleh aku tebak kamu tinggal diprovinsi mana? (ya/tidak) jika tidak langsung ketik provinsi kamu.");
                answers.password = data
                step = 6;
            }else if (step == 6) {
                if (step == 6 && data.toLowerCase() == "ya") {
                    let endpoint = "http://api.ipinfodb.com/v3/ip-city/?key=20b96dca8b9a5d37b0355e9461c66e76eed30a2274422fa6213d9de6ffb2b34e&ip="+ address;
                    axios.get(endpoint)
                    .then(async function (response) {
                        let location_array = response.data.split(";")
                        province = location_array[5]
                        io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Kamu tinggal di provinsi "+ province +" benarkah? ya/tidak");
                        step = 10;
                    })
                    .catch(async function (error) {
                        province = ""
                    });
                }else{
                    io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Masukkan kota Kamu?");
                    answers.province = data
                    step = 7;
                }
            }else if (step == 7) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Masukkan alamat lengkap Kamu?");
                answers.city = data
                step = 8;
            }else if (step == 8) {
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Langkah terakhir masukkan No HP?");
                answers.address = data
                step = 9;
            }else if (step == 10) {
                if (data.toLowerCase() == "ya") {
                    let endpoint = "http://api.ipinfodb.com/v3/ip-city/?key=20b96dca8b9a5d37b0355e9461c66e76eed30a2274422fa6213d9de6ffb2b34e&ip="+ address;
                    axios.get(endpoint)
                    .then(async function (response) {
                        let location_array = response.data.split(";")
                        province = location_array[5]
                        answers.province = data
                        io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Masukkan kota Kamu?");
                        step = 7;
                    })
                    .catch(async function (error) {
                        province = ""
                    });
                }else{
                    io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Opps maaf aku salah menebak.");
                    io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Masukkan provinsi kamu.");
                    step = 6;
                }
                
            }else{
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Yay pendaftaran telah selesai, kamu tidak boleh login sementara, jangan khawatir datakamu sudak aku simpan.");
                io.sockets.in(socket.room).emit('updatechat', 'BukaKopiBot', "Kamu bisa akses datamu di bot.bukakopi.com/"+ socket.username +".json");
                answers.phone = data
                answers.ipaddress = address
                // writeFile function with filename, content and callback function
                fs.writeFile('./public/'+socket.username +'.json', JSON.stringify(answers), function (err) {
                    if (err) throw err;
                    console.log('File is created successfully.');
                }); 
            }
        }
        
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