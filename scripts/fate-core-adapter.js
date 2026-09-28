/**
 * Adapter for integrating with Fate Core Official system.
 */

import { MODULE_ID, FACE_SKILL_RANK_SETTING } from "./constants.js";

const DEFAULT_FACE_SKILL_RANK = 5;

function getFaceSkillRank() {
  return game.settings.get(MODULE_ID, FACE_SKILL_RANK_SETTING) || DEFAULT_FACE_SKILL_RANK;
}

export function getFateCoreWorldDataItem() {
  if (typeof fcoConstants !== "undefined" && fcoConstants.wd) {
    try {
      return fcoConstants.wd();
    } catch (e) {
      console.error("[a-spark-in-fate-core] Failed to get Fate Core world data:", e);
      return null;
    }
  }
  return null;
}

export function getFateCoreSkills() {
  const wd = getFateCoreWorldDataItem();
  if (!wd || !wd.system) return [];
  const skills = wd.system.skills;
  if (!skills) return [];
  return Object.values(skills)
    .map(s => s.name)
    .filter(n => n)
    .sort((a, b) => a.localeCompare(b));
}

export async function createWorldAspect(name, description = "") {
  if (!name) throw new Error("Aspect name is required");
  const aspects = foundry.utils.duplicate(game.settings.get("fate-core-official", "gameAspects") || []);
  const existing = aspects.find(a => a.name === name);
  if (existing) {
    existing.notes = description || existing.notes || "";
  } else {
    aspects.push({ name, free_invokes: 0, notes: description || "" });
  }
  await game.settings.set("fate-core-official", "gameAspects", aspects);
  game.socket.emit("system.fate-core-official", { "render": true });
  return { name, index: aspects.length - 1 };
}

export async function deleteWorldAspect(name) {
  const aspects = foundry.utils.duplicate(game.settings.get("fate-core-official", "gameAspects") || []);
  const idx = aspects.findIndex(a => a.name === name);
  if (idx === -1) throw new Error("Aspect not found");
  aspects.splice(idx, 1);
  await game.settings.set("fate-core-official", "gameAspects", aspects);
  game.socket.emit("system.fate-core-official", { "render": true });
}

export async function openWorldAspect() {
  const fu = Object.values(foundry.applications.instances).find(app => app.constructor.name === "FateUtilities");
  if (fu) {
    fu.render(true);
    fu.bringToFront?.();
  } else {
    ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.OpenAspectsManually"));
  }
}

export async function createFateActor({ name, img, description, mainSkill, aspect, trouble }) {
  if (!name) throw new Error("Actor name is required");

  const defaultPerm = game.settings.get("fate-core-official", "default_actor_permission");
  const perm = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS[defaultPerm] || 0 };

  const actorData = {
    name,
    type: "fate-core-official",
    img: img || "icons/svg/mystery-man.svg",
    ownership: perm,
    // Link the prototype token so the created actor is a linked character token.
    prototypeToken: {
      actorLink: true,
      name,
      texture: { src: img || "icons/svg/mystery-man.svg" }
    },
    system: {
      details: {
        description: { value: description || "" }
      }
    }
  };

  const actor = await Actor.create(actorData);
  if (!actor) throw new Error("Failed to create actor");

  // Wait for default aspects to be initialised by the system
  await new Promise(resolve => setTimeout(resolve, 100));

  // Update High Concept and Trouble values instead of creating new aspects
  const aspects = actor.system.aspects || {};
  const hcKey = fcoConstants.gkfn(aspects, "High Concept");
  const troubleKey = fcoConstants.gkfn(aspects, "Trouble");

  const aspectUpdates = {};
  if (aspect && hcKey) {
    aspectUpdates[`system.aspects.${hcKey}.value`] = aspect;
  }
  if (trouble && troubleKey) {
    aspectUpdates[`system.aspects.${troubleKey}.value`] = trouble;
  }
  if (Object.keys(aspectUpdates).length > 0) {
    await actor.update(aspectUpdates);
  }

  // Add skill if provided
  if (mainSkill) {
    const wd = getFateCoreWorldDataItem();
    const worldSkills = wd?.system?.skills || {};
    const skillEntry = Object.values(worldSkills).find(s => s.name === mainSkill);
    const skillKey = fcoConstants.tob64(mainSkill);
    const skillData = skillEntry
      ? foundry.utils.duplicate(skillEntry)
      : { name: mainSkill, category: "", description: "", overcome: "", caa: "", attack: "", defend: "", pc: true, rank: 1 };
    skillData.rank = getFaceSkillRank();
    await actor.update({ [`system.skills.${skillKey}`]: skillData });
  }

  return actor;
}

export async function updateFateActor(actorId, { name, img, description, mainSkill, aspect, trouble }) {
  const actor = game.actors.get(actorId);
  if (!actor) throw new Error("Actor not found");

  const updates = {};
  if (name) updates.name = name;
  if (img) updates.img = img;
  if (description !== undefined) {
    updates["system.details.description.value"] = description;
  }

  await actor.update(updates);

  // Update High Concept and Trouble values
  const aspects = actor.system.aspects || {};
  const hcKey = fcoConstants.gkfn(aspects, "High Concept");
  const troubleKey = fcoConstants.gkfn(aspects, "Trouble");

  const aspectUpdates = {};
  if (aspect && hcKey) {
    aspectUpdates[`system.aspects.${hcKey}.value`] = aspect;
  }
  if (trouble && troubleKey) {
    aspectUpdates[`system.aspects.${troubleKey}.value`] = trouble;
  }
  if (Object.keys(aspectUpdates).length > 0) {
    await actor.update(aspectUpdates);
  }

  if (mainSkill) {
    const wd = getFateCoreWorldDataItem();
    const worldSkills = wd?.system?.skills || {};
    const skillEntry = Object.values(worldSkills).find(s => s.name === mainSkill);
    const skillKey = fcoConstants.tob64(mainSkill);
    const skillData = skillEntry
      ? foundry.utils.duplicate(skillEntry)
      : { name: mainSkill, category: "", description: "", overcome: "", caa: "", attack: "", defend: "", pc: true, rank: 1 };
    const existingSkill = fcoConstants.gbn(actor.system.skills, mainSkill);
    if (existingSkill) {
      skillData.rank = existingSkill.rank || getFaceSkillRank();
    } else {
      skillData.rank = getFaceSkillRank();
    }
    await actor.update({ [`system.skills.${skillKey}`]: skillData });
  }

  return actor;
}

export async function openActorSheet(actorId) {
  const actor = game.actors.get(actorId);
  if (!actor) {
    ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.ActorNotFound"));
    return;
  }
  actor.sheet.render(true);
}

export async function deleteFateActor(actorId) {
  const actor = game.actors.get(actorId);
  if (!actor) return false;
  await actor.delete();
  return true;
}
