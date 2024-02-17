let boxSize = 0; // this is each pieces small box size
let selectedBoxId = null;
let destinationBoxId = null;
let steps = []; // to keep the allowed steps of a particular piece
let playerColor = "white"; // this is the color which you are playing
let turn = "white";

// audio's to play on move and capture of pieces
const moveSelfAudio = new Audio("./assets/audio/move-self.mp3");
const captureAudio = new Audio("./assets/audio/capture.mp3");

// making the websocket object with the appropriate url
let ws = new WebSocket("ws://localhost:6969");

// getting the room id
let roomId = new URLSearchParams(window.location.search).get("roomId");

console.log(roomId);
const convertSocketData = (data) => {
  const arr = JSON.parse(data).data;

  let msg = "";

  for (let i = 0; i < arr.length; i++) {
    msg += String.fromCharCode(arr[i]);
  }

  return JSON.parse(msg);
};

ws.onopen = () => {
  console.log("The connection is opened");
  const data = `{"requestType": "joinRoom", "roomId":"${roomId}"}`;
  ws.send(data);
};

ws.onmessage = ({ data }) => {
  const jsonData = JSON.parse(data);
  console.log(jsonData);
  if (jsonData.requestType == "move")
    move(jsonData.initial, jsonData.destination);
  else if (jsonData.requestType == "setColor") {
    playerColor = jsonData.color;
    console.log(playerColor);
    generateBoxs();
  } else if (jsonData.requestType == "chat-message") {
    const chatPreview = document.getElementById("chat-preview-field");

    chatPreview.innerHTML += `<div class="opp-message">${jsonData.text}</div>`;
  }
};

ws.onclose = () => {
  console.log("The connection is closed");
};

// window.addEventListener("beforeunload", (e) => {
//   ws.close();
// });

// pieces by name
const whitePieces = {
  pawn: "♙",
  rook: "♖",
  knight: "♘",
  bishop: "♗",
  queen: "♕",
  king: "♔",
};

const blackPieces = {
  pawn: "♟",
  rook: "♜",
  knight: "♞",
  bishop: "♝",
  queen: "♛",
  king: "♚",
};

// getting the board by id
const board = document.getElementById("board");

const whichColoredPiece = (piece) => {
  for (let p in whitePieces) {
    if (whitePieces[p] == piece) return "white";
  }

  for (let p in blackPieces) {
    if (blackPieces[p] == piece) return "black";
  }

  return "empty";
};

// This function is use to determine the board size depending on device's height and width
const calBoardSize = () => {
  const sizeW = innerWidth * 0.8;
  const sizeH = innerHeight * 0.8;

  if (sizeW <= sizeH) {
    board.style.width = sizeW + "px";
    board.style.height = sizeW + "px";
    boxSize = sizeW / 8;
  } else {
    board.style.width = sizeH + "px";
    board.style.height = sizeH + "px";
    boxSize = sizeH / 8;
  }
};

// This function is use to put the pieces in their appropriate places
const placePiece = (i, j) => {
  const selectPiece = (pieces, j) => {
    if (j == 0 || j == 7) return pieces["rook"];
    else if (j == 1 || j == 6) return pieces["knight"];
    else if (j == 2 || j == 5) return pieces["bishop"];
    else if (j == 3) return pieces["queen"];
    else if (j == 4) return pieces["king"];
  };

  if (i == 1) return blackPieces["pawn"];
  else if (i == 6) return whitePieces["pawn"];
  else if (i == 0) {
    return selectPiece(blackPieces, j);
  } else if (i == 7) {
    return selectPiece(whitePieces, j);
  }

  return "";
};

const move = (initial, destination) => {
  if (document.getElementById(destination).innerText == "")
    moveSelfAudio.play();
  else captureAudio.play();

  const piece = document.getElementById(initial).innerText;

  document.getElementById(destination).innerText = piece;
  document.getElementById(initial).innerText = "";
  document.getElementById(initial).style.opacity = "1";
};

const isMoveAllowedIn = (id) => {
  const [i, j] = getIJ(id);

  for (let index = 0; index < steps.length; index++) {
    if (steps[index][0] == i && steps[index][1] == j) return true;
  }

  return false;
};

const removeColoredSteps = () => {
  for (let index = 0; index < steps.length; index++) {
    const [i, j] = steps[index];

    document.getElementById("Hbox" + i + j).style.display = "none";
  }
};

// This function is use to perform some kind of action like selecting a piece, moving a piece etc
const performAction = (id) => {
  const currentPiece = document.getElementById(id).innerText;
  removeColoredSteps();
  console.log(id);

  if (document.getElementById(id).innerText == "" && selectedBoxId == null)
    return;

  if (selectedBoxId == null) {
    selectedBoxId = id;
    document.getElementById(id).style.opacity = "0.75";
    calculateSteps(id);
  } else if (
    selectedBoxId != null &&
    currentPiece != "" &&
    whichColoredPiece(currentPiece) === playerColor
  ) {
    document.getElementById(selectedBoxId).style.opacity = "1";
    selectedBoxId = id;
    document.getElementById(id).style.opacity = "0.75";
    calculateSteps(id);
  } else {
    if (isMoveAllowedIn(id)) {
      move(selectedBoxId, id);
      const data = `{"requestType":"move", "roomId":"${roomId}","initial": "${selectedBoxId}","destination":"${id}"}`;
      ws.send(data);

      // for again selecting new pieces
      selectedBoxId = null;
    }
  }
};

const getIJ = (id) => {
  const i = parseInt(id.charAt(3));
  const j = parseInt(id.charAt(4));

  return [i, j];
};

const colorSteps = () => {
  for (let index = 0; index < steps.length; index++) {
    document.getElementById(
      "Hbox" + steps[index][0] + steps[index][1]
    ).style.display = "block";
  }
};

const calBishop = (i, j) => {
  let tempI = i;
  let tempJ = j;

  while (tempI > 0 && tempJ > 0) {
    --tempI;
    --tempJ;

    if (
      whichColoredPiece(
        document.getElementById("box" + tempI + tempJ).innerText
      ) == playerColor
    )
      break;

    steps.push([tempI, tempJ]);

    if (document.getElementById("box" + tempI + tempJ).innerText != "") break;
  }

  tempI = i;
  tempJ = j;

  while (tempI > 0 && tempJ < 7) {
    --tempI;
    ++tempJ;

    if (
      whichColoredPiece(
        document.getElementById("box" + tempI + tempJ).innerText
      ) == playerColor
    )
      break;

    steps.push([tempI, tempJ]);

    if (document.getElementById("box" + tempI + tempJ).innerText != "") break;
  }

  tempI = i;
  tempJ = j;
  while (tempI < 7 && tempJ > 0) {
    ++tempI;
    --tempJ;

    if (
      whichColoredPiece(
        document.getElementById("box" + tempI + tempJ).innerText
      ) == playerColor
    )
      break;

    steps.push([tempI, tempJ]);

    if (document.getElementById("box" + tempI + tempJ).innerText != "") break;
  }

  tempI = i;
  tempJ = j;

  while (tempI < 7 && tempJ < 7) {
    ++tempI;
    ++tempJ;

    if (
      whichColoredPiece(
        document.getElementById("box" + tempI + tempJ).innerText
      ) == playerColor
    )
      break;

    steps.push([tempI, tempJ]);

    if (document.getElementById("box" + tempI + tempJ).innerText != "") break;
  }
};

const calRook = (i, j) => {
  // for the rooks up side
  for (let tempI = i - 1; tempI >= 0; tempI--) {
    if (
      whichColoredPiece(document.getElementById("box" + tempI + j).innerText) ==
      playerColor
    )
      break;
    steps.push([tempI, j]);
    if (document.getElementById("box" + tempI + j).innerText != "") break;
  }

  // for the rooks down side
  for (let tempI = i + 1; tempI <= 7; tempI++) {
    if (
      whichColoredPiece(document.getElementById("box" + tempI + j).innerText) ==
      playerColor
    )
      break;
    steps.push([tempI, j]);
    if (document.getElementById("box" + tempI + j).innerText != "") break;
  }

  // for the rooks left side
  for (let tempJ = j - 1; tempJ >= 0; tempJ--) {
    if (
      whichColoredPiece(document.getElementById("box" + i + tempJ).innerText) ==
      playerColor
    )
      break;
    steps.push([i, tempJ]);
    if (document.getElementById("box" + i + tempJ).innerText != "") break;
  }

  // for the rooks right side

  for (let tempJ = j + 1; tempJ <= 7; tempJ++) {
    if (
      whichColoredPiece(document.getElementById("box" + i + tempJ).innerText) ==
      playerColor
    )
      break;
    steps.push([i, tempJ]);
    if (document.getElementById("box" + i + tempJ).innerText != "") break;
  }
};

const calculateSteps = (id) => {
  const [i, j] = getIJ(id);
  steps = [];
  const piece = document.getElementById(id).innerText;

  if (piece == whitePieces["bishop"] || piece == blackPieces["bishop"]) {
    calBishop(i, j);
  } else if (piece == whitePieces["rook"] || piece == blackPieces["rook"]) {
    calRook(i, j);
  } else if (piece == whitePieces["knight"] || piece == blackPieces["knight"]) {
    if (
      i - 2 >= 0 &&
      j + 1 <= 7 &&
      whichColoredPiece(
        document.getElementById("box" + (i - 2) + (j + 1)).innerText
      ) != playerColor
    ) {
      steps.push([i - 2, j + 1]);
    }

    if (
      i - 2 >= 0 &&
      j - 1 >= 0 &&
      whichColoredPiece(
        document.getElementById("box" + (i - 2) + (j - 1)).innerText
      ) != playerColor
    ) {
      steps.push([i - 2, j - 1]);
    }

    if (
      i + 2 <= 7 &&
      j + 1 <= 7 &&
      whichColoredPiece(
        document.getElementById("box" + (i + 2) + (j + 1)).innerText
      ) != playerColor
    ) {
      steps.push([i + 2, j + 1]);
    }

    if (
      i + 2 <= 7 &&
      j - 1 >= 0 &&
      whichColoredPiece(
        document.getElementById("box" + (i + 2) + (j - 1)).innerText
      ) != playerColor
    ) {
      steps.push([i + 2, j - 1]);
    }

    if (
      i - 1 >= 0 &&
      j + 2 <= 7 &&
      whichColoredPiece(
        document.getElementById("box" + (i - 1) + (j + 2)).innerText
      ) != playerColor
    ) {
      steps.push([i - 1, j + 2]);
    }

    if (
      i + 1 <= 7 &&
      j + 2 <= 7 &&
      whichColoredPiece(
        document.getElementById("box" + (i + 1) + (j + 2)).innerText
      ) != playerColor
    ) {
      steps.push([i + 1, j + 2]);
    }

    if (
      i - 1 >= 0 &&
      j - 2 >= 0 &&
      whichColoredPiece(
        document.getElementById("box" + (i - 1) + (j - 2)).innerText
      ) != playerColor
    ) {
      steps.push([i - 1, j - 2]);
    }

    if (
      i + 1 <= 7 &&
      j - 2 >= 0 &&
      whichColoredPiece(
        document.getElementById("box" + (i + 1) + (j - 2)).innerText
      ) != playerColor
    ) {
      steps.push([i + 1, j - 2]);
    }
  } else if (piece == whitePieces["queen"] || piece == blackPieces["queen"]) {
    calBishop(i, j);
    calRook(i, j);
  } else if (piece == whitePieces["king"] || piece == blackPieces["king"]) {
    for (let tempI = i - 1; tempI <= i + 1; tempI++) {
      for (let tempJ = j - 1; tempJ <= j + 1; tempJ++) {
        if (!(tempI == i && tempJ == j)) {
          if (tempI >= 0 && tempI <= 7 && tempJ >= 0 && tempJ <= 7) {
            if (
              whichColoredPiece(
                document.getElementById("box" + tempI + tempJ).innerText
              ) == playerColor
            )
              continue;
            steps.push([tempI, tempJ]);
          }
        }
      }
    }
  } else if (piece == whitePieces["pawn"]) {
    if (i == 6) {
      steps.push([i - 1, j]);
      steps.push([i - 2, j]);
    } else {
      steps.push([i - 1, j]);
    }
  } else if (piece == blackPieces["pawn"]) {
    if (i == 1) {
      steps.push([i + 1, j]);
      steps.push([i + 2, j]);
    } else {
      steps.push([i + 1, j]);
    }
  }

  colorSteps();
};

const generateBoxs = () => {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let id = `box${i}${j}`;
      board.innerHTML += `
      <div>
      <div class="box" id="${id}" style="background-color: ${
        (i + j) % 2 == 0 ? "white" : "#b76f20"
      }; font-size:${boxSize * 0.7}px;" onclick="performAction(this.id)"> 
      ${placePiece(i, j)}
      </div>
      <div class="highlighted-circle" id="H${id}"></div>
      </div>`;
    }
  }

  if (playerColor == "black") {
    document.getElementById("board").style.transform = "rotate(180deg)";
    const elements = document.querySelectorAll("#board > div > .box");

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].innerHTML != "")
        elements[i].style.transform = "rotate(180deg)";
    }
  }
};

calBoardSize();
// generateBoxs();

/* Messagin system */
const sendChatMsg = () => {
  console.log("clicked");
  const chatBox = document.getElementById("chat-box-field");
  const chatPreview = document.getElementById("chat-preview-field");

  if (chatBox.value != "") {
    const data = `{"requestType":"chat-message","roomId":"${roomId}", "text":"${chatBox.value}"}`;
    ws.send(data);
  }

  chatPreview.innerHTML += `<div class="my-message">${chatBox.value}</div>`;

  chatBox.value = "";
};
