import { isGM, getCurrentUserId } from "./utils/users.js";

export function canOpenDashboard() {
  return true;
}

export function canViewAllData() {
  return true;
}

export function canAddMedia(state) {
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

export function canAddInspiration() {
  return true;
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

export function canCreateFactQuestion() {
  return isGM();
}

export function canSetFact(allowance) {
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
  return isGM();
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
  return isGM();
}

export function canEditFace(item) {
  return isGM();
}

export function canDeleteFace(item) {
  return isGM();
}

export function canCreatePlace() {
  return isGM();
}

export function canEditPlace(item) {
  return isGM();
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
