import { getState, updateState } from "../state.js";
import { isGM, getCurrentUserId, getCurrentUserName, getAllUsers, getWorldUserCount } from "../utils/users.js";
import { generateId, timestamp } from "../utils/ids.js";
import * as Permissions from "../permissions.js";
import {
  createWorldAspect, deleteWorldAspect,
  createFateActor, updateFateActor, openActorSheet, getFateCoreSkills
} from "../fate-core-adapter.js";
import { MediaDialog } from "./media-dialog.js";
import { InspirationDialog } from "./inspiration-dialog.js";
import { QuestionDialog } from "./question-dialog.js";
import { FactDialog } from "./fact-dialog.js";
import { SparkDialog } from "./spark-dialog.js";
import { PlaceDialog } from "./place-dialog.js";
import { FaceDialog } from "./face-dialog.js";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog.js";

export class SparkDashboardApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "div",
    id: "spark-dashboard",
    classes: ["spark-dashboard-app"],
    window: {
      title: "a-spark-in-fate-core.DashboardTitle",
      icon: "fas fa-fire",
      resizable: true
    },
    position: {
      width: 1200,
      height: 800
    }
  };

  static PARTS = {
    dashboard: {
      template: "modules/a-spark-in-fate-core/templates/dashboard.hbs"
    }
  };

  constructor(options = {}) {
    super(options);
    this.activeTab = options.tab || "media";
    this._skillsCache = null;
    this._templateWarned = false;
  }

  get title() {
    return game.i18n.localize("a-spark-in-fate-core.DashboardTitle");
  }

  // ─── Context preparation ───

  async _prepareContext(options) {
    const state = getState();
    const gm = isGM();
    const currentUserId = getCurrentUserId();
    const userCount = getWorldUserCount();

    // Ensure allowances exist for all users
    const allowancesMap = new Map((state.factAllowances || []).map(a => [a.userId, a]));
    for (const user of getAllUsers()) {
      if (!allowancesMap.has(user.id)) {
        allowancesMap.set(user.id, { userId: user.id, remaining: 2 });
      }
    }

    // Active fact-setter: last person who set a fact, or GM initially
    let activeFactUserId = state.lastFactSetByUserId;
    if (!activeFactUserId) {
      const gmUser = getAllUsers().find(u => u.isGM);
      activeFactUserId = gmUser?.id || currentUserId;
    }

    const allowances = Array.from(allowancesMap.values()).map(a => {
      const user = game.users.get(a.userId);
      return {
        ...a,
        userName: user?.name || a.userId,
        isActive: a.userId === activeFactUserId
      };
    });

    // Media & inspirations helpers
    const inspirationsByMedia = {};
    for (const m of state.media) inspirationsByMedia[m.id] = [];
    for (const i of state.inspirations) {
      if (inspirationsByMedia[i.mediaId]) inspirationsByMedia[i.mediaId].push(i);
    }

    const userNamesMap = {};
    for (const u of game.users) userNamesMap[u.id] = u.name;

    const playerMediaCount = state.media.filter(m => m.createdByUserId === currentUserId).length;
    const canPlayerAddMedia = !gm && playerMediaCount < 1;

    // Questions with author info
    const getUserName = (uid) => game.users.get(uid)?.name || uid;
    const questions = (state.factQuestions || []).map((q, idx) => {
      const fact = q.fact;
      const userAllowance = allowancesMap.get(currentUserId);
      const canSet = !fact && (gm || (userAllowance?.remaining > 0));
      const tooltip = q.inspirationIds
        .map(id => state.inspirations.find(i => i.id === id))
        .filter(Boolean)
        .map(i => `- ${i.text}`)
        .join("\n");
      return {
        ...q,
        order: idx + 1,
        fact,
        canSetFact: canSet,
        tooltip,
        creatorName: getUserName(q.createdByUserId),
        factCreatorName: fact ? getUserName(fact.createdByUserId) : null
      };
    });

    // Sparks
    const sparks = state.sparks.map((s, idx) => {
      const tooltip = s.factIds
        .map(id => {
          const fq = state.factQuestions.find(fq => fq.fact?.id === id);
          return fq ? fq.fact.text : "";
        })
        .filter(Boolean)
        .map(t => `- ${t}`)
        .join("\n");
      return { ...s, order: idx + 1, tooltip };
    });
    const sparksTarget = userCount * 2;
    const sparksCount = sparks.length;

    // Issues with per-issue spark options
    const issuesList = ["legacy", "current", "impending"].map(type => {
      const issue = state.issues[type];
      const spark = sparks.find(s => s.id === issue?.sparkId);
      const usedInOther = new Set();
      for (const t of ["legacy", "current", "impending"]) {
        if (t !== type && state.issues[t]?.sparkId) {
          usedInOther.add(state.issues[t].sparkId);
        }
      }
      const sparkOptions = sparks.map(s => ({
        id: s.id,
        text: s.text,
        disabled: usedInOther.has(s.id) && s.id !== issue?.sparkId,
        selected: s.id === issue?.sparkId
      }));
      return {
        type,
        sparkId: issue?.sparkId || null,
        sparkText: spark?.text || "",
        aspectText: issue?.aspectText || "",
        worldAspectName: issue?.worldAspectId || null,
        sparkOptions
      };
    });

    // Faces
    const issueFaces = ["legacy", "current", "impending"].map(type => {
      const issue = state.issues[type];
      const spark = sparks.find(s => s.id === issue?.sparkId);
      const facesForIssue = state.faces.filter(f => f.issueType === type);
      const supporter = facesForIssue.find(f => f.role === "supporter");
      const rejector = facesForIssue.find(f => f.role === "rejector");
      return {
        type,
        sparkText: spark?.text || issue?.aspectText || "",
        aspectText: issue?.aspectText || "",
        roles: [
          { role: "supporter", face: supporter || null },
          { role: "rejector", face: rejector || null }
        ]
      };
    });

    // Places
    const places = state.places.map(p => {
      const spark = sparks.find(s => s.id === p.sparkId);
      return { ...p, sparkText: spark?.text || "" };
    });

    // Facts for overview
    const facts = (state.factQuestions || []).filter(q => q.fact).map(q => {
      const questionText = q.text;
      const questionCreatorName = getUserName(q.createdByUserId);
      const factCreatorName = getUserName(q.fact.createdByUserId);
      return {
        questionText,
        questionCreatorName,
        fact: q.fact,
        factCreatorName
      };
    });

    // Overview
    const overviewIssues = ["legacy", "current", "impending"].map(type => {
      const issue = state.issues[type];
      const spark = sparks.find(s => s.id === issue?.sparkId);
      const facesForIssue = state.faces.filter(f => f.issueType === type);
      const place = state.places.find(pl => {
        const plSpark = sparks.find(s => s.id === pl.sparkId);
        return plSpark && plSpark.id === issue?.sparkId;
      });
      return {
        type,
        sparkText: spark?.text || "",
        aspectText: issue?.aspectText || "",
        supporter: facesForIssue.find(f => f.role === "supporter") || null,
        rejector: facesForIssue.find(f => f.role === "rejector") || null,
        place: place || null
      };
    });
    const issueSparkIds = new Set([state.issues.legacy?.sparkId, state.issues.current?.sparkId, state.issues.impending?.sparkId].filter(Boolean));
    const otherSparks = sparks.filter(s => !issueSparkIds.has(s.id)).map(s => {
      const place = state.places.find(p => p.sparkId === s.id);
      return { ...s, place: place || null };
    });

    // Tab statuses
    const tabStatus = {
      media: state.media.length > 0 && state.media.every(m => (inspirationsByMedia[m.id] || []).length > 0),
      genre: state.genre.text && questions.length > 0 && questions.every(q => q.fact),
      title: state.campaignTitle.text && sparksCount >= sparksTarget,
      issues: issuesList.every(i => i.sparkId && i.aspectText),
      faces: issueFaces.every(col => col.roles.every(r => r.face && r.face.name)),
      places: issueSparkIds.size > 0 && Array.from(issueSparkIds).every(id => state.places.some(p => {
        const sp = sparks.find(s => s.id === p.sparkId);
        return sp && sp.id === id;
      })),
      overview: true
    };

    return {
      activeTab: this.activeTab,
      canGM: gm,
      canPlayerAddMedia,
      canAddInspiration: true,
      media: state.media,
      inspirationsByMedia,
      genre: state.genre,
      campaignTitle: state.campaignTitle,
      questions,
      allowances,
      sparks,
      sparksCount,
      sparksTarget,
      issuesList,
      issueFaces,
      places,
      facts,
      overviewIssues,
      otherSparks,
      userNamesMap,
      tabStatus
    };
  }

  // ─── Render hooks ───

  _onRender(context, options) {
    // Check for empty default character template (GM only)
    if (!this._templateWarned && game.user.isGM) {
      this._templateWarned = true;
      const wd = typeof fcoConstants !== "undefined" ? fcoConstants.wd() : null;
      if (wd) {
        const aspectsEmpty = Object.keys(wd.system.aspects || {}).length === 0;
        const skillsEmpty = Object.keys(wd.system.skills || {}).length === 0;
        if (aspectsEmpty || skillsEmpty) {
          new foundry.applications.api.DialogV2({
            window: { title: game.i18n.localize("a-spark-in-fate-core.TemplateWarningTitle") },
            content: `<p>${game.i18n.localize("a-spark-in-fate-core.TemplateWarning")}</p>`,
            buttons: [{ action: "ok", label: game.i18n.localize("a-spark-in-fate-core.OK"), default: true }]
          }).render(true);
        }
      }
    }

    // Tab switching
    this.element.querySelectorAll(".spark-tab-link").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        const tab = event.currentTarget.dataset.tab;
        this.activeTab = tab;
        this.element.querySelectorAll(".spark-tab-link").forEach(l => l.classList.remove("active"));
        this.element.querySelectorAll(".spark-tab-content .tab").forEach(t => t.classList.remove("active"));
        event.currentTarget.classList.add("active");
        const content = this.element.querySelector(`.spark-tab-content .tab[data-tab="${tab}"]`);
        content?.classList.add("active");
      });
    });
    // Set initial active tab
    this.element.querySelectorAll(".spark-tab-link").forEach(l => l.classList.remove("active"));
    this.element.querySelectorAll(".spark-tab-content .tab").forEach(t => t.classList.remove("active"));
    this.element.querySelector(`.spark-tab-link[data-tab="${this.activeTab}"]`)?.classList.add("active");
    this.element.querySelector(`.spark-tab-content .tab[data-tab="${this.activeTab}"]`)?.classList.add("active");

    // ── Media ──
    this._onClick("[data-action='add-media']", async () => {
      if (!Permissions.canAddMedia(getState())) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.CannotAddMedia"));
        return;
      }
      new MediaDialog({
        users: getAllUsers(),
        onSave: async ({ title, userId, image, description }) => {
          await updateState(s => {
            s.media.push({
              id: generateId(),
              title,
              image,
              description,
              createdByUserId: userId || getCurrentUserId(),
              createdAt: timestamp()
            });
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='edit-media']", async event => {
      const id = event.currentTarget.dataset.id;
      const media = getState().media.find(m => m.id === id);
      if (!media || !Permissions.canEditMedia(media)) return;
      new MediaDialog({
        users: getAllUsers(),
        media,
        onSave: async ({ title, userId, image, description }) => {
          await updateState(s => {
            const m = s.media.find(x => x.id === id);
            if (m) { m.title = title; m.image = image; m.description = description; m.createdByUserId = userId || m.createdByUserId; m.updatedAt = timestamp(); }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-media']", async event => {
      const id = event.currentTarget.dataset.id;
      const media = getState().media.find(m => m.id === id);
      if (!media || !Permissions.canDeleteMedia(media)) return;
      const state = getState();
      const hasInspirations = state.inspirations.some(i => i.mediaId === id);
      const msg = hasInspirations
        ? game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteMediaWithInspirations")
        : game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteMedia");
      new ConfirmDeleteDialog({
        message: msg,
        onConfirm: async () => {
          await updateState(s => {
            s.media = s.media.filter(m => m.id !== id);
            s.inspirations = s.inspirations.filter(i => i.mediaId !== id);
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });

    // ── Inspirations ──
    this._onClick("[data-action='add-inspiration']", async event => {
      const mediaId = event.currentTarget.dataset.mediaId;
      if (!Permissions.canAddInspiration()) return;
      new InspirationDialog({
        onSave: async ({ text }) => {
          await updateState(s => {
            s.inspirations.push({
              id: generateId(),
              mediaId,
              text,
              createdByUserId: getCurrentUserId(),
              createdAt: timestamp()
            });
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-inspiration']", async event => {
      const id = event.currentTarget.dataset.id;
      const insp = getState().inspirations.find(i => i.id === id);
      if (!insp || !Permissions.canDeleteInspiration(insp)) return;
      new ConfirmDeleteDialog({
        message: game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteInspiration"),
        onConfirm: async () => {
          await updateState(s => {
            s.inspirations = s.inspirations.filter(i => i.id !== id);
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });

    // ── Genre ──
    const genreInput = this.element.querySelector("input[name='genre']");
    if (genreInput && Permissions.canEditGenre()) {
      genreInput.addEventListener("change", async () => {
        await updateState(s => { s.genre.text = genreInput.value.trim(); return s; });
      });
    }
    this._onClick("[data-action='make-genre-aspect']", async () => {
      if (!Permissions.canCreateWorldAspect()) return;
      const state = getState();
      if (!state.genre.text) { ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.GenreRequired")); return; }
      try {
        const result = await createWorldAspect(state.genre.text);
        await updateState(s => { s.genre.worldAspectId = result.name; return s; });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.AspectCreated"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });
    this._onClick("[data-action='delete-genre-aspect']", async () => {
      if (!Permissions.canCreateWorldAspect()) return;
      const state = getState();
      if (!state.genre.worldAspectId) return;
      try {
        await deleteWorldAspect(state.genre.worldAspectId);
        await updateState(s => { s.genre.worldAspectId = null; return s; });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.AspectDeleted"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });

    // ── Questions ──
    this._onClick("[data-action='add-question']", async () => {
      if (!Permissions.canCreateFactQuestion()) return;
      const state = getState();
      new QuestionDialog({
        inspirations: state.inspirations,
        onSave: async ({ inspirationIds, text }) => {
          await updateState(s => {
            const authorId = s.lastFactSetByUserId || getCurrentUserId();
            s.factQuestions.push({
              id: generateId(),
              order: s.factQuestions.length + 1,
              text,
              inspirationIds,
              createdByUserId: authorId,
              createdAt: timestamp()
            });
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='edit-question']", async event => {
      const id = event.currentTarget.dataset.id;
      const state = getState();
      const question = state.factQuestions.find(fq => fq.id === id);
      if (!question || !Permissions.canDeleteFactQuestion()) return;
      new QuestionDialog({
        inspirations: state.inspirations,
        question,
        onSave: async ({ inspirationIds, text }) => {
          await updateState(s => {
            const q = s.factQuestions.find(fq => fq.id === id);
            if (q) {
              q.text = text;
              q.inspirationIds = inspirationIds;
              q.updatedAt = timestamp();
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-question']", async event => {
      const id = event.currentTarget.dataset.id;
      if (!Permissions.canDeleteFactQuestion()) return;
      const state = getState();
      const q = state.factQuestions.find(fq => fq.id === id);
      const hasFact = !!q?.fact;
      new ConfirmDeleteDialog({
        message: hasFact ? game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteQuestionWithFact") : game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteQuestion"),
        onConfirm: async () => {
          await updateState(s => {
            s.factQuestions = s.factQuestions.filter(fq => fq.id !== id);
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });

    // ── Facts ──
    this._onClick("[data-action='set-fact']", async event => {
      const questionId = event.currentTarget.dataset.questionId;
      const state = getState();
      const q = state.factQuestions.find(fq => fq.id === questionId);
      if (!q || q.fact) return;

      // Build list of eligible users who can set this fact
      const gm = isGM();
      const eligibleUsers = state.factAllowances
        .filter(a => a.remaining > 0 || gm)
        .map(a => {
          const user = game.users.get(a.userId);
          return { id: a.userId, name: user?.name || a.userId, remaining: a.remaining };
        });

      if (eligibleUsers.length === 0) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.NoFactsRemaining"));
        return;
      }

      new FactDialog({
        users: eligibleUsers,
        onSave: async ({ text, userId }) => {
          const targetUserId = userId || getCurrentUserId();
          const targetAllowance = state.factAllowances.find(a => a.userId === targetUserId);
          if (!Permissions.canSetFact(targetAllowance)) {
            ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.NoFactsRemaining"));
            return;
          }
          await updateState(s => {
            const target = s.factQuestions.find(fq => fq.id === questionId);
            if (target) {
              target.fact = {
                id: generateId(),
                questionId,
                text,
                createdByUserId: targetUserId,
                createdAt: timestamp()
              };
            }
            const a = s.factAllowances.find(x => x.userId === targetUserId);
            if (a) a.remaining = Math.max(0, a.remaining - 1);
            s.lastFactSetByUserId = targetUserId;
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='edit-fact']", async event => {
      const id = event.currentTarget.dataset.id;
      const state = getState();
      let factQuestion = null;
      let fact = null;
      for (const q of state.factQuestions) {
        if (q.fact?.id === id) { factQuestion = q; fact = q.fact; break; }
      }
      if (!fact || !Permissions.canEditFact()) return;
      new FactDialog({
        users: [{ id: fact.createdByUserId, name: getUserName(fact.createdByUserId), remaining: 0 }],
        fact,
        onSave: async ({ text }) => {
          await updateState(s => {
            const target = s.factQuestions.find(q => q.id === factQuestion.id);
            if (target?.fact) {
              target.fact.text = text;
              target.fact.updatedAt = timestamp();
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-fact']", async event => {
      const id = event.currentTarget.dataset.id;
      if (!Permissions.canDeleteFact()) return;
      new ConfirmDeleteDialog({
        message: game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteFact"),
        onConfirm: async () => {
          await updateState(s => {
            for (const q of s.factQuestions) {
              if (q.fact?.id === id) { delete q.fact; break; }
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });

    // ── Allowances ──
    this.element.querySelectorAll("input.allowance-input").forEach(input => {
      if (!Permissions.canEditFactAllowances()) return;
      input.addEventListener("change", async () => {
        const userId = input.dataset.userId;
        const val = parseInt(input.value) || 0;
        await updateState(s => {
          const a = s.factAllowances.find(x => x.userId === userId);
          if (a) a.remaining = Math.max(0, val);
          return s;
        });
      });
    });

    // ── Campaign Title ──
    const titleInput = this.element.querySelector("input[name='campaignTitle']");
    if (titleInput && Permissions.canEditCampaignTitle()) {
      titleInput.addEventListener("change", async () => {
        await updateState(s => { s.campaignTitle.text = titleInput.value.trim(); return s; });
      });
    }
    this._onClick("[data-action='make-title-aspect']", async () => {
      if (!Permissions.canCreateWorldAspect()) return;
      const state = getState();
      if (!state.campaignTitle.text) { ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.TitleRequired")); return; }
      try {
        const result = await createWorldAspect(state.campaignTitle.text);
        await updateState(s => { s.campaignTitle.worldAspectId = result.name; return s; });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.AspectCreated"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });
    this._onClick("[data-action='delete-title-aspect']", async () => {
      if (!Permissions.canCreateWorldAspect()) return;
      const state = getState();
      if (!state.campaignTitle.worldAspectId) return;
      try {
        await deleteWorldAspect(state.campaignTitle.worldAspectId);
        await updateState(s => { s.campaignTitle.worldAspectId = null; return s; });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.AspectDeleted"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });

    // ── Sparks ──
    this._onClick("[data-action='add-spark']", async () => {
      if (!Permissions.canCreateSpark()) return;
      const state = getState();
      const facts = state.factQuestions.filter(q => q.fact).map(q => q.fact);
      new SparkDialog({
        facts,
        onSave: async ({ text, factIds }) => {
          await updateState(s => {
            s.sparks.push({
              id: generateId(),
              order: s.sparks.length + 1,
              text,
              factIds,
              createdByUserId: getCurrentUserId(),
              createdAt: timestamp()
            });
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='edit-spark']", async event => {
      const id = event.currentTarget.dataset.id;
      const state = getState();
      const spark = state.sparks.find(s => s.id === id);
      if (!spark || !Permissions.canEditSpark()) return;
      const facts = state.factQuestions.filter(q => q.fact).map(q => q.fact);
      new SparkDialog({
        facts,
        spark,
        onSave: async ({ text, factIds }) => {
          await updateState(s => {
            const sp = s.sparks.find(x => x.id === id);
            if (sp) {
              sp.text = text;
              sp.factIds = factIds;
              sp.updatedAt = timestamp();
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-spark']", async event => {
      const id = event.currentTarget.dataset.id;
      if (!Permissions.canDeleteSpark()) return;
      const state = getState();
      const usedInIssue = Object.values(state.issues).some(i => i.sparkId === id);
      new ConfirmDeleteDialog({
        message: usedInIssue ? game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteSparkInIssue") : game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteSpark"),
        onConfirm: async () => {
          await updateState(s => {
            s.sparks = s.sparks.filter(sp => sp.id !== id);
            for (const key of ["legacy", "current", "impending"]) {
              if (s.issues[key].sparkId === id) {
                s.issues[key].sparkId = null;
                s.issues[key].aspectText = "";
                s.issues[key].worldAspectId = null;
              }
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });

    // ── Issues ──
    this.element.querySelectorAll("select[name='issue-spark']").forEach(select => {
      if (!Permissions.canEditIssues()) return;
      select.addEventListener("change", async () => {
        const type = select.dataset.type;
        const sparkId = select.value || null;
        await updateState(s => {
          s.issues[type].sparkId = sparkId;
          return s;
        });
        this.render(false);
      });
    });
    this.element.querySelectorAll("input[name='issue-aspect']").forEach(input => {
      if (!Permissions.canEditIssues()) return;
      input.addEventListener("change", async () => {
        const type = input.dataset.type;
        await updateState(s => { s.issues[type].aspectText = input.value.trim(); return s; });
      });
    });
    this._onClick("[data-action='make-issue-aspect']", async event => {
      if (!Permissions.canCreateWorldAspect()) return;
      const type = event.currentTarget.dataset.type;
      const state = getState();
      const aspectText = state.issues[type]?.aspectText;
      if (!aspectText) { ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.AspectTextRequired")); return; }
      try {
        const result = await createWorldAspect(aspectText);
        await updateState(s => { s.issues[type].worldAspectId = result.name; return s; });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.AspectCreated"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });
    this._onClick("[data-action='delete-issue-aspect']", async event => {
      if (!Permissions.canCreateWorldAspect()) return;
      const type = event.currentTarget.dataset.type;
      const state = getState();
      if (!state.issues[type]?.worldAspectId) return;
      try {
        await deleteWorldAspect(state.issues[type].worldAspectId);
        await updateState(s => { s.issues[type].worldAspectId = null; return s; });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.AspectDeleted"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });

    // ── Faces ──
    this._onClick("[data-action='add-face']", async event => {
      if (!Permissions.canCreateFace()) return;
      const issueType = event.currentTarget.dataset.issue;
      const role = event.currentTarget.dataset.role;
      const skills = await this._getSkills();
      new FaceDialog({
        skills,
        onSave: async (data) => {
          await updateState(s => {
            s.faces.push({
              id: generateId(),
              issueType,
              role,
              ...data,
              createdAt: timestamp()
            });
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='edit-face']", async event => {
      const id = event.currentTarget.dataset.id;
      const state = getState();
      const face = state.faces.find(f => f.id === id);
      if (!face || !Permissions.canEditFace(face)) return;
      const skills = await this._getSkills();
      new FaceDialog({
        skills,
        face,
        onSave: async (data) => {
          await updateState(s => {
            const f = s.faces.find(x => x.id === id);
            if (f) {
              Object.assign(f, data, { updatedAt: timestamp() });
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-face']", async event => {
      const id = event.currentTarget.dataset.id;
      if (!Permissions.canDeleteFace()) return;
      new ConfirmDeleteDialog({
        message: game.i18n.localize("a-spark-in-fate-core.ConfirmDeleteFace"),
        onConfirm: async () => {
          await updateState(s => { s.faces = s.faces.filter(f => f.id !== id); return s; });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='create-actor']", async event => {
      const id = event.currentTarget.dataset.id;
      const face = getState().faces.find(f => f.id === id);
      if (!face || !Permissions.canCreateActorFromFace()) return;
      try {
        const actor = await createFateActor({
          name: face.name,
          img: face.portrait,
          description: face.description,
          mainSkill: face.mainSkill,
          aspect: face.aspect,
          trouble: face.trouble
        });
        await updateState(s => {
          const f = s.faces.find(x => x.id === id);
          if (f) f.actorId = actor.id;
          return s;
        });
        await actor.setFlag("a-spark-in-fate-core", "faceId", id);
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.ActorCreated"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });
    this._onClick("[data-action='update-actor']", async event => {
      const id = event.currentTarget.dataset.id;
      const face = getState().faces.find(f => f.id === id);
      if (!face || !face.actorId || !Permissions.canUpdateActorFromFace()) return;
      try {
        await updateFateActor(face.actorId, {
          name: face.name,
          img: face.portrait,
          description: face.description,
          mainSkill: face.mainSkill,
          aspect: face.aspect,
          trouble: face.trouble
        });
        ui.notifications.info(game.i18n.localize("a-spark-in-fate-core.ActorUpdated"));
        this.render(false);
      } catch (e) { ui.notifications.error(e.message); }
    });
    this._onClick("[data-action='open-actor']", async event => {
      const actorId = event.currentTarget.dataset.actorId;
      if (!actorId) return;
      await openActorSheet(actorId);
    });

    // ── Places ──
    this._onClick("[data-action='add-place']", async () => {
      if (!Permissions.canCreatePlace()) return;
      const state = getState();
      const usedSparkIds = new Set(state.places.map(p => p.sparkId));
      const availableSparks = state.sparks.filter(s => !usedSparkIds.has(s.id));
      if (availableSparks.length === 0) {
        ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.NoAvailableSparks"));
        return;
      }
      new PlaceDialog({
        sparks: availableSparks,
        onSave: async ({ sparkId, name, aspect, image }) => {
          await updateState(s => {
            s.places.push({
              id: generateId(),
              sparkId,
              name,
              aspect,
              image: image || undefined,
              createdByUserId: getCurrentUserId(),
              createdAt: timestamp()
            });
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='edit-place']", async event => {
      const id = event.currentTarget.dataset.id;
      const state = getState();
      const place = state.places.find(p => p.id === id);
      if (!place || !Permissions.canEditPlace(place)) return;
      const usedSparkIds = new Set(state.places.filter(p => p.id !== id).map(p => p.sparkId));
      const availableSparks = state.sparks.filter(s => !usedSparkIds.has(s.id) || s.id === place.sparkId);
      new PlaceDialog({
        sparks: availableSparks,
        place,
        onSave: async ({ sparkId, name, aspect, image }) => {
          await updateState(s => {
            const p = s.places.find(x => x.id === id);
            if (p) {
              Object.assign(p, { sparkId, name, aspect, image: image || undefined, updatedAt: timestamp() });
            }
            return s;
          });
          this.render(false);
        }
      }).render(true);
    });
    this._onClick("[data-action='delete-place']", async event => {
      const id = event.currentTarget.dataset.id;
      if (!Permissions.canDeletePlace()) return;
      new ConfirmDeleteDialog({
        message: game.i18n.localize("a-spark-in-fate-core.ConfirmDeletePlace"),
        onConfirm: async () => {
          await updateState(s => { s.places = s.places.filter(p => p.id !== id); return s; });
          this.render(false);
        }
      }).render(true);
    });

    // ── PDF Export ──
    this._onClick("[data-action='export-pdf']", async () => {
      await this._exportPdf();
    });
  }

  // ─── PDF Export ───

  async _exportPdf() {
    const context = await this._prepareContext();
    const html = this._buildPrintHtml(context);
    const win = window.open("", "_blank", "width=1000,height=750,scrollbars=yes,resizable=yes");
    if (!win) {
      ui.notifications.warn(game.i18n.localize("a-spark-in-fate-core.PDFPopupBlocked"));
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    await this._waitForImages(win.document);
    win.focus();
    setTimeout(() => win.print(), 100);
  }

  _buildPrintHtml(context) {
    const title = context.campaignTitle.text || game.i18n.localize("a-spark-in-fate-core.OverviewTitle");
    const genre = context.genre.text || "";
    const escapeHtml = (str) => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const faceHtml = (face) => {
      if (!face) return `<div class="empty">—</div>`;
      const img = face.portrait
        ? `<img src="${escapeHtml(face.portrait)}" alt="${escapeHtml(face.name)}">`
        : `<div class="placeholder">${game.i18n.localize("a-spark-in-fate-core.NoImage")}</div>`;
      return `<div class="print-face-card">
        <div class="print-portrait">${img}</div>
        <div class="print-face-name">${escapeHtml(face.name)}</div>
        <div class="print-field"><span class="print-label">${game.i18n.localize("a-spark-in-fate-core.FaceSkillLabel")}:</span> ${escapeHtml(face.mainSkill)}</div>
        <div class="print-field"><span class="print-label">${game.i18n.localize("a-spark-in-fate-core.FaceHighConceptLabel")}:</span> ${escapeHtml(face.aspect)}</div>
        <div class="print-field"><span class="print-label">${game.i18n.localize("a-spark-in-fate-core.FaceTroubleLabel")}:</span> ${escapeHtml(face.trouble)}</div>
        ${face.description ? `<div class="print-description">${escapeHtml(face.description)}</div>` : ""}
      </div>`;
    };

    const placeHtml = (place) => {
      if (!place) return `<div class="empty">—</div>`;
      const img = place.image
        ? `<img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}">`
        : `<div class="placeholder">${game.i18n.localize("a-spark-in-fate-core.NoImage")}</div>`;
      return `<div class="print-place-card">
        <div class="print-portrait">${img}</div>
        <div class="print-place-name">${escapeHtml(place.name)}</div>
        <div class="print-field"><span class="print-label">${game.i18n.localize("a-spark-in-fate-core.PlaceAspectLabel")}:</span> ${escapeHtml(place.aspect)}</div>
      </div>`;
    };

    const issuesHtml = context.overviewIssues.map(issue => {
      return `<div class="print-issue">
        <h2>${game.i18n.localize("a-spark-in-fate-core.IssueType" + issue.type)}</h2>
        <div class="print-issue-spark">${escapeHtml(issue.sparkText)}</div>
        <div class="print-field"><span class="print-label">${game.i18n.localize("a-spark-in-fate-core.IssueAspect")}:</span> ${escapeHtml(issue.aspectText)}</div>
        <h3>${game.i18n.localize("a-spark-in-fate-core.Supporter")}</h3>
        ${faceHtml(issue.supporter)}
        <h3>${game.i18n.localize("a-spark-in-fate-core.Rejector")}</h3>
        ${faceHtml(issue.rejector)}
        <h3>${game.i18n.localize("a-spark-in-fate-core.Place")}</h3>
        ${placeHtml(issue.place)}
      </div>`;
    }).join("");

    const otherSparksHtml = context.otherSparks.map(spark => {
      return `<div class="print-other-spark">
        <div class="print-spark-text">${escapeHtml(spark.text)}</div>
        ${spark.place ? placeHtml(spark.place) : ""}
      </div>`;
    }).join("");

    const factsHtml = context.facts.map(f => {
      return `<div class="print-fact">
        <div class="print-fact-question"><strong>${escapeHtml(f.questionText)}</strong></div>
        <div class="print-fact-answer">${escapeHtml(f.fact.text)}</div>
      </div>`;
    }).join("");

    const mediaHtml = context.media.map(m => {
      const inspirations = (context.inspirationsByMedia[m.id] || []).map(i => `<li>${escapeHtml(i.text)}</li>`).join("");
      const img = m.image
        ? `<img src="${escapeHtml(m.image)}" alt="${escapeHtml(m.title)}">`
        : `<div class="placeholder">${game.i18n.localize("a-spark-in-fate-core.NoImage")}</div>`;
      return `<div class="print-media-item">
        <div class="print-media-thumb">${img}</div>
        <div class="print-media-content">
          <strong>${escapeHtml(m.title)}</strong>
          ${inspirations ? `<ul>${inspirations}</ul>` : ""}
        </div>
      </div>`;
    }).join("");

    return `<!DOCTYPE html>
<html lang="${game.i18n.lang}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 1.5cm; }
    body { font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; background: #fff; }
    h1 { text-align: center; font-size: 22pt; margin: 0 0 6px; }
    .print-genre { text-align: center; font-size: 13pt; color: #555; margin-bottom: 20px; }
    h2 { font-size: 14pt; color: #4a3b2a; border-bottom: 1px solid #d4c5b0; padding-bottom: 4px; margin-top: 18px; }
    h3 { font-size: 12pt; color: #6b4c3a; margin: 12px 0 6px; }
    .print-issue { flex: 1 1 30%; min-width: 220px; max-width: 100%; break-inside: auto; }
    .print-issue-spark { background: #f9f7f2; border: 1px solid #d4c5b0; border-left: 3px solid #c9a66b; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
    .print-field { margin-bottom: 4px; }
    .print-label { font-weight: bold; color: #6b4c3a; }
    .print-face-card, .print-place-card { background: #fff; border: 1px solid #d4c5b0; border-radius: 6px; padding: 8px; margin-bottom: 8px; break-inside: avoid; }
    .print-face-name, .print-place-name { font-weight: bold; margin-bottom: 4px; }
    .print-portrait { width: 100px; height: 100px; border-radius: 4px; overflow: hidden; background: #000; margin-bottom: 8px; }
    .print-portrait img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .print-portrait .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e8e0d4; color: #444; }
    .print-description { margin-top: 6px; font-style: italic; font-size: 10pt; color: #555; background: #f9f7f2; border: 1px solid #d4c5b0; border-left: 3px solid #c9a66b; border-radius: 6px; padding: 6px 8px; }
    .print-other-spark { background: #f9f7f2; border: 1px solid #d4c5b0; border-radius: 6px; padding: 8px; margin-bottom: 8px; break-inside: avoid; }
    .print-spark-text { font-weight: bold; margin-bottom: 6px; }
    .print-fact { background: #fff; border: 1px solid #d4c5b0; border-left: 3px solid #c9a66b; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; }
    .print-fact-question { color: #555; font-size: 10pt; margin-bottom: 4px; }
    .print-fact-answer { font-weight: bold; }
    .print-media-item { display: flex; gap: 10px; align-items: flex-start; background: #fff; border: 1px solid #d4c5b0; border-radius: 6px; padding: 8px; margin-bottom: 8px; break-inside: avoid; }
    .print-media-thumb { width: 60px; height: 60px; border-radius: 4px; overflow: hidden; background: #000; flex: 0 0 auto; }
    .print-media-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .print-media-thumb .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e8e0d4; color: #444; }
    .print-media-content { flex: 1; }
    .print-media-content ul { margin: 4px 0 0 16px; }
    .empty { color: #777; font-style: italic; }
    .print-section { margin-bottom: 16px; }
    .print-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    h2 { break-after: avoid; }
    h3 { break-after: avoid; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${genre ? `<div class="print-genre">${escapeHtml(genre)}</div>` : ""}

  <div class="print-section">
    <h2>${game.i18n.localize("a-spark-in-fate-core.TabIssues")}</h2>
    <div class="print-grid">
      ${issuesHtml}
    </div>
  </div>

  ${context.otherSparks.length ? `
  <div class="print-section">
    <h2>${game.i18n.localize("a-spark-in-fate-core.OtherSparks")}</h2>
    ${otherSparksHtml}
  </div>
  ` : ""}

  ${context.facts.length ? `
  <div class="print-section">
    <h2>${game.i18n.localize("a-spark-in-fate-core.FactsSection")}</h2>
    ${factsHtml}
  </div>
  ` : ""}

  ${context.media.length ? `
  <div class="print-section">
    <h2>${game.i18n.localize("a-spark-in-fate-core.MediaAndInspirations")}</h2>
    ${mediaHtml}
  </div>
  ` : ""}
</body>
</html>`;
  }

  _waitForImages(doc) {
    const images = Array.from(doc.images);
    const promises = images.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    });
    return Promise.all(promises);
  }

  _onClick(selector, handler) {
    this.element.querySelectorAll(selector).forEach(el => {
      el.addEventListener("click", handler);
    });
  }

  async _getSkills() {
    if (!this._skillsCache) {
      this._skillsCache = getFateCoreSkills();
    }
    return this._skillsCache;
  }
}
