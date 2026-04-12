import { createDb } from "@aivo/db";
import { avatarItems, quests } from "@aivo/db";

const db = createDb(process.env.DATABASE_URL!);

const AVATAR_ITEMS = [
  { name: "Explorer Hat", category: "accessories", rarity: "common", coinPrice: 50, gemPrice: 0, imageUrl: "/avatars/explorer-hat.png", isFree: false },
  { name: "Star Crown", category: "accessories", rarity: "rare", coinPrice: 200, gemPrice: 5, imageUrl: "/avatars/star-crown.png", isFree: false },
  { name: "Rainbow Headband", category: "accessories", rarity: "common", coinPrice: 75, gemPrice: 0, imageUrl: "/avatars/rainbow-headband.png", isFree: false },
  { name: "Wizard Hat", category: "accessories", rarity: "epic", coinPrice: 500, gemPrice: 15, imageUrl: "/avatars/wizard-hat.png", isFree: false },
  { name: "Dragon Crown", category: "accessories", rarity: "legendary", coinPrice: 1000, gemPrice: 30, imageUrl: "/avatars/dragon-crown.png", isFree: false },
  { name: "Flower Tiara", category: "accessories", rarity: "rare", coinPrice: 150, gemPrice: 3, imageUrl: "/avatars/flower-tiara.png", isFree: false },
  { name: "Pirate Bandana", category: "accessories", rarity: "common", coinPrice: 60, gemPrice: 0, imageUrl: "/avatars/pirate-bandana.png", isFree: false },
  { name: "Astronaut Helmet", category: "accessories", rarity: "epic", coinPrice: 400, gemPrice: 12, imageUrl: "/avatars/astronaut-helmet.png", isFree: false },
  { name: "Classic Blue", category: "outfits", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/outfit-blue.png", isFree: true, isDefault: true },
  { name: "Sunset Orange", category: "outfits", rarity: "common", coinPrice: 80, gemPrice: 0, imageUrl: "/avatars/outfit-orange.png", isFree: false },
  { name: "Forest Green", category: "outfits", rarity: "common", coinPrice: 80, gemPrice: 0, imageUrl: "/avatars/outfit-green.png", isFree: false },
  { name: "Royal Purple", category: "outfits", rarity: "rare", coinPrice: 200, gemPrice: 5, imageUrl: "/avatars/outfit-purple.png", isFree: false },
  { name: "Galaxy Suit", category: "outfits", rarity: "epic", coinPrice: 500, gemPrice: 15, imageUrl: "/avatars/outfit-galaxy.png", isFree: false },
  { name: "Dragon Armor", category: "outfits", rarity: "legendary", coinPrice: 1200, gemPrice: 35, imageUrl: "/avatars/outfit-dragon.png", isFree: false },
  { name: "Lab Coat", category: "outfits", rarity: "rare", coinPrice: 180, gemPrice: 4, imageUrl: "/avatars/outfit-labcoat.png", isFree: false },
  { name: "Knight Armor", category: "outfits", rarity: "epic", coinPrice: 450, gemPrice: 12, imageUrl: "/avatars/outfit-knight.png", isFree: false },
  { name: "Spiky Red", category: "hair", rarity: "common", coinPrice: 40, gemPrice: 0, imageUrl: "/avatars/hair-red.png", isFree: false },
  { name: "Long Blonde", category: "hair", rarity: "common", coinPrice: 40, gemPrice: 0, imageUrl: "/avatars/hair-blonde.png", isFree: false },
  { name: "Curly Brown", category: "hair", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/hair-brown.png", isFree: true, isDefault: true },
  { name: "Rainbow Streaks", category: "hair", rarity: "rare", coinPrice: 200, gemPrice: 5, imageUrl: "/avatars/hair-rainbow.png", isFree: false },
  { name: "Flame Hair", category: "hair", rarity: "epic", coinPrice: 400, gemPrice: 10, imageUrl: "/avatars/hair-flame.png", isFree: false },
  { name: "Crystal Hair", category: "hair", rarity: "legendary", coinPrice: 800, gemPrice: 25, imageUrl: "/avatars/hair-crystal.png", isFree: false },
  { name: "Space Buns", category: "hair", rarity: "rare", coinPrice: 150, gemPrice: 3, imageUrl: "/avatars/hair-spacebuns.png", isFree: false },
  { name: "Mohawk", category: "hair", rarity: "common", coinPrice: 60, gemPrice: 0, imageUrl: "/avatars/hair-mohawk.png", isFree: false },
  { name: "Sunny Meadow", category: "backgrounds", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/bg-meadow.png", isFree: true, isDefault: true },
  { name: "Starry Night", category: "backgrounds", rarity: "common", coinPrice: 100, gemPrice: 0, imageUrl: "/avatars/bg-stars.png", isFree: false },
  { name: "Ocean Depths", category: "backgrounds", rarity: "rare", coinPrice: 250, gemPrice: 6, imageUrl: "/avatars/bg-ocean.png", isFree: false },
  { name: "Volcano Island", category: "backgrounds", rarity: "epic", coinPrice: 500, gemPrice: 15, imageUrl: "/avatars/bg-volcano.png", isFree: false },
  { name: "Crystal Cave", category: "backgrounds", rarity: "legendary", coinPrice: 1000, gemPrice: 30, imageUrl: "/avatars/bg-crystal.png", isFree: false },
  { name: "Rainbow Bridge", category: "backgrounds", rarity: "rare", coinPrice: 200, gemPrice: 5, imageUrl: "/avatars/bg-rainbow.png", isFree: false },
  { name: "Cloud Kingdom", category: "backgrounds", rarity: "epic", coinPrice: 400, gemPrice: 10, imageUrl: "/avatars/bg-clouds.png", isFree: false },
  { name: "Neon City", category: "backgrounds", rarity: "rare", coinPrice: 300, gemPrice: 7, imageUrl: "/avatars/bg-neon.png", isFree: false },
  { name: "Wave Hello", category: "emotes", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/emote-wave.png", isFree: true, isDefault: true },
  { name: "Victory Dance", category: "emotes", rarity: "common", coinPrice: 100, gemPrice: 0, imageUrl: "/avatars/emote-victory.png", isFree: false },
  { name: "Mind Blown", category: "emotes", rarity: "rare", coinPrice: 200, gemPrice: 5, imageUrl: "/avatars/emote-mindblown.png", isFree: false },
  { name: "Fireworks", category: "emotes", rarity: "epic", coinPrice: 400, gemPrice: 10, imageUrl: "/avatars/emote-fireworks.png", isFree: false },
  { name: "Confetti Burst", category: "emotes", rarity: "rare", coinPrice: 180, gemPrice: 4, imageUrl: "/avatars/emote-confetti.png", isFree: false },
  { name: "Lightning Bolt", category: "emotes", rarity: "legendary", coinPrice: 800, gemPrice: 20, imageUrl: "/avatars/emote-lightning.png", isFree: false },
  { name: "Rocket Launch", category: "emotes", rarity: "epic", coinPrice: 350, gemPrice: 8, imageUrl: "/avatars/emote-rocket.png", isFree: false },
  { name: "Star Explosion", category: "emotes", rarity: "rare", coinPrice: 250, gemPrice: 6, imageUrl: "/avatars/emote-star.png", isFree: false },
  { name: "Peach", category: "skin_tones", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/skin-peach.png", isFree: true, isDefault: true },
  { name: "Tan", category: "skin_tones", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/skin-tan.png", isFree: true },
  { name: "Brown", category: "skin_tones", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/skin-brown.png", isFree: true },
  { name: "Dark Brown", category: "skin_tones", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/skin-darkbrown.png", isFree: true },
  { name: "Olive", category: "skin_tones", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/skin-olive.png", isFree: true },
  { name: "Light", category: "skin_tones", rarity: "common", coinPrice: 0, gemPrice: 0, imageUrl: "/avatars/skin-light.png", isFree: true },
  { name: "Robot Blue", category: "skin_tones", rarity: "epic", coinPrice: 300, gemPrice: 8, imageUrl: "/avatars/skin-robot.png", isFree: false },
  { name: "Alien Green", category: "skin_tones", rarity: "epic", coinPrice: 300, gemPrice: 8, imageUrl: "/avatars/skin-alien.png", isFree: false },
  { name: "Galaxy Purple", category: "skin_tones", rarity: "legendary", coinPrice: 600, gemPrice: 18, imageUrl: "/avatars/skin-galaxy.png", isFree: false },
  { name: "Sparkle Gold", category: "skin_tones", rarity: "legendary", coinPrice: 700, gemPrice: 20, imageUrl: "/avatars/skin-gold.png", isFree: false },
];

const QUEST_CHAPTERS = [
  { worldKey: "nova_number_galaxy", subject: "Mathematics", chapters: [
    { num: 1, title: "Counting Stars", desc: "Learn to count the stars in Nova's galaxy", intro: "Welcome, explorer! Nova needs your help counting all the stars in the galaxy. Are you ready?" },
    { num: 2, title: "Addition Asteroid Belt", desc: "Navigate the asteroid belt using addition", intro: "The asteroid belt is tricky! You'll need to add numbers together to find the safe path." },
    { num: 3, title: "Subtraction Supernova", desc: "Solve subtraction puzzles as supernovas explode", intro: "A supernova is forming! Quick, solve these subtraction problems to redirect the energy!" },
    { num: 4, title: "Multiplication Moon Base", desc: "Build a moon base with multiplication", intro: "We're building a moon base! You'll need multiplication to calculate the supplies we need." },
    { num: 5, title: "Boss: The Number Nebula", desc: "Face the final challenge in the Number Nebula", intro: "The Number Nebula holds the ultimate challenge. Show Nova everything you've learned!" },
  ]},
  { worldKey: "sage_story_kingdom", subject: "English Language Arts", chapters: [
    { num: 1, title: "The Letter Forest", desc: "Explore the forest of letters and sounds", intro: "Welcome to Sage's kingdom! Every tree here is shaped like a letter. Let's explore!" },
    { num: 2, title: "Word Village", desc: "Build words in the magical village", intro: "The villagers communicate through words. Help them build sentences!" },
    { num: 3, title: "Story Castle", desc: "Create stories in the enchanted castle", intro: "The castle library holds infinite stories. Let's write your own adventure!" },
    { num: 4, title: "Grammar Gardens", desc: "Tend the grammar gardens with proper rules", intro: "The gardens grow beautiful when grammar rules are followed. Let's tend them together!" },
    { num: 5, title: "Boss: The Story Dragon", desc: "Face the Story Dragon with your language skills", intro: "The Story Dragon guards the kingdom's greatest treasure: the Book of All Stories!" },
  ]},
  { worldKey: "spark_science_lab", subject: "Science", chapters: [
    { num: 1, title: "Lab Safety 101", desc: "Learn the basics of Spark's science lab", intro: "Welcome to my lab! Safety first — let's learn the rules before we start experimenting!" },
    { num: 2, title: "Matter Matters", desc: "Explore solids, liquids, and gases", intro: "Everything around us is made of matter. Let's discover the three states!" },
    { num: 3, title: "Force & Motion", desc: "Discover the laws of physics", intro: "Push, pull, gravity — forces are everywhere! Let's see them in action." },
    { num: 4, title: "Living Things", desc: "Study plants, animals, and ecosystems", intro: "Life is amazing! From tiny cells to giant ecosystems, let's explore together." },
    { num: 5, title: "Boss: The Experiment!", desc: "Design your own experiment", intro: "You've learned so much! Now it's time to design your very own experiment." },
  ]},
  { worldKey: "chrono_time_tower", subject: "History", chapters: [
    { num: 1, title: "Ancient Echoes", desc: "Travel to ancient civilizations", intro: "The Time Tower can take us anywhere in history! Let's start with the ancient world." },
    { num: 2, title: "Medieval Mysteries", desc: "Explore the Middle Ages", intro: "Knights, castles, and quests — the Medieval era awaits!" },
    { num: 3, title: "Age of Discovery", desc: "Sail the seas of exploration", intro: "Explorers set sail for unknown lands. Join them on their voyages!" },
    { num: 4, title: "Modern Marvels", desc: "Witness modern history unfold", intro: "From inventions to revolutions, the modern world changed everything." },
    { num: 5, title: "Boss: Timeline Tangle", desc: "Sort out a tangled timeline", intro: "Oh no! The timeline got tangled! Use everything you know to fix it." },
  ]},
  { worldKey: "pixel_code_forge", subject: "Coding & Computer Science", chapters: [
    { num: 1, title: "Binary Basics", desc: "Learn the language of computers", intro: "Computers speak in 1s and 0s. Let's learn their language!" },
    { num: 2, title: "Sequence Springs", desc: "Master sequences and algorithms", intro: "Every program follows a sequence. Let's build our first algorithms!" },
    { num: 3, title: "Loop Lagoon", desc: "Discover the power of loops", intro: "Why do things once when you can loop them? Welcome to the Loop Lagoon!" },
    { num: 4, title: "Conditional Canyon", desc: "Navigate with if-then-else logic", intro: "If this, then that — conditionals help us make decisions in code!" },
    { num: 5, title: "Boss: Debug the Dragon", desc: "Fix bugs in the dragon's code", intro: "Pixel's dragon robot has bugs in its code! Can you debug it?" },
  ]},
];

async function seed() {
  console.log("Seeding avatar items...");
  for (const item of AVATAR_ITEMS) {
    await db.insert(avatarItems).values(item).onConflictDoNothing();
  }
  console.log(`Seeded ${AVATAR_ITEMS.length} avatar items.`);

  console.log("Seeding quest chapters...");
  let questCount = 0;
  for (const world of QUEST_CHAPTERS) {
    for (const ch of world.chapters) {
      await db.insert(quests).values({
        worldKey: world.worldKey,
        chapterNumber: ch.num,
        title: ch.title,
        description: ch.desc,
        narrativeIntro: ch.intro,
        subject: world.subject,
        xpReward: ch.num === 5 ? 150 : 50,
        coinReward: ch.num === 5 ? 50 : 10,
      }).onConflictDoNothing();
      questCount++;
    }
  }
  console.log(`Seeded ${questCount} quest chapters.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
