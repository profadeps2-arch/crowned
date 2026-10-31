import type { StyleContext } from "@/lib/outfits";

type Tweak = Partial<StyleContext> & { occasion?: string };
export type Option = { label: string; set?: Tweak };
export type Question = { id: string; ask: string; options: Option[] };
export type Group = {
  id: string;
  label: string;
  blurb: string;
  /** The engine occasion used unless an answer changes it. */
  occasion: string;
  questions: Question[];
};

export const GROUPS: Group[] = [
  {
    id: "work",
    label: "Work and interviews",
    blurb: "Office, meetings, interviews",
    occasion: "Office",
    questions: [
      {
        id: "what",
        ask: "What is it?",
        options: [
          { label: "A regular workday", set: { occasion: "Office" } },
          { label: "An interview", set: { occasion: "Interview" } },
          { label: "An important meeting", set: { occasion: "Office", dressUp: 1 } },
        ],
      },
      {
        id: "code",
        ask: "What is the dress code?",
        options: [
          { label: "Smart casual", set: { dressUp: -1 } },
          { label: "Full formal", set: { dressUp: 1 } },
          { label: "Not sure" },
        ],
      },
    ],
  },
  {
    id: "church",
    label: "Church",
    blurb: "Respectful and well kept",
    occasion: "Church",
    questions: [
      {
        id: "service",
        ask: "Which service?",
        options: [
          { label: "Sunday service", set: { occasion: "Church" } },
          { label: "Midweek service", set: { occasion: "Church", dressUp: -1 } },
          { label: "A wedding in church", set: { occasion: "White wedding" } },
        ],
      },
      {
        id: "wear",
        ask: "What will you wear?",
        options: [
          { label: "Native", set: { style: "native" } },
          { label: "Shirt and trousers", set: { style: "western" } },
          { label: "Surprise me" },
        ],
      },
    ],
  },
  {
    id: "mosque",
    label: "Mosque",
    blurb: "Jumat, Eid, naming ceremony",
    occasion: "Mosque",
    questions: [
      {
        id: "what",
        ask: "What is the occasion?",
        options: [
          { label: "Jumat prayers", set: { occasion: "Mosque" } },
          { label: "Eid", set: { occasion: "Mosque", dressUp: 1 } },
          { label: "A naming ceremony", set: { occasion: "Mosque", dressUp: 1 } },
        ],
      },
      {
        id: "feel",
        ask: "How should it feel?",
        options: [
          { label: "Simple", set: { dressUp: -1 } },
          { label: "Well dressed" },
          { label: "Grand", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "school",
    label: "School",
    blurb: "Lectures, presentations, campus",
    occasion: "School",
    questions: [
      {
        id: "what",
        ask: "What is it?",
        options: [
          { label: "A normal day of lectures", set: { occasion: "School" } },
          { label: "A presentation or defence", set: { occasion: "School", dressUp: 2 } },
          { label: "An exam or tutorial", set: { occasion: "School", dressUp: -1 } },
        ],
      },
      {
        id: "feel",
        ask: "How should it feel?",
        options: [
          { label: "Relaxed", set: { dressUp: -1 } },
          { label: "Neat" },
          { label: "Sharp", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "gym",
    label: "Gym",
    blurb: "Workout, football, a run",
    occasion: "Gym",
    questions: [
      {
        id: "what",
        ask: "What are you doing?",
        options: [
          { label: "Gym session", set: { occasion: "Gym" } },
          { label: "Football or sports", set: { occasion: "Gym" } },
          { label: "A run or a walk", set: { occasion: "Gym" } },
        ],
      },
      {
        id: "after",
        ask: "Where after?",
        options: [
          { label: "Straight home" },
          { label: "Heading out after", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "friday",
    label: "Friday wear",
    blurb: "Native Friday, casual Friday",
    occasion: "Friday wear",
    questions: [
      {
        id: "what",
        ask: "What kind of Friday?",
        options: [
          { label: "Native Friday", set: { occasion: "Friday wear", style: "native" } },
          { label: "Casual Friday", set: { occasion: "Friday wear", dressUp: -1 } },
        ],
      },
      {
        id: "feel",
        ask: "How should it feel?",
        options: [
          { label: "Neat" },
          { label: "Sharp", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "owambe",
    label: "Owambe / Traditional",
    blurb: "Native sets and aso ebi",
    occasion: "Owambe",
    questions: [
      {
        id: "kind",
        ask: "What kind of event?",
        options: [
          { label: "Owambe", set: { occasion: "Owambe" } },
          { label: "Aso ebi", set: { occasion: "Aso ebi" } },
          { label: "Traditional wedding", set: { occasion: "Traditional wedding" } },
        ],
      },
      {
        id: "grand",
        ask: "How grand should it be?",
        options: [
          { label: "Understated", set: { dressUp: -1 } },
          { label: "Well dressed" },
          { label: "Grand", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "funeral",
    label: "Burial or funeral",
    blurb: "Respectful and calm",
    occasion: "Funeral",
    questions: [
      {
        id: "what",
        ask: "What is it?",
        options: [
          { label: "Burial or funeral service", set: { occasion: "Funeral" } },
          { label: "Wake keeping", set: { occasion: "Funeral", dressUp: -1 } },
          { label: "Condolence visit", set: { occasion: "Funeral", dressUp: -1 } },
        ],
      },
      {
        id: "wear",
        ask: "What will you wear?",
        options: [
          { label: "Native", set: { style: "native" } },
          { label: "Shirt and trousers", set: { style: "western" } },
          { label: "Surprise me" },
        ],
      },
    ],
  },
  {
    id: "date",
    label: "Date night",
    blurb: "Confident, not trying hard",
    occasion: "Date night",
    questions: [
      {
        id: "where",
        ask: "Where are you going?",
        options: [
          { label: "Dinner", set: { dressUp: 1 } },
          { label: "Drinks or a lounge" },
          { label: "A casual outing", set: { dressUp: -1 } },
        ],
      },
      {
        id: "impression",
        ask: "What impression?",
        options: [
          { label: "Easy and confident" },
          { label: "Polished", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "everyday",
    label: "Everyday and hangouts",
    blurb: "Errands, friends, travel",
    occasion: "Everyday",
    questions: [
      {
        id: "where",
        ask: "Where to?",
        options: [
          { label: "Errands and around town", set: { occasion: "Everyday" } },
          { label: "Hanging out", set: { occasion: "Hangout" } },
          { label: "Travelling", set: { occasion: "Travel" } },
        ],
      },
      {
        id: "feel",
        ask: "How should it feel?",
        options: [
          { label: "Relaxed", set: { dressUp: -1 } },
          { label: "Neat" },
          { label: "Sharp", set: { dressUp: 1 } },
        ],
      },
    ],
  },
  {
    id: "street",
    label: "Streetwear",
    blurb: "Relaxed, current",
    occasion: "Streetwear",
    questions: [
      {
        id: "when",
        ask: "Day or night?",
        options: [
          { label: "Day out" },
          { label: "Night out", set: { dressUp: 1 } },
        ],
      },
      {
        id: "layer",
        ask: "Any layering?",
        options: [
          { label: "Keep it light", set: { outer: "no" } },
          { label: "Add a layer", set: { outer: "yes" } },
          { label: "Your call" },
        ],
      },
    ],
  },
  {
    id: "special",
    label: "Special event",
    blurb: "Weddings, graduations, nights that matter",
    occasion: "White wedding",
    questions: [
      {
        id: "event",
        ask: "What is the occasion?",
        options: [
          { label: "White wedding", set: { occasion: "White wedding" } },
          { label: "Graduation", set: { occasion: "White wedding", dressUp: -1 } },
          { label: "Birthday", set: { occasion: "Date night", dressUp: 1 } },
          { label: "Corporate event", set: { occasion: "Office", dressUp: 1 } },
        ],
      },
      {
        id: "wear",
        ask: "Native or suit?",
        options: [
          { label: "Native", set: { style: "native" } },
          { label: "Shirt and trousers", set: { style: "western" } },
          { label: "Surprise me" },
        ],
      },
    ],
  },
];

/** Turns the chosen answers into an engine occasion plus style context. answers[questionId] = option index. */
export function resolve(group: Group, answers: Record<string, number>) {
  let occasion = group.occasion;
  const ctx: StyleContext = {};
  let dress = 0;

  for (const q of group.questions) {
    const i = answers[q.id];
    const set = i === undefined ? undefined : q.options[i]?.set;
    if (!set) continue;
    if (set.occasion) occasion = set.occasion;
    if (set.dressUp) dress += set.dressUp;
    if (set.style) ctx.style = set.style;
    if (set.outer) ctx.outer = set.outer;
  }
  ctx.dressUp = Math.max(-2, Math.min(2, dress));
  return { occasion, ctx };
}

/** Which Customize group fits an engine occasion, so Today can open the right questions. */
export function groupFor(occasion: string): string {
  switch (occasion) {
    case "Church": return "church";
    case "Office":
    case "Interview": return "work";
    case "School": return "school";
    case "Gym": return "gym";
    case "Mosque": return "mosque";
    case "Funeral": return "funeral";
    case "Friday wear": return "friday";
    case "Owambe":
    case "Aso ebi":
    case "Traditional wedding": return "owambe";
    case "Date night": return "date";
    case "White wedding": return "special";
    case "Streetwear": return "street";
    default: return "everyday";
  }
}
