const MODULE_ID = "a-spark-in-fate-core";
const STATE_SETTING = "state";
const DEFAULT_STATE_VERSION = 1;

function getDefaultState() {
  return {
    version: DEFAULT_STATE_VERSION,
    media: [],
    inspirations: [],
    genre: {
      text: "",
      worldAspectId: null
    },
    factQuestions: [],
    factAllowances: [],
    campaignTitle: {
      text: "",
      worldAspectId: null
    },
    sparks: [],
    issues: {
      legacy: { type: "legacy", sparkId: null, aspectText: "", worldAspectId: null },
      current: { type: "current", sparkId: null, aspectText: "", worldAspectId: null },
      impending: { type: "impending", sparkId: null, aspectText: "", worldAspectId: null }
    },
    faces: [],
    places: [],
    lastFactSetByUserId: null
  };
}

export { MODULE_ID, STATE_SETTING, DEFAULT_STATE_VERSION, getDefaultState };
