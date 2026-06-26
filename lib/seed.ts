export const SEED_TEMPLATES: ReadonlyArray<{ name: string; imagePath: string }> = [
  { name: "Drake", imagePath: "/templates/drake.svg" },
  { name: "Distracted Boyfriend", imagePath: "/templates/distracted.svg" },
  { name: "This Is Fine", imagePath: "/templates/this-is-fine.svg" },
  { name: "Two Buttons", imagePath: "/templates/two-buttons.svg" },
  { name: "Change My Mind", imagePath: "/templates/change-my-mind.svg" },
];

// A handful of pre-tagged memes so the gallery, the tag filter, and the
// screenshots all have data the moment the app boots — no need to save one by
// hand first. Each references a template by name; the id is resolved at seed time.
export const SEED_MEMES: ReadonlyArray<{
  templateName: string;
  topText: string;
  bottomText: string;
  tags: string[];
}> = [
  {
    templateName: "Drake",
    topText: "Writing tests",
    bottomText: "Shipping on Friday",
    tags: ["dev", "ci"],
  },
  {
    templateName: "This Is Fine",
    topText: "Prod is down",
    bottomText: "This is fine",
    tags: ["dev", "ops"],
  },
  {
    templateName: "Two Buttons",
    topText: "Refactor",
    bottomText: "Rewrite from scratch",
    tags: ["dev"],
  },
  {
    templateName: "Change My Mind",
    topText: "Tabs beat spaces",
    bottomText: "Change my mind",
    tags: ["fun"],
  },
  {
    templateName: "Distracted Boyfriend",
    topText: "Me",
    bottomText: "Yet another JS framework",
    tags: ["dev", "fun"],
  },
];

export const SEED_CAPTIONS: ReadonlyArray<string> = [
  "When the tests finally pass",
  "Me explaining my code a week later",
  "Production on Friday afternoon",
  "When the bug fixes itself",
  "Works on my machine",
  "404: Motivation not found",
  "Ship it",
  "One does not simply deploy on Friday",
  "That moment you find the semicolon",
  "Commit now, think later",
  "Debugging at 3am",
  "When the docs are actually helpful",
  "Pushed to main by accident",
  "Legacy code has entered the chat",
  "The CI is green, miracles happen",
  "New framework, who dis",
  "Refactor or rewrite",
  "Stack Overflow saved me again",
  "It compiles, therefore it works",
  "Just one more feature",
];
