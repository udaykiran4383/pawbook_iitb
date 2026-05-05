// Demo data for showcasing PawBook IITB — Instagram for campus animals

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface StudentMemory {
  id: string;
  author: string;
  text: string;
  photo_url?: string;
  timestamp: string;
  likes: number;
  memory_type: 'happy' | 'funny' | 'touching' | 'tribute' | 'goodbye';
}

export interface MedicalRecord {
  id: string;
  record_type: 'vaccination' | 'checkup' | 'treatment' | 'injury' | 'surgery' | 'deworming';
  title: string;
  description: string;
  record_date: string;
  veterinarian?: string;
  next_due?: string;
}

export interface Animal {
  id: number;
  name: string;
  location: string;
  location_coords?: { lat: number; lng: number };
  description: string;
  animal_type: string;
  profile_image: string | null;
  status: 'active' | 'deceased' | 'missing' | 'adopted';
  created_at: string;
  trust_score: number;
  contributor: string;
  last_seen: string;
  last_seen_by?: string;
  last_fed: string;
  last_fed_by?: string;
  last_cared_at?: string;
  last_cared_by?: string;
  last_cared_type?: string;
  personality_tags: string[];
  comments: Comment[];
  memories: StudentMemory[];
  medical_records: MedicalRecord[];
  gallery: string[];
  likes: number;
  death_date?: string;
  death_note?: string;
}

export const demoAnimals: Animal[] = [
  {
    id: 1,
    name: 'Brownie',
    location: 'H21 Hostel',
    location_coords: { lat: 19.1334, lng: 72.9133 },
    description: 'The sweetest brown pup who has been part of campus life since 2022. Loves playing fetch near the hostel and stealing snacks from the dining hall. Always greets people with excited tail wags and has a peculiar habit of rolling in the grass every morning.',
    animal_type: 'dog',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 88,
    contributor: 'Rahul K.',
    last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['😊 Playful', '🐾 Friendly', '🍕 Food lover'],
    likes: 147,
    comments: [
      { id: 'c1', author: 'Priya M.', text: 'Brownie was waiting outside H21 mess today! So cute 🥺', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), likes: 12 },
      { id: 'c2', author: 'Amit S.', text: 'He stole my paratha again 😂 love this guy', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), likes: 24 },
      { id: 'c3', author: 'Neha R.', text: 'Fed him at 6pm today near the basketball court ❤️', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), likes: 8 },
    ],
    memories: [
      { id: 'm1', author: 'Rahul K.', text: 'The day Brownie followed me from the library all the way to H21. He sat outside my room for an hour until I came out with biscuits. That was the start of our friendship.', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), likes: 45, memory_type: 'touching' },
      { id: 'm2', author: 'Diya P.', text: 'Brownie crashed our study group session and fell asleep on my bag. We couldnt move for 2 hours 😂', timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), likes: 67, memory_type: 'funny' },
    ],
    medical_records: [
      { id: 'mr1', record_type: 'vaccination', title: 'Anti-rabies vaccination', description: 'Administered by campus vet. Next dose due in 1 year.', record_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Sharma', next_due: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'mr2', record_type: 'deworming', title: 'Deworming tablet', description: 'Regular deworming done. Appears healthy.', record_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Sharma', next_due: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'mr3', record_type: 'injury', title: 'Small cut on paw', description: 'Minor wound cleaned and bandaged. Healed within a week.', record_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Patel' },
    ],
    gallery: [],
  },
  {
    id: 2,
    name: 'Snow',
    location: 'Library Entrance',
    location_coords: { lat: 19.1321, lng: 72.9152 },
    description: 'Shy but curious little white pup. Doesnt bark much, just watches with those big puppy eyes. Loves treats and gentle pets. She took months to warm up to students but now lets a few people scratch her ears.',
    animal_type: 'dog',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 65,
    contributor: 'Priya M.',
    last_seen: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['🌙 Shy', '👀 Curious', '🤫 Quiet'],
    likes: 89,
    comments: [
      { id: 'c4', author: 'Vikram D.', text: 'Snow finally let me pet her today!! Took 3 months of daily visits 😭❤️', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), likes: 56 },
      { id: 'c5', author: 'Anjali K.', text: 'She was sleeping under the library bench, looked so peaceful 🐾', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), likes: 19 },
    ],
    memories: [
      { id: 'm3', author: 'Priya M.', text: 'When I first saw Snow during monsoon, she was shivering under a tree. I brought her a towel and some food. She was terrified at first but slowly came closer. Now she waits for me every evening near the library.', timestamp: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), likes: 89, memory_type: 'touching' },
    ],
    medical_records: [
      { id: 'mr4', record_type: 'vaccination', title: 'Anti-rabies', description: 'First vaccination done. Dog was scared but cooperated.', record_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Sharma' },
    ],
    gallery: [],
  },
  {
    id: 3,
    name: 'Whiskers',
    location: 'Admin Block',
    location_coords: { lat: 19.1310, lng: 72.9165 },
    description: 'Adorable orange tabby who purrs so loud you can hear her from the hallway! She loves sunny spots and will sit on your lap if you let her. Basically adopted the admin staff as her humans.',
    animal_type: 'cat',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 92,
    contributor: 'Aisha P.',
    last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['🧡 Affectionate', '☀️ Sun-lover', '😸 Purr machine'],
    likes: 234,
    comments: [
      { id: 'c6', author: 'Aisha P.', text: 'Whiskers was napping on the admin office chair AGAIN 😂 nobody dares to move her', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), likes: 34 },
      { id: 'c7', author: 'Raj T.', text: 'She jumped on my keyboard during my presentation prep 🐱💻', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), likes: 41 },
      { id: 'c8', author: 'Meera S.', text: 'Her kittens are growing so fast! Spotted them near the canteen today', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), likes: 55 },
    ],
    memories: [],
    medical_records: [],
    gallery: [],
  },
  {
    id: 6,
    name: 'Leo',
    location: 'Hillside near Hostel 13',
    description: 'A majestic leopard occasionally spotted on the hill behind the hostels. A breathtaking reminder that our campus is shared with the wild.',
    animal_type: 'leopard',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 5,
    contributor: 'Forest Dept',
    last_seen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['🐆 Wild', '🌙 Nocturnal', '🤫 Silent'],
    likes: 450,
    comments: [
      { id: 'c9', author: 'Rahul S.', text: 'Saw him cross the road at 2 AM! Absolute beauty but terrifying.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), likes: 112 },
    ],
    memories: [],
    medical_records: [],
    gallery: [],
  },
  {
    id: 7,
    name: 'Snap',
    location: 'Powai Lake edge',
    description: 'A large marsh crocodile often seen sunbathing near the boat club edge of Powai lake.',
    animal_type: 'crocodile',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 0,
    contributor: 'Boat Club',
    last_seen: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['🐊 Prehistoric', '☀️ Sunbather', '⚠️ Keep Distance'],
    likes: 320,
    comments: [
      { id: 'c10', author: 'Neha J.', text: 'Sunbathing like a king near the boathouse today.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), likes: 80 },
    ],
    memories: [
      { id: 'm4', author: 'Aisha P.', text: 'Whiskers showed up at admin block 2 years ago as a tiny kitten. The security guard started feeding her, then the professors joined in. Now she basically runs the building. She has her own cushion on the windowsill.', timestamp: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), likes: 112, memory_type: 'happy' },
    ],
    medical_records: [
      { id: 'mr5', record_type: 'checkup', title: 'Regular health checkup', description: 'Healthy weight, clean ears, no parasites detected.', record_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Kulkarni' },
      { id: 'mr6', record_type: 'vaccination', title: 'FVRCP vaccination', description: 'Core feline vaccine administered.', record_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Kulkarni', next_due: new Date(Date.now() + 245 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    gallery: [],
  },
  {
    id: 4,
    name: 'Golden',
    location: 'Sports Complex',
    location_coords: { lat: 19.1298, lng: 72.9178 },
    description: 'The most energetic retriever mix who is always ready for playtime! Will fetch sticks until the sun goes down. Best friend to all the athletes. Has been known to join cricket practice uninvited.',
    animal_type: 'dog',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 95,
    contributor: 'Vikram D.',
    last_seen: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['⚡ Energetic', '🏏 Sports fan', '❤️ Loves everyone'],
    likes: 312,
    comments: [
      { id: 'c9', author: 'Vikram D.', text: 'Golden ran onto the football field during practice and scored a "goal" by pushing the ball with his nose 😂⚽', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), likes: 89 },
      { id: 'c10', author: 'Sonal M.', text: 'He waited outside the gym for me today. Does he have a schedule or what?? 🤣', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), likes: 34 },
    ],
    memories: [
      { id: 'm5', author: 'Vikram D.', text: 'Golden has been at IITB since I was a freshman. Hes the unofficial mascot of the sports complex. Every new batch of athletes gets introduced to him on their first day. He makes everyone feel at home.', timestamp: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), likes: 156, memory_type: 'happy' },
      { id: 'm6', author: 'Coach Mehta', text: 'Even I cant get the team as motivated as Golden does. When he shows up at practice, everyone runs faster. Hes the best morale booster.', timestamp: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), likes: 201, memory_type: 'funny' },
    ],
    medical_records: [
      { id: 'mr7', record_type: 'vaccination', title: 'Annual vaccines', description: 'All core vaccines up to date. Very cooperative patient.', record_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Sharma', next_due: new Date(Date.now() + 325 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'mr8', record_type: 'treatment', title: 'Tick treatment', description: 'Found some ticks, treated with anti-tick shampoo and oral medication.', record_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Patel' },
    ],
    gallery: [],
  },
  {
    id: 5,
    name: 'Shadow',
    location: 'Main Gate',
    location_coords: { lat: 19.1350, lng: 72.9120 },
    description: 'Sleepy black and white cat who is a mama to three adorable kittens. She is protective but affectionate once she trusts you. Has claimed the security booth as her personal palace.',
    animal_type: 'cat',
    profile_image: null,
    status: 'active',
    created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 78,
    contributor: 'Neha S.',
    last_seen: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['😴 Sleepy', '🐾 Protective mama', '🌙 Night owl'],
    likes: 156,
    comments: [
      { id: 'c11', author: 'Neha S.', text: 'Shadows kittens were chasing butterflies near main gate today, cutest thing ever! 🦋', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), likes: 67 },
    ],
    memories: [],
    medical_records: [
      { id: 'mr9', record_type: 'checkup', title: 'Post-birth checkup', description: 'Shadow and kittens are healthy. All 3 kittens developing well.', record_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Kulkarni' },
    ],
    gallery: [],
  },
  // === RAINBOW BRIDGE / DECEASED ANIMALS ===
  {
    id: 100,
    name: 'Lucky',
    location: 'Near YP Gate (was)',
    location_coords: { lat: 19.1340, lng: 72.9145 },
    description: 'Lucky was the gentlest soul on campus. He would walk students to class and wait outside lecture halls. Every evening, he would sit at YP gate and watch the sunset. He taught us what unconditional love looks like.',
    animal_type: 'dog',
    profile_image: null,
    status: 'deceased',
    created_at: new Date(Date.now() - 1460 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 100,
    contributor: 'Alumni Batch 2023',
    last_seen: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['💛 Gentle giant', '🎓 Student escort', '🌅 Sunset watcher'],
    likes: 534,
    death_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    death_note: 'Lucky passed away peacefully in his sleep at the age of ~12 years. He was surrounded by students who loved him. He will forever be the heart of IITB.',
    comments: [
      { id: 'c20', author: 'Batch 2023', text: 'Lucky walked with us on our graduation day. We didnt know it would be one of the last times. Miss you buddy. 😢', timestamp: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000).toISOString(), likes: 234 },
      { id: 'c21', author: 'Prof. Deshmukh', text: 'Lucky used to attend my 8AM class. He was more regular than most students. A true IITB-ian.', timestamp: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000).toISOString(), likes: 189 },
      { id: 'c22', author: 'Arjun M.', text: 'I still look for him at YP gate every evening. 🥺', timestamp: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), likes: 156 },
    ],
    memories: [
      { id: 'm10', author: 'Rohit S.', text: 'In my first year I was homesick and sitting alone on the steps of H4. Lucky came and put his head on my lap. We sat there for an hour. He saved me that day. I will never forget you, Lucky.', timestamp: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000).toISOString(), likes: 312, memory_type: 'tribute' },
      { id: 'm11', author: 'Ananya V.', text: 'Lucky once followed me to the examination hall and lay outside the door for 3 hours until I came out. Then he walked me back to the hostel. He was better than most humans.', timestamp: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000).toISOString(), likes: 278, memory_type: 'touching' },
      { id: 'm12', author: 'Security Uncle', text: 'Lucky used to do night rounds with me. 10 years we walked together. The campus feels empty without him.', timestamp: new Date(Date.now() - 165 * 24 * 60 * 60 * 1000).toISOString(), likes: 445, memory_type: 'goodbye' },
    ],
    medical_records: [
      { id: 'mr20', record_type: 'checkup', title: 'Final health assessment', description: 'Age-related decline. Heart condition detected. Made comfortable with medication.', record_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), veterinarian: 'Dr. Sharma' },
    ],
    gallery: [],
  },
  {
    id: 101,
    name: 'Mittens',
    location: 'Canteen Area (was)',
    location_coords: { lat: 19.1325, lng: 72.9148 },
    description: 'Mittens was the canteen queen. She would sit on an empty chair at the table and judge your food choices. If your meal was good enough, she might grace you with a slow blink. She made the canteen feel like home.',
    animal_type: 'cat',
    profile_image: null,
    status: 'deceased',
    created_at: new Date(Date.now() - 1100 * 24 * 60 * 60 * 1000).toISOString(),
    trust_score: 100,
    contributor: 'Canteen Staff',
    last_seen: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_fed: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    personality_tags: ['👑 Canteen Queen', '😼 Judgy', '💕 Secretly sweet'],
    likes: 389,
    death_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    death_note: 'Mittens lived a full and happy life of ~8 years. She was loved by every batch of students who passed through the canteen. Her favourite spot on the windowsill remains empty in her honour.',
    comments: [
      { id: 'c30', author: 'Canteen Uncle', text: 'Her chair is still there. Nobody sits in it. 🪑❤️', timestamp: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000).toISOString(), likes: 267 },
    ],
    memories: [
      { id: 'm20', author: 'Batch 2022', text: 'Mittens was there on our first day and our last. She was the only constant in 4 years of chaos. Her slow blink was better than any degree.', timestamp: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000).toISOString(), likes: 334, memory_type: 'tribute' },
      { id: 'm21', author: 'Kavita R.', text: 'I used to eat lunch alone every day. Mittens always jumped on the chair next to me. She made sure I was never really alone. I think about her whenever I eat maggi.', timestamp: new Date(Date.now() - 355 * 24 * 60 * 60 * 1000).toISOString(), likes: 289, memory_type: 'goodbye' },
    ],
    medical_records: [],
    gallery: [],
  },
];

export const demoCareEvents: Record<number, Array<{ id: number; event_type: string; notes: string; created_at: string }>> = {
  1: [
    { id: 1, event_type: 'fed', notes: 'Gave dog food and water near H21', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 2, event_type: 'seen', notes: 'Playing near hostel', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ],
  3: [
    { id: 3, event_type: 'fed', notes: 'Cat food given', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 4, event_type: 'seen', notes: 'Sleeping near admin block entrance', created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 5, event_type: 'treated', notes: 'Small scratch on ear, cleaned it', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  4: [
    { id: 6, event_type: 'fed', notes: 'Premium dog food', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 7, event_type: 'seen', notes: 'Playing fetch with students', created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  ],
};

export function getDemoAnimal(id: number) {
  return demoAnimals.find(a => a.id === id);
}

export function getDemoCareEvents(animalId: number) {
  return demoCareEvents[animalId] || [];
}

export function getActiveAnimals() {
  return demoAnimals.filter(a => a.status === 'active');
}

export function getDeceasedAnimals() {
  return demoAnimals.filter(a => a.status === 'deceased');
}
