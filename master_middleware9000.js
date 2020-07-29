let http = require('http');
let express = require('express');
let socketio = require('socket.io');
let app = express();
let server = http.createServer(app);
let io = socketio(server);
server.listen(9000);
console.log("Master Middleware on Port 9000");
app.use(express.static(__dirname + "/client"));

var m = new Map();

const gameServerIPs = ["http://localhost:4999", "http://localhost:5000"];
var n = gameServerIPs.length;
for (var k = 0 ; k < n ; k++) {
    m[k] = {status : false, roomname : null, index : k, roomAdmin : null};
}

servants = [];

// master.on("roomRequestReply", (roomRequestReply) => {
//     if (roomRequestReply.granted == false) {
//         sock.emit("credentialReply", false);
//     } else if (roomRequestReply.roomname == roomname && roomRequestReply.id == id){
//         rooms[roomname] = new room(gameServers[gameServerIndex], roomname);
//     }
// });

io.on("connection", (sock) => {
    servants.push(sock);
    sock.on("roomRequest", (request) => {
        var roomname = request[0];
        var requesterID = request[1];
        console.log(roomname + " " + requesterID);
        var sig = -1;
        for (var j = 0 ; j < n ; j++) {
            if (m[j].status == false) {
                m[j].status = true;
                m[j].roomname = roomname;;
                m[j].roomAdmin = requesterID;
                sig = j;
                break;
            }
        }
        var roomRequestReply = {};
        console.log(sig);
        if (sig != -1) {
            roomRequestReply = {granted : true, id : requesterID, roomname : roomname, gameServerIndex : sig};
        } else {
            roomRequestReply = {granted : false, roomname : null, id : requesterID, gameServerIndex : null};
        }        
        sock.emit("roomRequestReply", roomRequestReply);
        if (sig != -1) {
            servants.forEach((s) => {
                if (s == sock) {                  
                } else {
                    s.emit("updateMap", {index : sig, roomname : roomname});
                }
            });
        }
    });
});




