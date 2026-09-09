import type { GroupType, PostType } from "@/lib/types/leadgen";

// Deterministic template bank -- no external AI call needed. "natural" copy avoids investor
// jargon (cash buyer, ARV, equity, fast close) for general/community groups; "investor" copy
// is only used when the group itself is investor-oriented, per spec.
const TEMPLATES: Record<PostType, { natural: string[]; investor: string[] }> = {
  seasoning_community: {
    natural: [
      "Hey neighbors -- new to the area and always happy to meet people and hear what's going on locally. If anyone's thinking about selling a house or has a property sitting vacant, I'd love to chat, no pressure at all.",
      "Been enjoying getting to know this community. Quick one: if you or someone you know has an older or vacant property they've been meaning to deal with, feel free to send me a message -- happy to just talk it through.",
    ],
    investor: [
      "Local investor here, active in this area. Always looking to connect with folks who might have a property to sell -- happy to talk through options, no obligation.",
    ],
  },
  looking_for_property: {
    natural: [
      "Looking for a house in this area -- doesn't need to be pretty, could use some work. If you know of anything coming up (or someone ready to sell), I'd really appreciate a message.",
      "Trying to find a property around here, ideally something that needs a little love. If you know an owner who's been thinking about selling, please point them my way!",
    ],
    investor: [
      "Actively buying in this market. Looking for single-family or small multifamily, any condition. Cash buyer, can close fast if the numbers work -- send details if you have something.",
    ],
  },
  fixer_upper: {
    natural: [
      "Anyone have a property around here that needs work and the owner just doesn't want to deal with fixing it up? I don't mind a project -- happy to take a look and make a fair offer.",
      "I like taking on houses that need some TLC. If you know of one sitting empty or getting rough around the edges, I'd love an introduction.",
    ],
    investor: [
      "Buying fixer-uppers in this area -- any condition, no repairs needed on your end. I cover closing costs. Message me the address and I'll take a look.",
    ],
  },
  small_multifamily: {
    natural: [
      "Looking to buy a duplex, triplex, or small apartment building around here. If you or someone you know owns one and has thought about selling, I'd love to talk.",
    ],
    investor: [
      "Actively acquiring 2-4 unit properties in this market. Cash buyer, flexible on condition and timeline. Reach out if you have something or know an owner considering a sale.",
    ],
  },
  rental_property: {
    natural: [
      "If you own a rental around here and are ready to be done with it -- tenants, maintenance calls, all of it -- I'd be happy to talk about buying it as-is.",
    ],
    investor: [
      "Buying rental properties as-is, tenants in place or vacant, doesn't matter. Cash buyer, quick close available if that's what works best for you.",
    ],
  },
  tired_landlord: {
    natural: [
      "Landlording can get old fast. If you're done dealing with a property -- bad tenants, repairs piling up, just ready to be finished -- send me a message. No judgment, just a conversation.",
      "If being a landlord has stopped being worth it for you, I'd be glad to talk about taking the property off your hands, as-is.",
    ],
    investor: [
      "Tired of managing a rental? I buy properties as-is, tenants or no tenants, and can close on your timeline. Cash buyer -- no repairs, no showings, no hassle.",
    ],
  },
  vacation_rental: {
    natural: [
      "If you own a short-term/vacation rental around here and have been thinking it's more work than it's worth, I'd love to hear about it -- happy to make a fair offer as-is.",
    ],
    investor: [
      "Looking to buy short-term rental properties in this area. Cash buyer, as-is condition fine, can move quickly.",
    ],
  },
  general_seller: {
    natural: [
      "If you or someone you know is thinking about selling a house in this area -- any condition, any situation -- I'd be glad to have a no-pressure conversation about it.",
      "Simple ask: anyone here considering selling a property? I buy houses in any condition and keep things straightforward and honest.",
    ],
    investor: [
      "Cash buyer looking for houses to purchase in this market, any condition. Fair offers, fast closings when needed. Send me the details.",
    ],
  },
  referral: {
    natural: [
      "Does anyone know someone who's mentioned wanting to sell a house but hasn't gotten around to it yet? I'd really appreciate an introduction -- happy to make it easy on them.",
      "Long shot, but does anyone know a homeowner who inherited a property, moved away, or just has a house sitting empty? I'd love a referral.",
    ],
    investor: [
      "If you know anyone with a property they're thinking about selling, I'd appreciate the referral -- I'm a local cash buyer and can make the process simple for them.",
    ],
  },
};

function styleForGroup(groupType: GroupType): "natural" | "investor" {
  return groupType === "investor" ? "investor" : "natural";
}

export interface GeneratePostOptions {
  postType: PostType;
  groupType: GroupType;
  marketName?: string;
  /** Copy already posted in this group, most recent first -- used to avoid repeats. */
  previousCopies?: string[];
}

/**
 * Picks a template variant that hasn't been used in this group yet (rotation, per spec).
 * If every variant for this post type/style has been used, falls back to the least-recently
 * used one rather than looping back to the exact last post.
 */
export function generatePostCopy(options: GeneratePostOptions): string {
  const style = styleForGroup(options.groupType);
  const bank = TEMPLATES[options.postType][style];
  const previous = options.previousCopies ?? [];

  const unused = bank.filter((variant) => !previous.includes(variant));
  const chosen = unused[0] ?? bank[(previous.length) % bank.length] ?? bank[0]!;

  if (options.marketName) {
    return chosen.replace(/this area|this market|around here/gi, options.marketName);
  }
  return chosen;
}

export function availablePostTypes(): PostType[] {
  return Object.keys(TEMPLATES) as PostType[];
}
