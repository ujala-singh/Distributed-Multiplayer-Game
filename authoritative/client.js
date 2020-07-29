const gameState = {};
const middlewares = [];

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    width: 1000,
    height: 570,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y : 0,
        x : -600}
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    autoFocus : false
  };
   
  function preload() {

    this.load.image("ship1", "PNG/spaceShips_001.png");
    this.load.image("ship2", "PNG/spaceShips_002.png");
    this.load.image("ship3", "PNG/spaceShips_003.png");
    this.load.image("ship4", "PNG/spaceShips_004.png");
    this.load.image("ship5", "PNG/spaceShips_005.png");
    this.load.image("ship6", "PNG/spaceShips_006.png");
    this.load.image("bg", "PNG/background.png")
    this.load.image("m7", "PNG/m7.png");
    this.load.image("m6", "PNG/m6.png");
    this.load.image("m5", "PNG/m5.png");
    this.load.image("m4", "PNG/m4.png");
    this.load.image("m3", "PNG/m3.png");
    this.load.image("m2", "PNG/m2.png");
    this.load.image("m1", "PNG/m1.png");
    this.load.image("speed", "PNG/speed.png");
    this.load.image("shield", "PNG/shield1.png");
    this.load.image("bullet", "PNG/bullet.png");
  }
   
  function create() {
    gameState.context = this;
    gameState.playerCount = 0;
    gameState.players = this.physics.add.group();
    gameState.meteors = this.physics.add.group();
    gameState.bullets = this.physics.add.group();
    gameState.bulletCounter = 0;
    gameState.meteorCounter = 0;

    this.physics.add.collider(gameState.meteors, gameState.bullets, (m, b) => {
      middlewares.forEach((sock) => {
        sock.emit("gameMessage", {type : "meteorBlast", msg : [m.id, b.id]});  
      });
      try {
        gameState.players[b.name][score] += 60;
      } catch (e) {
        console.log(e);
      }
      m.destroy();
      b.destroy();
    });

    this.physics.add.collider(gameState.meteors, gameState.players, (m, p) => {
      middlewares.forEach((sock) => {
        sock.emit("gameMessage", {type : "playerBlast", msg : [m.id, p.name]});
      });
      m.destroy();
      delete gameState.players[p.name];
      p.destroy();
    })



    function meteorGenerator() {
      gameState.meteorCounter += 1;
      gameState.meteorCounter %= 9000;
      var coordy = Math.floor(Math.random() * 500) + 50;
      var difficulty = Math.floor(Math.random() * 6) + 1;
      var m = toString("m" + toString(difficulty));
      var sprite = gameState.context.physics.add.sprite(960, coordy, "m" + difficulty)
      gameState.meteorCounter += 1;
      gameState.meteors.add(sprite);
      var omega = Math.floor(Math.random() * 600 - 300);
      sprite.body.angularVelocity = omega;
      var v = (Math.floor(Math.random() * 60)) - 30;
      sprite.setVelocityY(v);
      sprite.id = gameState.meteorCounter;
      middlewares.forEach((sock) => {
        sock.emit("gameMessage", {type : "meteor", msg: {x : 960, y : coordy, difficulty : difficulty, angularVelocity : omega, velocityY : v, id : gameState.meteorCounter}});
      });
    }

    const meteorGenLoop = this.time.addEvent({
      delay : 600,
      loop : true,
      scope : gameState.context,
      callback : meteorGenerator
    });

    function score() {
      var scoreInfo = {};
      gameState.players.getChildren().forEach((p) => {
        gameState.players[p.name][score] += 100;
        scoreInfo[p.name] = gameState.players[p.name][score];
      });
      middlewares.forEach((sock) => {
        sock.emit("gameMessage", {type : "scoreUpdate", msg : scoreInfo});
      });
    }

    const scoreloop = this.time.addEvent({
      delay : 1500,
      loop : true,
      scope : gameState.context,
      callback : score
    });

    io.on("connection", (sock) => {
      middlewares.push(sock);

     sock.on("add", (username) => {
        gameState.playerCount += 1;
        gameState.playerCount %= 7;
        gameState.playerCount = Math.max(1, gameState.playerCount);
        gameState.players[username] = generatePlayer(username);
        gameState.players[username][score] = 0;
        addSprite(username);
        broadcastPlayersInfo();
      });

      sock.on("gameMessage", (response) => {
        if (response["action"][0] == "key") {
          handleKeyboard(response["who"], response["action"][1]);
        }
      });

      sock.on("remove", (username) => {
        removePlayer(username);
      });

    });
  }
   
  function update() {

    gameState.players.getChildren().forEach((p) => {
      gameState.players[p.name].x = p.x;
      gameState.players[p.name].y = p.y;
    });

    gameState.bullets.getChildren().forEach((b) => {
      if (b.x >= 1020) {
        b.destroy();
      }
    });

    gameState.meteors.getChildren().forEach((m) => {
      if (m.x <= -30) {
        m.destroy();
      }
    })
  }


  const game = new Phaser.Game(config);

  window.gameLoaded();


/////////////// UTILITY FUNCTIONS ///////////////////
  function generatePlayer(username) {
    var y = Math.floor(Math.random() * 600);
    var playerInfo = {x : 0, y : y, id : gameState.playerCount, username : username};
    return playerInfo;
  }

  function addSprite(username) {
    var playerInfo = gameState.players[username];
    var sprite = gameState.context.physics.add.sprite(playerInfo.x, playerInfo.y, "ship" + gameState.playerCount).setScale(0.45);
    gameState.players.add(sprite);
    sprite.angle = 90;
    sprite.name = username;
    sprite.keyboard = {UP : false, DOWN : false};
    sprite.setCollideWorldBounds(true);
  }

  function broadcastPlayersInfo() {
    var ret = {};
    gameState.players.getChildren().forEach((p) => {
      ret[p.name] = gameState.players[p.name];
    });
    middlewares.forEach((sock) => {
      sock.emit("gameMessage", {type : "playersInfo", msg : ret});
    });
  }
  
  function handleKeyboard(username, input) {
    gameState.players.getChildren().forEach((p) => {
      if (p.name == username) {
        if (input == "UP_down") {
          p.keyboard.UP = true;
        } else if (input == "UP_up") {
          p.keyboard.UP = false;
        } else if (input == "DOWN_down") {
          p.keyboard.DOWN = true;
        } else if (input == "DOWN_up") {
          p.keyboard.DOWN = false;
        } else if (input == "SPACE_up") {
          fireBullet(p.x, p.y, username);
          middlewares.forEach((sock) => {
            sock.emit("gameMessage", {type : "playerAction", who : username, action : ["fire", p.x, p.y, gameState.bulletCounter]})
          });
        } else if (input == "RIGHT_up") {
          p.setVelocityX(300);
          middlewares.forEach((sock) => {
              sock.emit("gameMessage", {type : "playerAction", who : username, action : ["jump"]});
          });
        }

        middlewares.forEach((sock) => {
          if (p.keyboard.UP == true) {
            p.setVelocityY(-240);
            sock.emit("gameMessage", {type : "playerAction", who : username, action : ["setVelocityY", -240]});
          }
          if (p.keyboard.DOWN == true) {
            p.setVelocityY(240);
            sock.emit("gameMessage", {type : "playerAction", who : username, action : ["setVelocityY", 240]});
          }
          if (p.keyboard.DOWN == false && p.keyboard.UP == false) {
            p.setVelocityY(0);
            sock.emit("gameMessage", {type : "playerAction", who : username, action : ["setVelocityY", 0]});
            broadcastPlayersInfo();
          }
        });
      }
    });
  }

  function fireBullet(x, y, username) {
    gameState.bulletCounter += 1;
    gameState.bulletCounter %= 9000;
    var sprite = gameState.context.physics.add.sprite(x + 30, y, "bullet").setScale(0.75);
    gameState.bullets.add(sprite);
    sprite.angle = 90;
    sprite.name = username;
    sprite.id = gameState.bulletCounter;
    sprite.setVelocityX(300);
    sprite.body.setGravity(1200, 0);
  }

  function removePlayer(username) {
    delete gameState.players[username];
    gameState.players.getChildren().forEach((p) => {
      if (p.name == username) {
        p.destroy();
      }
    });
    middlewares.forEach((sock) => {
      sock.emit("gameMessage", {type : "removePlayer", msg : username});
      sock.emit("chatMessage", {"who" : "Game Server", "message" : `${username} left the room.`});
    });
  }


  

  