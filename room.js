class room {
    constructor(gameServer, roomname, port) {
        this.roomname = roomname;
        this.gameServer = gameServer;
        gameServer.on("playersList", (response) => {
            this.sendToPlayers("playersList", response);
        });
        gameServer.on("chatMessage", (response) => {
            this.sendToPlayers("chatMessage", response);
        });
        gameServer.on("gameMessage", (response) => {
            this.sendToPlayers("gameMessage", response);
        });
        this.playersCount = 0;
        this.users = new Map();
        this.port = port;
        this.requestCounter = 99;
    }

    sendToPlayers(type, response) {        
        for (var k in this.users) {
            this.users[k].emit(type, response);
        }
    }

    removeUser(username) {
        this.playersCount--;
        delete this.users[username];
        console.log(`Users connected to ${this.roomname} : ${this.playersCount}`);
        this.gameServer.emit("remove", username);
    }

    addUser(username, sock) {
        this.requestCounter++;
        this.gameServer.emit("addPlayerRequest", [this.port + this.requestCounter, username]);
        this.gameServer.on(username + (this.port + this.requestCounter), (response) => {
            console.log("reply received");
            if (response == true) {
                console.log("granted" + (this.port + this.requestCounter));
                this.playersCount++;
                sock.emit("credentialReply", [true]);
                this.users[username] = sock;
                sock.on("chatMessage", (msg) => {
                    this.gameServer.emit("chatMessage", {"who" : username, "message" : msg});
                });
                sock.on("gameMessage", (msg) => {
                    this.gameServer.emit("gameMessage", {"who" : username, "action" : msg});
                });
                sock.on("disconnect", () => {
                    this.removeUser(username);
                });
                console.log(`Users connected to ${this.roomname} : ${this.playersCount}`);
                this.gameServer.emit("add", username);
            } else {
                sock.emit("credentialReply", [false, 1]);
            }
        });
    }

    sendOnlineUsers() {

    }
}

module.exports = room;