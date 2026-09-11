const MODULE_ID = "a-spark-in-fate-core";
const STATE_SETTING = "state";
const PERM_MEDIA_SETTING = "permMedia";
const PERM_INSPIRATION_ANY_MEDIA_SETTING = "permInspirationAnyMedia";
const PERM_FACTS_SETTING = "permFacts";
const PERM_SPARKS_SETTING = "permSparks";
const PERM_FACES_SETTING = "permFaces";
const PERM_PLACES_SETTING = "permPlaces";
const ENABLE_FACES_SETTING = "enableFaces";
const ENABLE_PLACES_SETTING = "enablePlaces";
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
    lastFactSetByUserId: null,
    lastQuestionByUserId: null
  };
}

export {
  MODULE_ID,
  STATE_SETTING,
  PERM_MEDIA_SETTING,
  PERM_INSPIRATION_ANY_MEDIA_SETTING,
  PERM_FACTS_SETTING,
  PERM_SPARKS_SETTING,
  PERM_FACES_SETTING,
  PERM_PLACES_SETTING,
  ENABLE_FACES_SETTING,
  ENABLE_PLACES_SETTING,
  DEFAULT_STATE_VERSION,
  getDefaultState
};
