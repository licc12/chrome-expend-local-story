function getStorage() {
  var obj = {};

  if (storage === undefined) {
    return;
  }

  var specialKeys = ["TOKEN"];

  for (var i in storage) {
    if (storage.hasOwnProperty(i) && i == "TOKEN") {
      obj[i] = storage.getItem(i);
    }
  }
  var item;
  for (var i in specialKeys) {
    item = storage.getItem(specialKeys[i]);
    if (item !== null) {
      obj[specialKeys[i]] = item;
    }
  }
  return obj;
}

var storage = msg.type === "Local" ? localStorage : sessionStorage;
var result;
var test;

switch (msg.what) {
  case "get":
    result = getStorage();
    break;

  case "set":
    if (msg.oldKey !== undefined) {
      storage.removeItem(msg.oldKey);
    }
    storage.setItem(msg.key, msg.value);
    break;
}

result;
