export type DiseaseClassId =
  | 'healthy'
  | 'early_blight'
  | 'powdery_mildew'
  | 'yellow_rust';

export interface SampleLeaf {
  id: DiseaseClassId;
  name: string;
  shortName: string;
  plantType: string;
  visualClue: string;
  imageUrl: string;
  imageAlt: string;
  isHealthy: boolean;
  statusLabel: string;
  headline: string;
  kidFriendlySummary: string;
  whatCnnNoticed: {
    edges: string;
    colors: string;
    patterns: string;
  };
  careSteps: string[];
  defaultConfidence: number;
  classBreakdown: Record<DiseaseClassId, number>;
}

export const MODEL_OVERALL_ACCURACY = 96.4;
export const MODEL_TEST_IMAGE_COUNT = 5400;

export const CLASS_DISPLAY_NAMES: Record<DiseaseClassId, string> = {
  healthy: 'Healthy Leaf',
  early_blight: 'Leaf Spot (Early Blight)',
  powdery_mildew: 'Powdery Mildew',
  yellow_rust: 'Yellow Leaf Rust',
};

export const CLASS_BENCHMARK_ACCURACY: Array<{
  id: DiseaseClassId;
  label: string;
  testedCount: number;
  accuracy: number;
  clue: string;
}> = [
  {
    id: 'healthy',
    label: 'Healthy Leaf',
    testedCount: 1450,
    accuracy: 98.1,
    clue: 'Even leaf green with crisp veins',
  },
  {
    id: 'early_blight',
    label: 'Leaf Spot (Early Blight)',
    testedCount: 1320,
    accuracy: 95.6,
    clue: 'Dark brown bullseye circles with yellow rings',
  },
  {
    id: 'powdery_mildew',
    label: 'Powdery Mildew',
    testedCount: 1340,
    accuracy: 96.2,
    clue: 'Soft white flour-like dust patches',
  },
  {
    id: 'yellow_rust',
    label: 'Yellow Leaf Rust',
    testedCount: 1290,
    accuracy: 95.4,
    clue: 'Golden-orange speckled dots across the blade',
  },
];

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'healthy',
    name: 'Healthy Leaf',
    shortName: 'Healthy',
    plantType: 'Garden Tomato Leaf',
    visualClue: 'Bright, even green with clean veins',
    imageUrl: '/src/assets/images/leaf_healthy_1794931318158.jpg',
    imageAlt: 'Healthy bright green garden tomato leaf resting on cream field-guide paper',
    isHealthy: true,
    statusLabel: 'Healthy & Happy',
    headline: 'This leaf looks strong and healthy!',
    kidFriendlySummary:
      'The whole leaf is a fresh, even green color from tip to stem. Its veins look clear and there are no dark rings, white dust, or rusty speckles.',
    whatCnnNoticed: {
      edges: 'Found smooth, notched tomato leaf edges and clean branching veins.',
      colors: 'Saw steady, bright leaf green across almost the entire blade.',
      patterns: 'No spot rings, fuzzy patches, or speckled clusters showed up.',
    },
    careSteps: [
      'Keep watering the soil near the roots instead of splashing the leaves.',
      'Make sure the plant gets plenty of gentle morning sunshine.',
      'Check the undersides of leaves once a week to catch bugs or spots early.',
    ],
    defaultConfidence: 97.2,
    classBreakdown: {
      healthy: 97.2,
      early_blight: 1.1,
      powdery_mildew: 0.9,
      yellow_rust: 0.8,
    },
  },
  {
    id: 'early_blight',
    name: 'Leaf Spot (Early Blight)',
    shortName: 'Leaf Spot',
    plantType: 'Garden Tomato Leaf',
    visualClue: 'Dark brown rings with faint yellow halos',
    imageUrl: '/src/assets/images/leaf_early_blight_1794931318410.jpg',
    imageAlt: 'Green garden leaf showing dark brown circular Early Blight spots with yellow halos',
    isHealthy: false,
    statusLabel: 'Needs Care · Leaf Spot',
    headline: 'Spotted dark brown circles (Early Blight)',
    kidFriendlySummary:
      'A common garden fungus left dark brown circles that look a bit like tiny targets. A faint yellow ring often wraps around each dark spot.',
    whatCnnNoticed: {
      edges: 'Traced the leaf outline plus sharp round borders inside the blade.',
      colors: 'Flagged dark brown centers surrounded by lighter yellow halos.',
      patterns: 'Matched those target-shaped rings to Leaf Spot (Early Blight).',
    },
    careSteps: [
      'Ask an adult to gently snip off the spotted lower leaves so it does not spread.',
      'Water the soil at the base of the plant in the morning, not over the top.',
      'Put a layer of dry straw or mulch on the dirt so soil does not splash up.',
    ],
    defaultConfidence: 94.8,
    classBreakdown: {
      early_blight: 94.8,
      yellow_rust: 2.6,
      healthy: 1.6,
      powdery_mildew: 1.0,
    },
  },
  {
    id: 'powdery_mildew',
    name: 'Powdery Mildew',
    shortName: 'Powdery Mildew',
    plantType: 'Garden Squash Leaf',
    visualClue: 'Chalky white flour-like dust patches',
    imageUrl: '/src/assets/images/leaf_powdery_mildew_1794931318774.jpg',
    imageAlt: 'Green garden squash leaf dusted with white powdery mildew patches',
    isHealthy: false,
    statusLabel: 'Needs Care · Powdery Mildew',
    headline: 'Looks like white flour dust (Powdery Mildew)',
    kidFriendlySummary:
      'Those soft white patches look like someone sprinkled baking flour on the leaf. It is a mild surface fungus that likes crowded, shady leaves.',
    whatCnnNoticed: {
      edges: 'Outlined the toothed leaf border and the thick center rib.',
      colors: 'Found bright chalky white patches sitting on top of dark green.',
      patterns: 'Matched the cloudy, powdery spread to Powdery Mildew.',
    },
    careSteps: [
      'Give nearby plants a little extra space so fresh breezes can dry the leaves.',
      'Move potted plants to a sunnier spot if they are sitting in deep shade.',
      'Remove the dustiest leaves and wash garden scissors with soapy water afterward.',
    ],
    defaultConfidence: 95.6,
    classBreakdown: {
      powdery_mildew: 95.6,
      healthy: 2.1,
      early_blight: 1.4,
      yellow_rust: 0.9,
    },
  },
  {
    id: 'yellow_rust',
    name: 'Yellow Leaf Rust',
    shortName: 'Yellow Rust',
    plantType: 'Garden Currant Leaf',
    visualClue: 'Tiny golden-yellow and orange speckles',
    imageUrl: '/src/assets/images/leaf_yellow_rust_1794931318980.jpg',
    imageAlt: 'Garden currant leaf covered in tiny golden-yellow and orange rust speckles',
    isHealthy: false,
    statusLabel: 'Needs Care · Yellow Rust',
    headline: 'Tiny orange-yellow speckles (Yellow Leaf Rust)',
    kidFriendlySummary:
      'Hundreds of tiny golden-orange dots make the leaf look like it has rust on it. Rust spreads when leaves stay damp overnight.',
    whatCnnNoticed: {
      edges: 'Mapped the maple-like leaf lobes and crinkled tip edges.',
      colors: 'Spotted lots of golden-yellow and orange-brown pixels across the green.',
      patterns: 'Matched the scattered speckle clusters to Yellow Leaf Rust.',
    },
    careSteps: [
      'Pick up any fallen speckled leaves from the ground and put them in the trash.',
      'Water early in the day so the sun dries off any wet leaves before bedtime.',
      'Keep plants spaced apart so damp air does not get trapped around them.',
    ],
    defaultConfidence: 93.9,
    classBreakdown: {
      yellow_rust: 93.9,
      early_blight: 3.4,
      healthy: 1.7,
      powdery_mildew: 1.0,
    },
  },
];

export interface CareGuideEntry {
  id: string;
  category: 'habits' | 'spots' | 'rust';
  categoryLabel: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  doThis: string[];
  watchOutFor: string;
}

export const PLANT_CARE_GUIDES: CareGuideEntry[] = [
  {
    id: 'daily-habits',
    category: 'habits',
    categoryLabel: 'Everyday Habits',
    title: 'Three Rules for Happy Garden Leaves',
    summary:
      'Most leaf troubles happen when leaves stay wet in the dark or sit too close together. Good habits keep plants strong all summer.',
    imageUrl: '/src/assets/images/leaf_healthy_1794931318158.jpg',
    imageAlt: 'Healthy bright green leaf specimen',
    doThis: [
      'Water the dirt at the bottom of the stem, not the top of the leaves.',
      'Water in the morning so warm sunshine dries off any stray droplets.',
      'Leave breathing room between plants so gentle wind can pass through.',
    ],
    watchOutFor: 'Never leave soggy, fallen leaves sitting around the base of your plant.',
  },
  {
    id: 'early-blight-guide',
    category: 'spots',
    categoryLabel: 'Brown Spots',
    title: 'Stopping Leaf Spot (Early Blight)',
    summary:
      'Early Blight usually starts on the oldest leaves near the dirt when raindrops bounce tiny spores upward.',
    imageUrl: '/src/assets/images/leaf_early_blight_1794931318410.jpg',
    imageAlt: 'Leaf with brown Early Blight target spots',
    doThis: [
      'Snip off spotted bottom leaves gently with clean scissors.',
      'Cover bare soil with dry leaves or straw so mud cannot splash up.',
      'Wash your hands after touching spotted leaves before checking healthy plants.',
    ],
    watchOutFor: 'Look for dark brown circles that have rings inside them like a bullseye.',
  },
  {
    id: 'powdery-mildew-guide',
    category: 'spots',
    categoryLabel: 'White Dust',
    title: 'Clearing Up Powdery Mildew',
    summary:
      'Powdery Mildew looks like white chalk dust and loves shady corners where the air stands still.',
    imageUrl: '/src/assets/images/leaf_powdery_mildew_1794931318774.jpg',
    imageAlt: 'Leaf with white powdery mildew patches',
    doThis: [
      'Trim crowded stems a tiny bit so sunlight reaches the middle leaves.',
      'Avoid spraying leaves with water late in the evening.',
      'Throw away heavily dusted leaves instead of putting them in home compost.',
    ],
    watchOutFor: 'Check squash, cucumber, and zinnia leaves in late summer when nights cool down.',
  },
  {
    id: 'yellow-rust-guide',
    category: 'rust',
    categoryLabel: 'Orange Speckles',
    title: 'Handling Yellow Leaf Rust',
    summary:
      'Rust makes bright yellow or orange powder dots that rub off on your finger like paprika.',
    imageUrl: '/src/assets/images/leaf_yellow_rust_1794931318980.jpg',
    imageAlt: 'Leaf with golden yellow rust speckles',
    doThis: [
      'Check both the top and bottom of leaves for tiny orange bumps.',
      'Remove rusty leaves gently into a bag so powder does not blow onto neighbors.',
      'Give plants plenty of morning sun to dry off morning dew quickly.',
    ],
    watchOutFor: 'If you see orange dust on your fingers after touching a leaf, wash up right away.',
  },
];

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  requiresAnalysis?: boolean;
}

export const GUIDED_TOUR_STEPS: TourStep[] = [
  {
    id: 'choose-leaf',
    targetId: 'tour-sample-gallery',
    title: '1. Pick a Sample Leaf (or Upload One)',
    description:
      'Start right here! Click any of these four garden leaf cards—or add your own leaf photo—to place it on the field-guide mat.',
  },
  {
    id: 'nav-tabs',
    targetId: 'tour-nav-tabs',
    title: '2. Explore the Three Field-Guide Tabs',
    description:
      'Switch smoothly between Leaf Checker, How It Works to see how a CNN thinks, and Plant Care Tips for simple garden advice.',
  },
  {
    id: 'health-result',
    targetId: 'tour-health-result',
    title: '3. Read the Leaf Health Result',
    description:
      'After clicking Check My Leaf, Leaf Buddy explains what it found in plain words and shares three easy steps to help the plant.',
    requiresAnalysis: true,
  },
  {
    id: 'model-accuracy',
    targetId: 'tour-model-accuracy',
    title: '4. Check Model Accuracy & CNN Stages',
    description:
      'Here you can see our CNN model’s 96.4% test accuracy, how sure it is about this leaf, and tap through its 3 visual thinking stages.',
    requiresAnalysis: true,
  },
];
