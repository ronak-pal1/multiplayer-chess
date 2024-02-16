const copyRoomId = () => {
  navigator.clipboard.writeText(document.getElementById("room-code").innerText);
};

const copyRoomURL = () => {
  navigator.clipboard.writeText(document.getElementById("room-link").href);
};

const expand = (id) => {
  document.getElementById("join-room-button").style.display = "none";
  document.getElementById("create-room-button").style.display = "none";

  if (id == "room-panel") {
    document.getElementById(id).style.display = "flex";
    document.getElementById("join-panel").style.display = "none";
  } else if (id == "join-panel") {
    document.getElementById(id).style.display = "flex";
    document.getElementById("room-panel").style.display = "none";
  }
};

const joinRoom = () => {};

const createRoom = () => {};
