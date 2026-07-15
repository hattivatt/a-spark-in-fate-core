export function isGM() {
  return game.user.isGM;
}

export function isPlayer() {
  return !game.user.isGM;
}

export function getCurrentUserId() {
  return game.user.id;
}

export function getCurrentUserName() {
  return game.user.name;
}

export function getAllUsers() {
  return Array.from(game.users.values());
}

export function getWorldUserCount() {
  return getAllUsers().length;
}
