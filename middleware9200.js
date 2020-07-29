let http = require('http');
let express = require('express');
let socketio = require('socket.io');
let app = express();
let server = http.createServer(app);
let clientSide = socketio(server);
// unique configuration
var id = 9200;
server.listen(9200);
console.log("Middleware USA on Port 9200");
//
app.use(express.static(__dirname + "/client"));
var socketioclient = require("socket.io-client");

// start copy from here

var idOffset = 1;



//let gameServer = require("socket.io-client").connect("http://localhost:4999");

// gameServer.on("gameServer_wel", (response) => {
//     console.log(response);
// });

const masterMiddlewareIP = "http://localhost:9000";
var master = socketioclient.connect(masterMiddlewareIP);

const gameServerIPs = ["http://localhost:4999", "http://localhost:5000"];
var gameServers = [];
gameServerIPs.forEach((address) => {
    gameServers.push(socketioclient.connect(address));
});

var maxRoomCapacity = gameServers.length;


// Browser Side Messaging

var room = require("./room");
var connectedUsers = 0;

var rooms = new Map();

master.on("updateMap", (response) => {
    var index = response.index;
    var roomname = response.roomname;
    if (roomname in rooms) {

    } else {
        if (index != -1) {
            rooms[roomname] = new room(gameServers[index], roomname, server.address().port);
        }
    }
    console.log(rooms)
});

clientSide.on("connection", (sock) => {
    clientSide.emit("locationInfo", "You are connected to Middleware " + server.address().port);
    connectedUsers += 1;



    
    sock.on("credentials", (response) => {
        //console.log(rooms);
        //assign a server to the credentials
        var username = response[0];
        var roomname = response[1];
        var currID = id + idOffset;
        idOffset++;
        if (roomname in rooms) {
            rooms[roomname].addUser(username, sock);
        } else {
            master.emit("roomRequest", [roomname, currID]);
            master.on("roomRequestReply", (roomRequestReply) => {
                console.log(roomRequestReply.id);
                if (roomRequestReply.id == currID && roomRequestReply.granted == false) {
                    sock.emit("credentialReply", [false, 0]); // [false for not allowed] and [0] is the reason behind not permitting room creation, in this case 0 stands for "Room not available".
                } else if (roomRequestReply.id == currID) {
                    var gameServerIndex = roomRequestReply.gameServerIndex;
                    rooms[roomname] = new room(gameServers[gameServerIndex], roomname, server.address().port);
                    rooms[roomname].addUser(username, sock);
                }
                master.removeListener("roomRequestReply");
            });
        }
    });
});


// copy till here

console.log("Middleware USA");


