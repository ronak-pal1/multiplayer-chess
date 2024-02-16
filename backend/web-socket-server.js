const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const port = 6969;
const host = "localhost";

const server = http.createServer({ express });

const wss = new WebSocket.Server({ server });

let rooms = [];
const MAX_PLAYERS = 2;

/*
  structure of each room

  {
    roomId: "afa",
    players: [],
  }
*/

const roomIndex = (id) => {
  for (const index in rooms) {
    if (rooms[index].roomId == id) return index;
  }

  return -1;
};

const isRoomExists = (id) => {
  for (const index in rooms) {
    if (rooms[index].roomId == id) return { exists: true, roomIndex: index };
  }

  return { exists: false, roomIndex: -1 };
};

const joinRoom = (id, ws) => {
  const checkExistance = isRoomExists(id);

  if (checkExistance.exists) {
    if (rooms[checkExistance.roomIndex]["players"].length < MAX_PLAYERS)
      rooms[checkExistance.roomIndex]["players"].push(ws);

    // setting the player color of the second player as black
    const data = `{"requestType":"setColor", "color":"black"}`;
    ws.send(data);
  } else {
    const room = {
      roomId: id,
      players: [],
    };

    room["players"].push(ws);

    rooms.push(room);

    const data = `{"requestType":"setColor", "color":"white"}`;
    ws.send(data);
  }
};

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const jsonData = JSON.parse(data);

    if (jsonData.requestType == "joinRoom") {
      joinRoom(jsonData.roomId, ws);
    } else if (jsonData.requestType == "move") {
      const players = rooms[roomIndex(jsonData.roomId)]["players"];

      players.forEach((player) => {
        if (player != ws && player.readyState == WebSocket.OPEN) {
          player.send(JSON.stringify(JSON.parse(data)));
        }
      });
    }

    console.log(rooms);

    // wss.clients.forEach((client) => {
    //   if (client != ws && client.readyState == WebSocket.OPEN) {
    //     client.send(JSON.stringify(data));
    //   }
    // });
  });
});

server.listen(port, host, () => {
  console.log("the websocket server is listening to the port 6969");
});
