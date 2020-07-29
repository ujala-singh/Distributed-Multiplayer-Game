var socketio = require("socket.io");
var io = socketio.listen(4999);

console.log("Game Server Running on Port 4999");

// start copy from here


// Chat Logic
middlewares = [];
players = [];

function sendToMiddlewares(type, message) {
    middlewares.forEach((sock) => {
        sock.emit(type, message);
    });
}

function sendPlayersList() {
    sendToMiddlewares("playersList", players);
}

io.on("connection", (sock) => {
    console.log("Middleware got connected");

     /// Prevention of Duplicate Usernames
    sock.on("addPlayerRequest", (msg) => {
        console.log("In Game Server 4999");
        var rqId = msg[0];
        var name = msg[1];
        var name_exist = false;
        players.forEach((p) => {
            if (p == name) {
                name_exist = true;
            }
        });
        if (name_exist == false) {
            sock.emit(name + rqId, true);
        } else {
            sock.emit(name + rqId, false);
        }
    });
      
    middlewares.push(sock);
    sock.on("add", (response) => {
        players.push(response);
        console.log(players);
        sendPlayersList();
    });
    sock.on("remove", (response) => {
        for (var k = 0 ; k < players.length ; k++) {
            if (players[k] == response) {
                players.splice(k, 1);
                break;
            }
        }
        sendPlayersList();
    });
    sock.on("chatMessage", (response) => {
        sendToMiddlewares("chatMessage", response);
    });
    
});

// Game Logic

const path = require("path");

const Datauri = require("datauri");
const datauri = new Datauri();
const jsdom = require("jsdom");

const { JSDOM } = jsdom;

function setupAuthoritativePhaser() {
    JSDOM.fromFile(path.join(__dirname, 'authoritative/index.html'), {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then((dom) => {
        dom.window.URL.createObjectURL = (blob) => {
            if (blob){
                return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
            }
        };
        dom.window.URL.revokeObjectURL = (objectURL) => {};
        dom.window.gameLoaded = () => {
        };
        dom.window.io = io;
    }).catch((error) => {
        console.log(error.message);
    });
}

setupAuthoritativePhaser();

