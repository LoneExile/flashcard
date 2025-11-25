// Seed data from qa-files
export interface QAItem {
  question: string
  answer: string
  category: string
  subcategory: string
}

// Parse the qa-files markdown format into flashcard data
export const seedDecks = [
  {
    name: 'Mandarin Chinese - Personal Information',
    description: 'Learn to ask and answer questions about personal information in Mandarin',
    cards: [
      // Name
      { front: 'nǐ jiào shén me míng zì?', back: 'What is your name?', tags: ['name', 'question'] },
      { front: 'wǒ jiào [name]', back: 'My name is [name]', tags: ['name', 'answer'] },
      { front: 'qǐng wèn nǐ jiào shén me míng zì?', back: 'May I ask what is your name?', tags: ['name', 'polite'] },

      // Age
      { front: 'nǐ jīn nián duō dà le?', back: 'How old are you this year?', tags: ['age', 'question'] },
      { front: 'wǒ jīn nián èr shí wǔ suì', back: 'I am 25 years old this year', tags: ['age', 'answer'] },
      { front: 'nǐ duō dà?', back: 'How old are you?', tags: ['age', 'question'] },

      // Nationality
      { front: 'nǐ shì nǎ guó rén?', back: 'What nationality are you?', tags: ['nationality', 'question'] },
      { front: 'wǒ shì zhōng guó rén', back: 'I am Chinese', tags: ['nationality', 'answer'] },
      { front: 'wǒ shì měi guó rén', back: 'I am American', tags: ['nationality', 'answer'] },
      { front: 'wǒ shì tài guó rén', back: 'I am Thai', tags: ['nationality', 'answer'] },

      // Hometown
      { front: 'nǐ lái zì nǎ lǐ?', back: 'Where do you come from?', tags: ['hometown', 'question'] },
      { front: 'wǒ lái zì zhōng guó', back: 'I come from China', tags: ['hometown', 'answer'] },
      { front: 'wǒ lái zì běi jīng', back: 'I come from Beijing', tags: ['hometown', 'answer'] },

      // Family
      { front: 'nǐ jiā yǒu jǐ kǒu rén?', back: 'How many people are in your family?', tags: ['family', 'question'] },
      { front: 'wǒ jiā yǒu sì kǒu rén', back: 'My family has four people', tags: ['family', 'answer'] },
      { front: 'nǐ yǒu gē ge ma?', back: 'Do you have an older brother?', tags: ['family', 'question'] },

      // Job
      { front: 'nǐ zuò shén me gōng zuò?', back: 'What is your job?', tags: ['job', 'question'] },
      { front: 'wǒ shì xué shēng', back: 'I am a student', tags: ['job', 'answer'] },
      { front: 'wǒ shì lǎo shī', back: 'I am a teacher', tags: ['job', 'answer'] },
      { front: 'wǒ shì gōng chéng shī', back: 'I am an engineer', tags: ['job', 'answer'] },

      // Work location
      { front: 'nǐ zài nǎ lǐ gōng zuò?', back: 'Where do you work?', tags: ['location', 'question'] },
      { front: 'wǒ zài běi jīng gōng zuò', back: 'I work in Beijing', tags: ['location', 'answer'] },
      { front: 'wǒ zài gōng sī gōng zuò', back: 'I work at a company', tags: ['location', 'answer'] },

      // Living location
      { front: 'nǐ xiàn zài zhù zài nǎ lǐ?', back: 'Where do you live now?', tags: ['location', 'question'] },
      { front: 'wǒ xiàn zài zhù zài shàng hǎi', back: 'I currently live in Shanghai', tags: ['location', 'answer'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Daily Routine',
    description: 'Learn to talk about daily activities and time in Mandarin',
    cards: [
      // Wake up
      { front: 'nǐ jǐ diǎn qǐ chuáng?', back: 'What time do you wake up?', tags: ['routine', 'question'] },
      { front: 'wǒ liù diǎn qǐ chuáng', back: 'I wake up at 6 o\'clock', tags: ['routine', 'answer'] },
      { front: 'wǒ zǎo shàng qī diǎn qǐ chuáng', back: 'I wake up at 7 in the morning', tags: ['routine', 'answer'] },

      // Breakfast
      { front: 'nǐ jǐ diǎn chī zǎo fàn?', back: 'What time do you eat breakfast?', tags: ['food', 'question'] },
      { front: 'wǒ qī diǎn chī zǎo fàn', back: 'I eat breakfast at 7 o\'clock', tags: ['food', 'answer'] },
      { front: 'nǐ chī zǎo fàn le ma?', back: 'Have you eaten breakfast?', tags: ['food', 'question'] },

      // Work
      { front: 'nǐ jǐ diǎn shàng bān?', back: 'What time do you go to work?', tags: ['work', 'question'] },
      { front: 'wǒ bā diǎn shàng bān', back: 'I go to work at 8 o\'clock', tags: ['work', 'answer'] },
      { front: 'nǐ jǐ diǎn xià bān?', back: 'What time do you finish work?', tags: ['work', 'question'] },
      { front: 'wǒ wǔ diǎn xià bān', back: 'I finish work at 5 o\'clock', tags: ['work', 'answer'] },

      // Lunch
      { front: 'nǐ jǐ diǎn chī wǔ fàn?', back: 'What time do you eat lunch?', tags: ['food', 'question'] },
      { front: 'wǒ shí èr diǎn chī wǔ fàn', back: 'I eat lunch at 12 o\'clock', tags: ['food', 'answer'] },

      // Go home
      { front: 'nǐ jǐ diǎn huí jiā?', back: 'What time do you go home?', tags: ['routine', 'question'] },
      { front: 'wǒ liù diǎn huí jiā', back: 'I go home at 6 o\'clock', tags: ['routine', 'answer'] },

      // Dinner
      { front: 'nǐ jǐ diǎn chī wǎn fàn?', back: 'What time do you eat dinner?', tags: ['food', 'question'] },
      { front: 'wǒ qī diǎn chī wǎn fàn', back: 'I eat dinner at 7 o\'clock', tags: ['food', 'answer'] },

      // Sleep
      { front: 'nǐ jǐ diǎn shuì jiào?', back: 'What time do you go to sleep?', tags: ['routine', 'question'] },
      { front: 'wǒ shí diǎn shuì jiào', back: 'I go to sleep at 10 o\'clock', tags: ['routine', 'answer'] },

      // Time expressions
      { front: 'liǎng diǎn', back: '2 o\'clock (Note: use liǎng, not èr)', tags: ['time'] },
      { front: 'sān diǎn shí fēn', back: '3:10', tags: ['time'] },
      { front: 'liù diǎn bàn', back: '6:30', tags: ['time'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Abilities',
    description: 'Learn to talk about abilities and skills in Mandarin',
    cards: [
      // Speaking Chinese
      { front: 'nǐ huì shuō zhōng wén ma?', back: 'Can you speak Chinese?', tags: ['ability', 'question'] },
      { front: 'wǒ huì shuō zhōng wén', back: 'I can speak Chinese', tags: ['ability', 'answer'] },
      { front: 'wǒ huì shuō yì diǎn zhōng wén', back: 'I can speak a little Chinese', tags: ['ability', 'answer'] },
      { front: 'wǒ bú huì shuō zhōng wén', back: 'I can\'t speak Chinese', tags: ['ability', 'answer'] },

      // Driving
      { front: 'nǐ huì kāi chē ma?', back: 'Can you drive?', tags: ['ability', 'question'] },
      { front: 'wǒ huì kāi chē', back: 'I can drive', tags: ['ability', 'answer'] },
      { front: 'wǒ bú huì kāi chē', back: 'I can\'t drive', tags: ['ability', 'answer'] },

      // Cooking
      { front: 'nǐ huì zuò cài ma?', back: 'Can you cook?', tags: ['ability', 'question'] },
      { front: 'wǒ huì zuò cài', back: 'I can cook', tags: ['ability', 'answer'] },
      { front: 'wǒ huì zuò zhōng guó cài', back: 'I can cook Chinese food', tags: ['ability', 'answer'] },

      // Learning
      { front: 'nǐ zài nǎ lǐ xué zhōng wén?', back: 'Where do you learn Chinese?', tags: ['learning', 'question'] },
      { front: 'wǒ zài wǎng shàng xué zhōng wén', back: 'I learn Chinese online', tags: ['learning', 'answer'] },
      { front: 'wǒ zài xué xiào xué zhōng wén', back: 'I learn Chinese at school', tags: ['learning', 'answer'] },

      // How long learning
      { front: 'nǐ xué zhōng wén duō jiǔ le?', back: 'How long have you been learning Chinese?', tags: ['learning', 'question'] },
      { front: 'wǒ xué zhōng wén sān gè yuè le', back: 'I have been learning Chinese for three months', tags: ['learning', 'answer'] },
      { front: 'wǒ xué zhōng wén yī nián le', back: 'I have been learning Chinese for one year', tags: ['learning', 'answer'] },

      // Ability level
      { front: 'nǐ zhōng wén zěn me yàng?', back: 'How is your Chinese?', tags: ['level', 'question'] },
      { front: 'wǒ de zhōng wén bù tài hǎo', back: 'My Chinese is not very good', tags: ['level', 'answer'] },
      { front: 'wǒ de zhōng wén hái kě yǐ', back: 'My Chinese is okay', tags: ['level', 'answer'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Hobbies & Interests',
    description: 'Learn to talk about hobbies and interests in Mandarin',
    cards: [
      // General hobbies
      { front: 'nǐ xǐ huān zuò shén me?', back: 'What do you like to do?', tags: ['hobby', 'question'] },
      { front: 'nǐ de ài hào shì shén me?', back: 'What are your hobbies?', tags: ['hobby', 'question'] },

      // Hiking
      { front: 'nǐ xǐ huān pá shān ma?', back: 'Do you like hiking?', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān pá shān', back: 'I like hiking', tags: ['hobby', 'answer'] },
      { front: 'wǒ xǐ huān sàn bù', back: 'I like taking walks', tags: ['hobby', 'answer'] },

      // Games
      { front: 'nǐ xǐ huān wán yóu xì ma?', back: 'Do you like playing games?', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān wán yóu xì', back: 'I like playing games', tags: ['hobby', 'answer'] },

      // Movies/TV
      { front: 'nǐ xǐ huān kàn diàn yǐng ma?', back: 'Do you like watching movies?', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān kàn diàn yǐng', back: 'I like watching movies', tags: ['hobby', 'answer'] },
      { front: 'wǒ xǐ huān kàn diàn shì', back: 'I like watching TV', tags: ['hobby', 'answer'] },

      // Music
      { front: 'nǐ xǐ huān tīng gē ma?', back: 'Do you like listening to music?', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān tīng gē', back: 'I like listening to music', tags: ['hobby', 'answer'] },

      // Shopping
      { front: 'nǐ xǐ huān guàng jiē ma?', back: 'Do you like shopping?', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān guàng jiē', back: 'I like shopping', tags: ['hobby', 'answer'] },

      // Reading
      { front: 'nǐ xǐ huān kàn shū ma?', back: 'Do you like reading books?', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān kàn shū', back: 'I like reading books', tags: ['hobby', 'answer'] },

      // With whom
      { front: 'nǐ hé shéi yì qǐ pá shān?', back: 'Who do you go hiking with?', tags: ['activity', 'question'] },
      { front: 'wǒ hé péng yǒu yì qǐ pá shān', back: 'I go hiking with friends', tags: ['activity', 'answer'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Plans & Activities',
    description: 'Learn to talk about plans and activities in Mandarin',
    cards: [
      // Today
      { front: 'nǐ jīn tiān zuò shén me?', back: 'What are you doing today?', tags: ['plans', 'question'] },
      { front: 'jīn tiān wǒ qù xué xiào', back: 'Today I go to school', tags: ['plans', 'answer'] },
      { front: 'wǒ jīn tiān shàng bān', back: 'I go to work today', tags: ['plans', 'answer'] },
      { front: 'jīn tiān wǒ zài jiā xiū xi', back: 'Today I rest at home', tags: ['plans', 'answer'] },

      // Tomorrow
      { front: 'nǐ míng tiān zuò shén me?', back: 'What are you doing tomorrow?', tags: ['plans', 'question'] },
      { front: 'míng tiān wǒ qù gōng yuán', back: 'Tomorrow I go to the park', tags: ['plans', 'answer'] },
      { front: 'wǒ míng tiān xiǎng qù cān tīng chī fàn', back: 'Tomorrow I want to go to a restaurant to eat', tags: ['plans', 'answer'] },

      // Yesterday
      { front: 'nǐ zuó tiān zuò le shén me?', back: 'What did you do yesterday?', tags: ['past', 'question'] },
      { front: 'zuó tiān wǒ qù xué xiào le', back: 'Yesterday I went to school', tags: ['past', 'answer'] },
      { front: 'wǒ zuó tiān qù gōng yuán sàn bù le', back: 'Yesterday I went to the park for a walk', tags: ['past', 'answer'] },

      // Weekend
      { front: 'nǐ zhè ge zhōu mò zuò shén me?', back: 'What are you doing this weekend?', tags: ['plans', 'question'] },
      { front: 'zhè ge zhōu mò wǒ xiǎng xiū xi', back: 'This weekend I want to rest', tags: ['plans', 'answer'] },
      { front: 'wǒ zhè zhōu mò qù gōng yuán', back: 'This weekend I go to the park', tags: ['plans', 'answer'] },

      // Last weekend
      { front: 'nǐ shàng ge zhōu mò zuò le shén me?', back: 'What did you do last weekend?', tags: ['past', 'question'] },
      { front: 'shàng ge zhōu mò wǒ qù guàng jiē le', back: 'Last weekend I went shopping', tags: ['past', 'answer'] },

      // Negative
      { front: 'wǒ bù qù xué xiào', back: 'I don\'t go to school', tags: ['negative', 'statement'] },
      { front: 'wǒ bù xiǎng shàng bān', back: 'I don\'t want to go to work', tags: ['negative', 'statement'] },
      { front: 'wǒ jīn tiān bù xiǎng qù gōng yuán', back: 'Today I don\'t want to go to the park', tags: ['negative', 'statement'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Family Details',
    description: 'Learn to talk about family members in detail in Mandarin',
    cards: [
      // Mother
      { front: 'nǐ de mā ma jiào shén me míng zì?', back: 'What is your mother\'s name?', tags: ['family', 'question'] },
      { front: 'nǐ de mā ma zuò shén me gōng zuò?', back: 'What is your mother\'s job?', tags: ['family', 'question'] },
      { front: 'wǒ de mā ma shì lǎo shī', back: 'My mother is a teacher', tags: ['family', 'answer'] },

      // Father
      { front: 'nǐ de bà ba jiào shén me míng zì?', back: 'What is your father\'s name?', tags: ['family', 'question'] },
      { front: 'nǐ de bà ba zuò shén me gōng zuò?', back: 'What is your father\'s job?', tags: ['family', 'question'] },
      { front: 'wǒ de bà ba shì gōng chéng shī', back: 'My father is an engineer', tags: ['family', 'answer'] },

      // Siblings
      { front: 'nǐ yǒu gē ge ma?', back: 'Do you have an older brother?', tags: ['family', 'question'] },
      { front: 'wǒ yǒu yī gè gē ge', back: 'I have one older brother', tags: ['family', 'answer'] },
      { front: 'wǒ méi yǒu gē ge', back: 'I don\'t have an older brother', tags: ['family', 'answer'] },

      { front: 'nǐ yǒu jiě jie ma?', back: 'Do you have an older sister?', tags: ['family', 'question'] },
      { front: 'wǒ yǒu yī gè jiě jie', back: 'I have one older sister', tags: ['family', 'answer'] },

      { front: 'nǐ yǒu dì di ma?', back: 'Do you have a younger brother?', tags: ['family', 'question'] },
      { front: 'wǒ yǒu yī gè dì di', back: 'I have one younger brother', tags: ['family', 'answer'] },

      { front: 'nǐ yǒu mèi mei ma?', back: 'Do you have a younger sister?', tags: ['family', 'question'] },
      { front: 'wǒ yǒu liǎng gè mèi mei', back: 'I have two younger sisters', tags: ['family', 'answer'] },

      // Grandparents
      { front: 'nǐ de yé ye duō dà le?', back: 'How old is your grandfather (dad\'s side)?', tags: ['family', 'question'] },
      { front: 'wǒ de yé ye qī shí suì le', back: 'My grandfather is 70 years old', tags: ['family', 'answer'] },

      // Family wellbeing
      { front: 'nǐ de jiā rén zěn me yàng?', back: 'How is your family?', tags: ['family', 'question'] },
      { front: 'wǒ de jiā rén hěn hǎo', back: 'My family is very well', tags: ['family', 'answer'] },
      { front: 'tā men dōu hěn hǎo', back: 'They are all very well', tags: ['family', 'answer'] },
    ],
  },
]
