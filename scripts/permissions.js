import { isGM, getCurrentUserId } from "./utils/users.js";
import {
  MODULE_ID,
  PERM_MEDIA_SETTING,
  PERM_INSPIRATION_ANY_MEDIA_SETTING,
  PERM_FACTS_SETTING,
  PERM_SPARKS_SETTING,
  PERM_FACES_SETTING,
  PERM_PLACES_SETTING
} from "./constants.js";

function _meetsMinRole(settingKey) {
  const minRole = game.settings.get(MODULE_ID, settingKey) ?? CONST.USER_ROLES.GAMEMASTER;
  return game.user.role >= minRole;
}

export function canOpenDashboard() {
  return true;
}

export function canViewAllData() {
  return true;
}

export function canAddMedia(state) {
  if (!_meetsMinRole(PERM_MEDIA_SETTING)) return false;
  if (isGM()) return true;
  const userMedia = state.media.filter(m => m.createdByUserId === getCurrentUserId());
  return userMedia.length < 1;
}

export function canEditMedia(item) {
  return isGM();
}

export function canDeleteMedia(item) {
  return isGM();
}

export function canAddInspiration(media) {
  if (!_meetsMinRole(PERM_MEDIA_SETTING)) return false;
  if (isGM()) return true;
  const anyMediaAllowed = game.settings.get(MODULE_ID, PERM_INSPIRATION_ANY_MEDIA_SETTING);
  if (anyMediaAllowed) return true;
  return media?.createdByUserId === getCurrentUserId();
}

export function canEditInspiration(item) {
  return isGM();
}

export function canDeleteInspiration(item) {
  return isGM();
}

export function canEditGenre() {
  return isGM();
}

export function canCreateFactQuestion(state) {
  if (!_meetsMinRole(PERM_FACTS_SETTING)) return false;
  if (isGM()) return true;
  // Turn order: only the user who set the last fact may ask the next question,
  // and only if they haven't already asked the current question.
  return state.lastFactSetByUserId === getCurrentUserId()
    && state.lastQuestionByUserId !== getCurrentUserId();
}

export function canSetFact(allowance) {
  if (!_meetsMinRole(PERM_FACTS_SETTING)) return false;
  if (isGM()) return true;
  return allowance && allowance.remaining > 0;
}

export function canEditFact(item) {
  return isGM();
}

export function canDeleteFactQuestion(item) {
  return isGM();
}

export function canDeleteFact(item) {
  return isGM();
}

export function canEditFactAllowances() {
  return isGM();
}

export function canEditCampaignTitle() {
  return isGM();
}

export function canCreateSpark() {
  return _meetsMinRole(PERM_SPARKS_SETTING);
}

export function canEditSpark(item) {
  return isGM();
}

export function canDeleteSpark(item) {
  return isGM();
}

export function canEditIssues() {
  return isGM();
}

export function canCreateFace() {
  return _meetsMinRole(PERM_FACES_SETTING);
}

export function canEditFace(item) {
  return isGM() || item?.createdByUserId === getCurrentUserId();
}

export function canDeleteFace(item) {
  return isGM();
}

export function canCreatePlace() {
  return _meetsMinRole(PERM_PLACES_SETTING);
}

export function canEditPlace(item) {
  return isGM() || item?.createdByUserId === getCurrentUserId();
}

export function canDeletePlace(item) {
  return isGM();
}

export function canCreateWorldAspect() {
  return isGM();
}

export function canCreateActorFromFace() {
  return isGM();
}

export function canUpdateActorFromFace() {
  return isGM();
}

export function canOpenActor() {
  return true;
}
