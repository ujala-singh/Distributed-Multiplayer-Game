# Distributed-Multiplayer-Game

# Escape Black Hole

It is a distributed cooperative multiplayer game.

## Getting Started

1. Fork or clone this repo.
2. cd into the "three-tier-distributed-game" directory.
3. Enter "npm init" on command line.
4. Finally enter npm install on command line. (If you are behind the proxy server, then npm install may not work. Try using vpn or connect your machine throgh mobile data.)

### Prerequisites

1. The application is written in javascript and uses nodejs at the backend.
2. Install nodejs from nodejs.org.
3. Dependencies include the following nodejs packages
  * PhaserJS
  * jsdom
  * socket.io
  * express
  * node canvas
  
All these modules can be install independently through npm or you can just use "npm install" command to install all of them at once.

## Running the Game

Open 6 command line instances and cd into the project directory.
Enter the following commands in order on each of the command line instances.
```
1. node master_middleware9000.js
2. node game_server4999.js
3. node game_server5000.js
4. node middleware9100.js
5. node middleware9200.js
6. node middleware9300.js
```

Then open browser. Supply *roomname* (any string) and username to the form on the webpage. The game should start and you would be able to shoot the meteors with "SPACE BAR" and move your ship on the game screen.
You can ask your friends to join the room you have created by communicating *roomname*.
Refer to Screenshots attached.
