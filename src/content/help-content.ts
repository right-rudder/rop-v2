import type { Faq } from "@/lib/structured-data";

/**
 * Copy for /how-it-works. Plain strings only — the same objects are rendered
 * on the page, matched against the page's filter box, and (for the FAQs)
 * mirrored into FAQPage structured data, so every step and answer has to
 * stand on its own without markup.
 *
 * Everything here describes the site as it actually behaves today. When a
 * flow changes, this file changes with it — a help page that promises a
 * feature we do not have is worse than no help page. Notably: claims are
 * reviewed by hand with no automated verification, submitted schools are not
 * announced by email when they go live, reviews cannot be edited, owners
 * cannot reply to reviews or see submitted information requests on the site,
 * suggested corrections are reviewed by hand, and an owner is not told when
 * one is applied to their listing.
 */

export type HelpAudience = "students" | "owners";

export type HelpGuide = {
  /** Anchor id — other pages deep-link to these, so treat them as stable. */
  id: string;
  audience: HelpAudience;
  title: string;
  summary: string;
  /** Ordered how-to steps. */
  steps: string[];
  /** Caveats and limits worth knowing before starting. */
  notes?: string[];
  cta?: { label: string; href: string };
  /** Extra words the filter box should match, beyond the visible copy. */
  keywords?: string[];
};

export type HelpFaqGroup = {
  id: string;
  audience: HelpAudience | "everyone";
  title: string;
  description: string;
  faqs: Faq[];
};

export const SUPPORT_EMAIL = "info@rightruddermarketing.com";

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: "saved",
    audience: "students",
    title: "Save schools to a shortlist",
    summary:
      "The heart button keeps a shortlist on your account, so the schools you liked are still waiting the next time you sign in.",
    steps: [
      "Find a school worth keeping — from search results, a browse page, or the school's own listing.",
      "Tap the heart. On a listing it sits next to Request info and is labelled Save; on a school card it is the small heart in the corner.",
      "Log in if you have not already. The heart sends guests to the login page and brings you straight back to where you were.",
      "Open Saved in the site header to see the whole shortlist as a grid of school cards.",
      "Tap a filled heart anywhere — on the listing, on a card, or on the Saved page itself — to drop a school from the list.",
    ],
    notes: [
      "Saving needs an account. Because the shortlist lives on the account rather than the browser, it is the same list on your phone and your laptop.",
      "There is no limit on how many schools you can save.",
      "Your Saved page is private to you, and search engines are told not to index it.",
    ],
    cta: { label: "Browse schools to save", href: "/search" },
    keywords: [
      "favorite",
      "favourite",
      "shortlist",
      "heart",
      "bookmark",
      "wishlist",
      "watchlist",
      "list",
    ],
  },
  {
    id: "compare",
    audience: "students",
    title: "Compare schools side by side",
    summary:
      "Pick up to four schools and read their programs, fleet, ratings and contact details in a single table. No account needed.",
    steps: [
      "Tap the compare button — the small column icon beside the heart — on any school card or listing. It turns into a checkmark once that school is in.",
      "Add up to three more the same way. A tray along the bottom of the screen keeps count and lists what you have picked.",
      "Once you have at least two, choose Compare in the tray to open the table.",
      "Read down the rows: rating, FAA Part 61 or 141, every program and trainer aircraft any of the schools offers, fleet size, instructor count, website and phone.",
      "Use Remove above a column to drop one school, or Clear in the tray to start over.",
    ],
    notes: [
      "Four schools at a time. When the tray is full, remove one to make room for another.",
      "No account needed — the picks are kept in your browser, so they do not follow you to another device, and clearing your browsing data clears them.",
      "The comparison page's address carries your picks, so you can bookmark it or send the link to someone else.",
      "On a narrow screen the table scrolls sideways.",
    ],
    cta: { label: "Find schools to compare", href: "/search" },
    keywords: [
      "comparison",
      "side by side",
      "versus",
      "vs",
      "table",
      "tray",
      "columns",
      "shortlist",
    ],
  },
  {
    id: "request-info",
    audience: "students",
    title: "Request information from a flight school",
    summary:
      "Every listing has a request form that goes straight to the school. You do not need an account to use it.",
    steps: [
      "Open the school's listing and choose Request info at the top of the page, or scroll down to the Request information section.",
      "Enter your name and email. A phone number is optional, but it gives the school a faster way to reach you.",
      "Pick what you are interested in from the program dropdown — it only lists the programs that school actually offers.",
      "Write a short message. Your timeline, your weekly availability, whether you have flown before, and your questions about cost all help the school give you a useful answer.",
      "Send it. Your request goes to the school, and the school follows up with you directly.",
    ],
    notes: [
      "No account needed — this form is open to everyone.",
      "If you are signed in, your name, email and phone are filled in for you.",
      "Prefer to call? The school's phone number is on the same page.",
    ],
    cta: { label: "Find a school to contact", href: "/search" },
    keywords: [
      "contact",
      "inquiry",
      "enquiry",
      "lead",
      "get in touch",
      "discovery flight",
      "quote",
      "pricing",
      "tour",
    ],
  },
  {
    id: "write-review",
    audience: "students",
    title: "Write a review of a flight school",
    summary:
      "Reviews are written on the school's own listing page and publish the moment you submit them.",
    steps: [
      "Open the listing for the school you trained at and scroll to the Reviews section.",
      "Log in or create an account. Reviews are tied to a real account, so you will be asked to sign in when you submit.",
      "Rate the school from one to five stars in all six categories: overall, customer service, instructors, aircraft, availability and facilities.",
      "Write the review itself. Specifics help other students most — which programs you flew, how easy scheduling was, the condition and availability of the aircraft, and what training actually cost you.",
      "Submit. Your review appears on the listing immediately and counts toward the school's average rating.",
    ],
    notes: [
      "One review per school per account. Reviews cannot be edited — delete yours and write a new one if you want to change it.",
      "You can delete your own review at any time from the listing page.",
    ],
    keywords: ["rating", "stars", "feedback", "testimonial", "experience", "star"],
  },
  {
    id: "comments",
    audience: "students",
    title: "Comment on a review",
    summary:
      "Comments are replies to a review — the place to ask a reviewer a follow-up question or add context to what they wrote.",
    steps: [
      "Find the review you want to reply to on the school's listing page.",
      "Choose Leave a comment underneath that review.",
      "Log in if you have not already — commenting needs an account.",
      "Write your comment and post it. It appears under the review right away.",
    ],
    notes: [
      "Comments attach to a review, not to the listing itself. To share your own experience of a school, write a review instead.",
      "You can delete your own comments.",
    ],
    keywords: ["reply", "respond", "discussion", "thread", "question"],
  },
  {
    id: "suggest-edit",
    audience: "students",
    title: "Suggest a correction to a listing",
    summary:
      "Spotted a phone number that rings the wrong place, a dead website or an old address? Send us the right value and our team checks it before it goes live.",
    steps: [
      "Open the school's listing and choose Suggest an edit in the Contact & location box. Log in if you have not already — suggestions are tied to an account.",
      "Pick the field that is wrong: phone number, website, address, hours or key contacts. The form shows what the listing currently says.",
      "Type the correct value. For key contacts you can add, change or remove people in the same form the school itself uses.",
      "Choose a reason from the list — out of date, wrong, doesn't work, missing, moved, typo, or other — and add a line of detail. A source, such as the school's website or a call you made, speeds things up.",
      "Submit. Our team reviews it by hand. When it is decided you get a notification on the site and an email, and if it is approved the listing updates straight away.",
    ],
    notes: [
      "One suggestion per field at a time. While one is waiting, that field is greyed out in the form; the other fields stay open.",
      "If the value you enter matches what the listing already shows, the form tells you and nothing is sent.",
      "Every approved correction is counted on your public profile, so the people who keep the directory accurate get credit for it.",
      "If you manage the listing yourself, you will not see Suggest an edit — use Edit school instead.",
    ],
    cta: { label: "Find a listing to check", href: "/search" },
    keywords: [
      "wrong number",
      "wrong phone",
      "wrong address",
      "wrong website",
      "broken link",
      "outdated",
      "incorrect",
      "fix",
      "correct",
      "report",
      "error",
      "mistake",
      "update listing",
    ],
  },
  {
    id: "claim",
    audience: "owners",
    title: "Claim your flight school listing",
    summary:
      "If your school is already in the directory, claiming it hands you the keys so you can edit the listing yourself.",
    steps: [
      "Find your school's listing and choose Claim this listing at the top of the page. If you are not signed in you will be sent to log in first, then straight back to the claim form.",
      "Tell us your role at the school — Owner, Chief Flight Instructor and Director of Operations are all typical.",
      "Give a work email. An address on the school's own domain is the fastest way for us to verify you.",
      "Add anything else that helps us confirm you are connected to the school, then submit the claim.",
      "Our team reviews every claim by hand. When it is decided you get a notification on the site and an email, and once approved the Edit school button on the listing is yours.",
    ],
    notes: [
      "While a claim is waiting, the listing shows Claim pending review in place of the claim button.",
      "Notifications live behind Alerts, the bell in the site header.",
      "Once you manage a listing, a Flight school owner badge appears on your public profile.",
      `If someone else already manages your school's listing, email ${SUPPORT_EMAIL} and we will sort it out.`,
    ],
    cta: { label: "Search for your school", href: "/search" },
    keywords: [
      "ownership",
      "owner",
      "verify",
      "verification",
      "take over",
      "manage",
      "my school",
    ],
  },
  {
    id: "add-school",
    audience: "owners",
    title: "Add a flight school that is not listed yet",
    summary:
      "Not in the directory? Submit it, and after our review it goes live with you as its manager.",
    steps: [
      "Search the directory first to make sure the school is not already listed — if it is, claim it instead of adding a duplicate.",
      "Create an account or log in, then open Add a school.",
      "Fill in the basics: school name, a description of the training you offer, website and phone number.",
      "Add the location — the ICAO code of your primary airport, plus city and state.",
      "Set your training details: FAA Part 61 or Part 141, and every program you offer.",
      "Estimate your fleet size and instructor count, add your contacts, and submit for review.",
      "Our team checks the submission. Once it is approved the listing goes live and you are set as its manager automatically, with no separate claim needed.",
    ],
    notes: [
      "Listings are free.",
      "Check back on the site to see when your listing is live.",
      "Airport, city and state can only be changed by us after a listing is published, so double-check them before submitting.",
    ],
    cta: { label: "Add your school", href: "/schools/add" },
    keywords: [
      "submit",
      "new listing",
      "missing",
      "not listed",
      "register",
      "sign up school",
    ],
  },
  {
    id: "edit-listing",
    audience: "owners",
    title: "Edit a listing you manage",
    summary:
      "Once a listing is yours you can update it whenever you like, and the changes are live immediately.",
    steps: [
      "Sign in and open your school's listing.",
      "Choose Edit school at the top of the page.",
      "Update whatever has changed: name, description, website, phone, logo, FAA Part, programs offered, fleet size, instructor count and contacts.",
      "Save. Your changes are on the public listing straight away — there is no second review.",
    ],
    notes: [
      "Airport, city and state are locked in the editor so the directory's location data stays consistent. Email us if a listing is at the wrong airport and we will move it.",
      "Only the account that manages the listing, and our team, can open the editor.",
    ],
    keywords: [
      "update",
      "change",
      "logo",
      "photo",
      "manage listing",
      "fix",
      "correct",
      "outdated",
    ],
  },
];

export const HELP_FAQ_GROUPS: HelpFaqGroup[] = [
  {
    id: "faq-students",
    audience: "students",
    title: "For student pilots",
    description: "Finding, comparing and contacting flight schools.",
    faqs: [
      {
        q: "Is Flight School Finder free to use?",
        a: "Yes. Browsing the directory, searching, comparing schools and requesting information are all free, and creating an account costs nothing.",
      },
      {
        q: "Do I need an account to contact a flight school?",
        a: "No. The request information form on every listing is open to everyone. You only need an account to leave a review, comment on a review, save schools to your favorites, or suggest a correction to a listing.",
      },
      {
        q: "How do I find flight schools near me?",
        a: "Use the search page to filter by state, city, airport code, program, aircraft, FAA Part or rating, or to search within a radius of a location. You can also browse by state, city or airport, and the Near me page uses your location to find the closest schools.",
      },
      {
        q: "Can I compare flight schools side by side?",
        a: "Yes. Add up to four schools to the compare tray using the compare button on any listing or search result, then open the comparison to see their ratings, FAA Part, programs, trainer aircraft, fleet size, instructor count, website and phone in one table.",
      },
      {
        q: "How many schools can I compare at once?",
        a: "Four. When the tray is full the site tells you, and you can remove a school from the tray to make room for another one.",
      },
      {
        q: "Do I need an account to compare schools?",
        a: "No. Compare picks are kept in your own browser, so the feature works while signed out. The trade-off is that they stay on that one device. Saving schools does need an account, and that shortlist follows you everywhere.",
      },
      {
        q: "Why did my compare picks disappear?",
        a: "Compare picks live in your browser rather than on your account, so switching device or browser, clearing your browsing data, or using a private window will empty the tray. Save schools to your account instead if you want a shortlist that lasts.",
      },
      {
        q: "Can I share a comparison with someone else?",
        a: "Yes. The comparison page's web address includes the schools you picked, so copying the link out of your browser and sending it will show the same table to whoever opens it.",
      },
      {
        q: "Are the reviews real?",
        a: "Reviews can only be posted from a registered account, one per school per person, and they publish exactly as written — we do not edit them. Reviews that break the terms of service are removed when we find them or when someone reports them.",
      },
      {
        q: "What happens after I request information from a school?",
        a: "Your request is passed to that school and the school contacts you directly, usually by email or phone. Flight School Finder does not handle scheduling, quotes or enrollment — those conversations happen between you and the school.",
      },
      {
        q: "How do I save schools I am interested in?",
        a: "Tap the heart on any listing or school card. Saving needs an account, so the heart sends you to log in first if you are signed out. Everything you save is collected on the Saved page, reached from the site header.",
      },
      {
        q: "Is there a limit on how many schools I can save?",
        a: "No. Save as many as you like — the Saved page lists all of them.",
      },
      {
        q: "Can other people see the schools I saved?",
        a: "No. Your Saved page is visible only to you when you are signed in, and search engines are told not to index it.",
      },
      {
        q: "A listing has the wrong phone number, website or address. Can I fix it?",
        a: "Yes. Sign in, open the listing and choose Suggest an edit in the Contact & location box. Pick the field, enter the correct value, choose a reason and submit. Our team checks every suggestion by hand, and once it is approved the listing updates immediately.",
      },
      {
        q: "What happens after I suggest a correction?",
        a: "It goes to our team for review. You get a notification on the site and an email when it is decided. Approved corrections go live on the listing straight away, and each one is counted on your public profile.",
      },
      {
        q: "Which parts of a listing can I suggest changes to?",
        a: "The phone number, website, address, hours and key contacts. Anything else — the school's name, description, programs or location — is something to email us about instead.",
      },
      {
        q: "Do my saved schools follow me to another device?",
        a: "Yes. The shortlist is stored on your account rather than in the browser, so signing in anywhere shows the same saved schools. Compare picks work the other way round — those stay in the browser you made them in.",
      },
    ],
  },
  {
    id: "faq-owners",
    audience: "owners",
    title: "For flight school owners",
    description: "Claiming, adding and managing a listing.",
    faqs: [
      {
        q: "How do I get my flight school on Flight School Finder?",
        a: "Search the directory first. If your school is already listed, claim the listing from its page. If it is not listed, submit it from the Add a school page and it will be published after our team reviews it.",
      },
      {
        q: "Does it cost anything to list or claim a flight school?",
        a: "No. Listing a school, claiming it and keeping it up to date are all free.",
      },
      {
        q: "How long does it take for a claim to be approved?",
        a: "Every claim is reviewed by hand, so it is not instant. Submitting with a work email on your school's own domain is the fastest way for us to verify you. You will get a notification on the site and an email once the claim is decided.",
      },
      {
        q: "What if someone else has already claimed my school's listing?",
        a: `Email ${SUPPORT_EMAIL}, ideally from an address on your school's domain, and we will review who should be managing the listing.`,
      },
      {
        q: "Can I change my listing's airport, city or state?",
        a: `Not from the editor — location fields are locked so the directory's location data stays consistent. Email ${SUPPORT_EMAIL} with the correction and we will move the listing for you.`,
      },
      {
        q: "Can I reply to a review of my school?",
        a: `Not at the moment. There is no owner response feature on the site today. If a review breaks the terms of service, email ${SUPPORT_EMAIL} and we will take a look.`,
      },
      {
        q: "Where do information requests from students go?",
        a: "They are passed on to your school using the contact details on your listing, and students can also call the phone number shown on the page. There is no owner inbox on the site, so keep your phone number, email and contacts current.",
      },
      {
        q: "Someone suggested a change to my listing. What happens?",
        a: "Suggestions from members go to our team, not to you, and we check each one by hand before anything changes. If we apply one, your listing updates immediately; you are not sent a notice, so it is worth glancing at your listing now and then. You can change any of those details yourself at any time from Edit school.",
      },
      {
        q: "My listing's address or hours are wrong. How do I fix them?",
        a: `Address and hours are not in the editor yet. Email ${SUPPORT_EMAIL} with the correct details and we will update the listing for you.`,
      },
      {
        q: "Do I need an account to claim or add a school?",
        a: "Yes. Both are tied to your account so we know who manages the listing. Signing up takes an email address and a password.",
      },
    ],
  },
  {
    id: "faq-account",
    audience: "everyone",
    title: "Accounts and the site",
    description: "Signing up, signing in and managing what you have posted.",
    faqs: [
      {
        q: "How do I create an account?",
        a: "Sign up with your name, email address and a password of at least eight characters. We email you a confirmation link — open it to activate the account.",
      },
      {
        q: "I did not get the confirmation email.",
        a: `Check your spam folder first, since automated mail often lands there. If it still has not arrived, email ${SUPPORT_EMAIL} and we will help.`,
      },
      {
        q: "How do I reset my password?",
        a: "Use the forgot password link on the login page. We email you a reset link, and once you set a new password you are signed out everywhere and can log back in with it.",
      },
      {
        q: "Can I sign in with Google or Facebook?",
        a: "Not at the moment. Accounts use an email address and a password.",
      },
      {
        q: "How do I edit a review I already wrote?",
        a: "Reviews cannot be edited. Delete the review from the school's listing page, then write a new one in its place.",
      },
      {
        q: "How do I delete my account?",
        a: `Email ${SUPPORT_EMAIL} from the address on the account and we will remove it along with the reviews and comments attached to it.`,
      },
      {
        q: "What do flight school links look like?",
        a: "Every school has a permanent address built from its location, in the form /state/city/airport-code/school-name. That link always points to the same listing, so it is safe to bookmark or share.",
      },
      {
        q: "My question is not answered here.",
        a: `Email ${SUPPORT_EMAIL} and our team will get back to you.`,
      },
    ],
  },
];

/** Flat list backing the page's FAQPage structured data. */
export const ALL_HELP_FAQS: Faq[] = HELP_FAQ_GROUPS.flatMap((group) => group.faqs);
