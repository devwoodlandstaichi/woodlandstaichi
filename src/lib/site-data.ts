/**
 * Site-wide content that's stable enough to live in code, but kept in one
 * place for editability. When any of these become things the founder wants
 * to edit themselves, promote them to a Supabase table.
 */

export const HOLIDAY_CLOSURES = [
  { name: "New Year's Day", date: "January 1" },
  { name: "Memorial Day", date: "Last Monday of May" },
  { name: "Independence Day", date: "July 4" },
  { name: "Labor Day", date: "First Monday of September" },
  { name: "Veterans Day", date: "November 11" },
  { name: "Thanksgiving Week", date: "Last week of November" },
  { name: "Christmas Eve & Day", date: "December 24–25" },
] as const;

export const BEGINNER_COHORT_DATES = [
  {
    label: "February 2026",
    days: ["February 4", "February 5"],
    status: "past",
  },
  { label: "June 2026", days: ["June 3", "June 4"], status: "filling" },
  {
    label: "September / October 2026",
    days: ["September 30", "October 1"],
    status: "open",
  },
] as const;

export const CLASS_LEVELS = [
  {
    glyph: "始",
    label: "Beginners",
    duration: "4 months",
    description:
      "The foundation. We teach the Yang 8-step form — smooth, fluid movements that anchor every form that follows. Free of charge; you purchase a WTC shirt at registration. Lifetime membership upon completion of the curriculum.",
    requirements: [
      "Be ambulatory and able to stand for at least one hour",
      "Attend the first 4 consecutive sessions",
      "Wear soft, flat-soled shoes (no sneakers, no bare feet)",
      "Bring your own bottled water",
    ],
  },
  {
    glyph: "中",
    label: "Intermediate & Advanced",
    duration: "Ongoing",
    description:
      "After completing beginners, players continue into intermediate and advanced sessions. Forms include Yang 24, Fan 18, Yang 8 Advanced, Modified Long Form 108, and Traditional 108.",
    requirements: [
      "Open to graduates of the WTC beginner curriculum",
      "Experienced returning players welcome — subject to availability",
    ],
  },
  {
    glyph: "復",
    label: "Remedial",
    duration: "By invitation",
    description:
      "Friday morning remedial sessions for players who want focused review of the form. Talk to an instructor after your fourth class to discuss whether remedial is right for you.",
    requirements: ["Invitation only — speak to an instructor"],
  },
  {
    glyph: "玩",
    label: "Play-only",
    duration: "By invitation",
    description:
      "An advanced session reserved for play — no formal instruction. Open to invited senior players. Friday mornings, after the remedial hour.",
    requirements: ["Invitation only"],
  },
] as const;

export const REGISTRATION_STEPS = [
  {
    n: 1,
    title: "Pick a class",
    body: "Beginners classes open in February, June, and October each year. Pick the one whose schedule you can fully commit to.",
  },
  {
    n: 2,
    title: "Submit the form",
    body: "Tell us a little about you, your emergency contact, your physical limits, and your shirt size. Sign the participation waiver.",
  },
  {
    n: 3,
    title: "Pay the shirt fee",
    body: "Classes are free; the WTC shirt is required and is paid at registration via Zelle, Venmo, Apple Pay, or PayPal. You aren't enrolled until payment is received.",
  },
  {
    n: 4,
    title: "Show up",
    body: "Arrive on time, in soft-soled shoes, with bottled water. Leave the outside world at the door.",
  },
] as const;

export const COURTESIES = [
  "Arrive on time. If class has begun, please don't enter.",
  "Loose, comfortable clothing through week 4. WTC shirt and pants from week 5 onward.",
  "Soft, flat-soled shoes. No sneakers, no bare feet — socks are fine.",
  "No lotions or perfumes. Non-smokers only, or change clothes first.",
  "Silence mobile devices.",
  "Bring bottled drinking water.",
  "Stop conversation as you enter the dojo. Bow when entering and exiting.",
  "Notify us by text or email of an absence.",
  "Don't come to class if you can't stay for the full session.",
  "Help with teardown.",
  "Most importantly — leave the outside world at the door.",
] as const;

export const WAIVER_PARAGRAPHS = [
  "Prior to registering for this class, it is recommended that you consult your physician.",
  "In consideration of being allowed to participate in any program, activity, or event sponsored by, performed by, or in any way involving Woodlands Tai Chi and/or Sifu Sesco Saegusa (the “Program”), I — as Participant, or as parent or guardian of a minor Participant — and intending to be legally bound, do hereby acknowledge and agree to the following:",
  "I waive, discharge, and release any and all rights and claims for damages — whether based upon negligence or any other theory of law — which I, my child, or my heirs may have against Woodlands Tai Chi and/or Sifu Sesco Saegusa, their affiliates, agents, representatives, assigns, successors, and any officers, directors, shareholders, agents, or employees of or associated with the organization, the municipalities or counties in or through which the programs take place, or any other person, entity, or sponsor connected with the Program, for any and all injuries or damages I or my child may suffer while participating.",
  "I assume any and all risks resulting from my or my child's participation, and accept full personal responsibility for any resulting damage including injury, permanent disability, or death.",
  "I verify that I (or my child) am in good physical health and able to participate in and/or complete the Program.",
  "I agree to indemnify and hold Woodlands Tai Chi and Sifu Sesco Saegusa harmless from and against all liabilities for any injury arising out of or connected with participation in the Program.",
  "I have read and fully understood this waiver and release. I understand that by participating, I/we will have waived substantial rights. I have knowingly and voluntarily agreed to this waiver and release.",
] as const;

// Annual World Tai Chi Day events. Posters hosted on the legacy WordPress
// upload directory; CSP + next.config.ts permit `woodlandstaichi.com` image
// hosts. Migrate these into Supabase Storage when Phase 2 lands.
export const WTCD_EVENTS = [
  {
    year: 2026,
    date: "April 25, 2026",
    location: "North Shore Park, The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2026/04/WTCD_poster_2026_v4-Final-225x300-1.png",
    upcoming: true,
  },
  {
    year: 2025,
    date: "April 26, 2025",
    location: "The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2025/04/WTCD_poster_2025-1-768x1024.jpg",
  },
  {
    year: 2024,
    date: "April 27, 2024",
    location: "The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2024/04/flyer-wtcd-2024-scaled.jpg",
  },
  {
    year: 2023,
    date: "April 29, 2023",
    location: "The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2023/03/WTCD23-Postcard-copy-768x1140.jpg",
  },
  {
    year: 2022,
    date: "April 30, 2022",
    location: "The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2023/01/WTCD22-Poster6x9.webp",
  },
  {
    year: 2021,
    date: "April 24, 2021",
    location: "The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2023/01/WTCD21fly-front_red.webp",
  },
  {
    year: 2019,
    date: "April 27, 2019",
    location: "The Woodlands, TX",
    poster:
      "https://woodlandstaichi.com/wp-content/uploads/2023/01/Tai-Chi-Fly2019-postcard.webp",
  },
] as const;

export const STORE_ITEMS = [
  {
    slug: "shirt",
    name: "WTC Shirt",
    tagline: "The uniform",
    body: "Required for all members — worn to practice and at events. Pre-shrunk, moisture-wicking, odor-fighting performance fabric. The shirt represents the equality of every player.",
    sizes: [
      { size: "XS", length: 26, width: 18 },
      { size: "S", length: 28.5, width: 20 },
      { size: "M", length: 29.5, width: 21.5 },
      { size: "L", length: 30.5, width: 23 },
      { size: "XL", length: 31.5, width: 24.5 },
      { size: "2XL", length: 32.5, width: 26 },
      { size: "3XL", length: 33, width: 28 },
      { size: "4XL", length: 33.5, width: 30 },
    ],
    note: "Confirm your size — no exchanges.",
    priceRange: "Included with registration",
  },
  {
    slug: "jacket",
    name: "Sport-Wick Fleece Jacket",
    tagline: "For events",
    body: "8-ounce, 100% polyester moisture-wicking fleece. Cadet collar, set-in sleeves, slash pockets, self-fabric cuffs and hem. Embroidered Woodlands Tai Chi logo. Special order.",
    pricing: [
      { size: "XS · chest 32–34″", price: 66 },
      { size: "S · chest 35–37″", price: 67 },
      { size: "M · chest 38–39″", price: 69 },
      { size: "L · chest 39–41″", price: 72 },
      { size: "XL · chest 42–44″", price: 75 },
      { size: "2XL · chest 45–47″", price: 78 },
      { size: "3XL · chest 48–51″", price: 80 },
      { size: "4XL · chest 52–55″", price: 85 },
    ],
    priceRange: "$66 – $85",
  },
  {
    slug: "fan",
    name: "WTC Fan with Pouch",
    tagline: "Used in fan forms",
    body: "Branded fan and matching pouch — used in the Fan and Fan-18 forms.",
    priceRange: "$15",
  },
  {
    slug: "uniform",
    name: "Tang Suit",
    tagline: "Special-order event uniform",
    body: "Worn for performances and special events. Special order only — speak to an instructor.",
    priceRange: "Special order",
  },
  {
    slug: "shoes",
    name: "Recommended Shoes",
    tagline: "Reference",
    body: "We don't sell shoes, but we strongly recommend Feiyue (made specifically for Tai Chi, originating from Shanghai in the 1920s) or Fuego dance shoes. Look for: low ankle profile, no or minimal heel, no or limited traction.",
    priceRange: "",
    discount: {
      label: "Fuego — 10% off with code WOODLANDSTAICHI10",
      url: "https://fuegodance.com/discount/WOODLANDSTAICHI10",
    },
  },
] as const;

export const RESOURCE_LINKS = [
  {
    category: "Articles",
    items: [
      {
        title: "Harvard Health — The Health Benefits of Tai Chi",
        url: "https://www.health.harvard.edu/staying-healthy/the-health-benefits-of-tai-chi",
      },
      {
        title: "Time Magazine — Why Tai Chi is the Perfect Exercise",
        url: "http://content.time.com/time/magazine/article/0,9171,332063,00.html",
      },
      {
        title: "Tai Chi for Health Institute — What Can Tai Chi Do for You?",
        url: "https://taichiforhealthinstitute.org/what-can-tai-chi-do-for-you-2/",
      },
      {
        title: "Bottom Line Health — Tai Chi for Fall Prevention",
        url: "https://bottomlineinc.com/life/exercise-fitness/best-exercise-prevent-falls-tai-chi",
      },
      {
        title: "New York Times — Using Tai Chi to Build Strength",
        url: "https://www.nytimes.com/2018/09/10/well/move/using-tai-chi-to-build-strength.html",
      },
    ],
  },
  {
    category: "Watch & Read More",
    items: [
      {
        title: "Taiji Science Federation — Five Internal Energy",
        url: "https://www.youtube.com/watch?v=tlXLVlwiZYE",
      },
      {
        title: "Tai Chi Basics — How to Learn Qi Gong at Home",
        url: "https://taichibasics.com/the-best-way-to-learn-qi-gong-at-home/",
      },
      {
        title: "Neuroscience News — Memory, Fear & Breathing",
        url: "https://neurosciencenews.com/memory-fear-breathing-5699/",
      },
    ],
  },
  {
    category: "Community",
    items: [
      {
        title: "Woodlands Tai Chi — Facebook group",
        url: "https://www.facebook.com/groups/1461755900795097/",
      },
    ],
  },
] as const;

// Photos in public/photos that are appropriate for the gallery page.
// HEIC excluded (browser support varies).
export const GALLERY_PHOTOS = [
  {
    src: "/photos/WTCD2023-9.jpg",
    alt: "World Tai Chi Day 2023 — group practice",
    aspect: "landscape",
  },
  {
    src: "/photos/WTCD2023-26.jpg",
    alt: "World Tai Chi Day 2023 — group photo",
    aspect: "landscape",
  },
  {
    src: "/photos/WTCD2023-8.jpg",
    alt: "World Tai Chi Day 2023 — outdoor session",
    aspect: "landscape",
  },
  {
    src: "/photos/FloMKS-WTachiDay2019-10.jpg",
    alt: "Tai Chi Day 2019 — practice",
    aspect: "landscape",
  },
  {
    src: "/photos/DSC_7640-XL.jpg",
    alt: "Group practice",
    aspect: "landscape",
  },
  {
    src: "/photos/2025-04-26_09-59-53_098.jpeg",
    alt: "World Tai Chi Day 2025",
    aspect: "portrait",
  },
  {
    src: "/photos/2025-04-26_10-00-58_416.jpeg",
    alt: "World Tai Chi Day 2025 — practice",
    aspect: "portrait",
  },
  {
    src: "/photos/cf0234_00d752fa25d644689737dec821ab9430mv2.webp",
    alt: "Class group photo",
    aspect: "landscape",
  },
  {
    src: "/photos/cf0234_2c906e57203745bc81c0b15969df9d81mv2.webp",
    alt: "Class practice",
    aspect: "landscape",
  },
  {
    src: "/photos/cf0234_84874345e89645d582b6decf2d412ffamv2.webp",
    alt: "Class practice",
    aspect: "landscape",
  },
  {
    src: "/photos/cf0234_e3e8a13c3072448495aac212e22cb0b5mv2.webp",
    alt: "Class practice",
    aspect: "landscape",
  },
] as const;
