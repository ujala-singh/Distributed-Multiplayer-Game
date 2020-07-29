var sock = io();

function init() {
    var onlineUsers = document.getElementById("onlineUsers");
    var chatbox = document.getElementById("chatbox");
    onlineUsers.style.display = "none";
    chatbox.style.display = "none";
}

init();

function updateOnlinePlayers(players) {
    var l = document.getElementById("onlineUsersList");
    l.innerHTML = "";
    players.forEach((p) => {
        var el = document.createElement("li");
        el.innerHTML = p;
        l.appendChild(el);
    });
}

function addChatMessage(response) {
    var chatMessages = document.getElementById("chatMessages");
    var el = document.createElement("li");
    el.innerHTML = `<strong> ${response["who"]} :</strong> ${response["message"]}`;
    el.setAttribute("class", "list-group-item");
    chatMessages.appendChild(el);
}


var credentialsForm = document.getElementById("credentialsForm");
credentialsForm.addEventListener("submit", (e) => {
    var username = document.getElementById("usernameInput").value;
    gameState.username = username;
    var roomname = document.getElementById("roomnameInput").value;
    if (roomname != "" && username != "") {
      sock.emit("credentials", [username, roomname]);
    } else {
      toastr.warning("Username && Roomname can't be left blank", "Invalid Username && Roomname");
    }
    e.preventDefault();
});

sock.on("locationInfo", (msg) => {
    console.log("received");
    toastr["success"](msg, "Connection Established");
});

sock.on("playersList", updateOnlinePlayers);
sock.on("chatMessage", addChatMessage);

sock.on("credentialReply", (response) => {
    if (response[0] == false) {
      if (response[1] == 0) {
        toastr.error("Room not available. Try Again Later!!!", "Error");
      } else if (response[1] == 1){
        console.log("username exists");
        toastr.error("Try Different Username", "Username Already Exists in Room");
      }
    } else {       
        credentialsForm.style.display = "none";
        onlineUsers.style.display = "block";
        chatbox.style.display = "block";
    }
});    

var chatboxForm = document.getElementById("chatboxForm");
chatboxForm.addEventListener("submit", (e) => {
    e.preventDefault();
    var chatInput = document.getElementById("chatInput");
    if (chatInput.value != "") {
        sock.emit("chatMessage", chatInput.value);
        chatInput.value = "";
    }
});

// GAME
const gameState = {};
const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1000,
    height: 570 + 45,
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    physics: {
        default : "arcade",
        arcade : {
            debug : false,
            gravity : {y : 0,
            x : -600}
        }
    }
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
    this.load.image("shield", "PNG/shield.png");
    this.load.image("bullet", "PNG/bullet.png");
    this.load.image("b1", "PNG/regularExplosion01.png");
    this.load.image("b2", "PNG/regularExplosion02.png");
    this.load.image("b3", "PNG/regularExplosion03.png");
    this.load.image("b4", "PNG/regularExplosion04.png");
    this.load.image("b5", "PNG/regularExplosion05.png");
    this.load.image("b6", "PNG/regularExplosion06.png");
    this.load.image("b7", "PNG/regularExplosion07.png");
    this.load.image("b8", "PNG/regularExplosion08.png");

  }
   
  function create() {
    this.add.image(0, 0, "bg")
    gameState.playerCount = 0;
    gameState.context = this;
    gameState.players = this.physics.add.group();
    gameState.meteors = this.physics.add.group();
    gameState.bullets = this.physics.add.group();
    gameState.scoreText = this.add.text(16, 570 + 6, 'scores: ', { fontSize: '18px', fill: '#ffffff' });

    this.anims.create({
      key: 'blast',
      frames: [
          { key: 'b1' },
          { key: 'b2' },
          { key: 'b3' },
          { key: 'b4' },
          { key: 'b5' },
          { key: 'b6' },
          { key: 'b7' },
          { key: 'b8', duration: 300 }
      ],
      repeat: 0,

    });

    addKeyListeners();

    sock.on("gameMessage", (response) => {
        if (response.type == "playersInfo") {
            updatePositions(response.msg);
        } else if (response.type == "playerAction") {
            handlePlayerAction(response.who, response.action);
        } else if (response.type == "meteor") {
            generateMeteor(response.msg);
        } else if (response.type == "meteorBlast") {
            handleMeteorBlast(response.msg);
        } else if (response.type == "removePlayer") {
            removePlayer(response.msg);
        } else if (response.type == "playerBlast") {
            handlePlayerBlast(response.msg);
        } else if (response.type == "scoreUpdate") {
          updateScores(response.msg);
        }
    });
  }

  function updateScores(scores) {
    var scoreString = "";
    for (var k in scores) {
      scoreString += k + " : " + scores[k];  
    }
    gameState.scoreText.setText(scoreString);
  }
   
  function update() {
      gameState.bullets.getChildren().forEach((b) => {
        if (b.x >= 1020) {
            b.destroy();
        }
      });

      gameState.meteors.getChildren().forEach((m) => {
        if (m.x <= -30) {
            m.destroy();
        }
      });

      gameState.players.getChildren().forEach((p) => {
        p.shield.x = p.x;
        p.shield.y = p.y;
        p.speed.x = p.x - 24;
        p.speed.y = p.y;
      });
  }


  const game = new Phaser.Game(config);

  ///////////// UTILITY FUNCTIONS /////////////////

  function updatePositions(playersInfo) {
      for (var key in playersInfo) {
          var found = false;
          gameState.players.getChildren().forEach((p) => {
            if (p.name == key) {
                p.x = playersInfo[key].x;
                p.y = playersInfo[key].y;
                found = true;
            }
          });
          if (found == false) {
            gameState.players[key] = playersInfo[key];
            var sprite = gameState.context.physics.add.sprite(playersInfo[key].x, playersInfo[key].y, "ship" + playersInfo[key].id).setScale(0.45);
            gameState.players.add(sprite);
            sprite.angle = (90);
            sprite.name = key;
            sprite.setCollideWorldBounds(true);
            ///
            sprite.speed = gameState.context.physics.add.sprite(sprite.x, sprite.y, "speed").setScale(0.60);
            sprite.speed.angle = 270;
            ///
            sprite.shield = gameState.context.physics.add.sprite(sprite.x, sprite.y, "shield");
            sprite.shield.angle = 90;
            sprite.shield.setAlpha(0.1);
            ///
            
          }
      }
  }

  function addKeyListeners() {
      gameState.context.input.keyboard.on("keydown-" + "UP", (event) => {
        sock.emit("gameMessage", ["key", "UP_down"]);
      });
      gameState.context.input.keyboard.on("keyup-" + "UP", (event) => {
        sock.emit("gameMessage", ["key", "UP_up"]);
      });
      gameState.context.input.keyboard.on("keydown-" + "DOWN", (event) => {
        sock.emit("gameMessage", ["key", "DOWN_down"]);
      });
      gameState.context.input.keyboard.on("keyup-" + "DOWN", (event) => {
        sock.emit("gameMessage", ["key", "DOWN_up"]);
      });
      gameState.context.input.keyboard.on("keyup-" + "SPACE", (event) => {
        sock.emit("gameMessage", ["key", "SPACE_up"]);
      });
      gameState.context.input.keyboard.on("keyup-" + "RIGHT", (event) => {
        sock.emit("gameMessage", ["key", "RIGHT_up"]);
      });
  }

  function handlePlayerAction(username, action) {
    gameState.players.getChildren().forEach((p) => {
        if (p.name == username) {
            if (action[0] == "jump") {
                p.setVelocityX(300);
            } else if (action[0] == "fire") {
                fireBullet(action[1], action[2], action[3]);
            } else if (action[0] == "setVelocityY") {
                p.setVelocityY(action[1]);
            }
        }
    });
  }

  function fireBullet(x, y, id) {
    var sprite = gameState.context.physics.add.sprite(x + 30, y, "bullet").setScale(0.75);
    gameState.bullets.add(sprite);
    sprite.angle = 90;
    sprite.id = id;
    sprite.setVelocityX(300);
    sprite.body.setGravity(1200, 0);
  }

  function generateMeteor(msg) {
      var sprite = gameState.context.physics.add.sprite(msg.x, msg.y, "m" + msg.difficulty);
      gameState.meteors.add(sprite);
      sprite.setVelocityY(msg.velocityY);
      sprite.body.angularVelocity = msg.angularVelocity;
      sprite.id = msg.id;
  }

  function handleMeteorBlast(msg) {
      var meteor_id = msg[0];
      var bullet_id = msg[1];
      gameState.meteors.getChildren().forEach((m) => {
        if (m.id == meteor_id) {            
            gameState.context.add.sprite(m.x, m.y, "b1").play("blast");
            m.destroy();
        }
      });

      gameState.bullets.getChildren().forEach((b) => {
        if (b.id == bullet_id) {
            b.destroy();
        }
      });
  }

  function handlePlayerBlast(msg) {
    var meteor_id = msg[0];
    var player_id = msg[1];
    gameState.meteors.getChildren().forEach((m) => {
      if (m.id == meteor_id) {       
          gameState.context.add.sprite(m.x, m.y, "b1").play("blast");
          m.destroy();
      }
    });

    gameState.players.getChildren().forEach((p) => {
      if (p.name == player_id) {       
        gameState.context.add.sprite(p.x, p.y, "b1").play("blast");
          delete gameState.players[p.name];
          p.destroy();
      }
    });
  }

  function removePlayer(username) {
      delete gameState.players[username];
      gameState.players.getChildren().forEach((p) => {
        if (p.name == username) {
            p.destroy();
        }
      });
  }

