// Seed data from qa-files
export interface QAItem {
  question: string
  answer: string
  category: string
  subcategory: string
}

// Parse the qa-files markdown format into flashcard data
// front = Pinyin, back = English, audio = Chinese characters for TTS
export const seedDecks = [
  {
    name: 'Mandarin Chinese - Personal Information',
    description: 'Learn to ask and answer questions about personal information in Mandarin',
    cards: [
      // Name
      { front: 'nǐ jiào shén me míng zì?', back: 'What is your name?', audio: '你叫什么名字？', tags: ['name', 'question'] },
      { front: 'wǒ jiào [name]', back: 'My name is [name]', audio: '我叫', tags: ['name', 'answer'] },
      { front: 'qǐng wèn nǐ jiào shén me míng zì?', back: 'May I ask what is your name?', audio: '请问你叫什么名字？', tags: ['name', 'polite'] },

      // Age
      { front: 'nǐ jīn nián duō dà le?', back: 'How old are you this year?', audio: '你今年多大了？', tags: ['age', 'question'] },
      { front: 'wǒ jīn nián èr shí wǔ suì', back: 'I am 25 years old this year', audio: '我今年二十五岁', tags: ['age', 'answer'] },
      { front: 'nǐ duō dà?', back: 'How old are you?', audio: '你多大？', tags: ['age', 'question'] },

      // Nationality
      { front: 'nǐ shì nǎ guó rén?', back: 'What nationality are you?', audio: '你是哪国人？', tags: ['nationality', 'question'] },
      { front: 'wǒ shì zhōng guó rén', back: 'I am Chinese', audio: '我是中国人', tags: ['nationality', 'answer'] },
      { front: 'wǒ shì měi guó rén', back: 'I am American', audio: '我是美国人', tags: ['nationality', 'answer'] },
      { front: 'wǒ shì tài guó rén', back: 'I am Thai', audio: '我是泰国人', tags: ['nationality', 'answer'] },

      // Hometown
      { front: 'nǐ lái zì nǎ lǐ?', back: 'Where do you come from?', audio: '你来自哪里？', tags: ['hometown', 'question'] },
      { front: 'wǒ lái zì zhōng guó', back: 'I come from China', audio: '我来自中国', tags: ['hometown', 'answer'] },
      { front: 'wǒ lái zì běi jīng', back: 'I come from Beijing', audio: '我来自北京', tags: ['hometown', 'answer'] },

      // Family
      { front: 'nǐ jiā yǒu jǐ kǒu rén?', back: 'How many people are in your family?', audio: '你家有几口人？', tags: ['family', 'question'] },
      { front: 'wǒ jiā yǒu sì kǒu rén', back: 'My family has four people', audio: '我家有四口人', tags: ['family', 'answer'] },
      { front: 'nǐ yǒu gē ge ma?', back: 'Do you have an older brother?', audio: '你有哥哥吗？', tags: ['family', 'question'] },

      // Job
      { front: 'nǐ zuò shén me gōng zuò?', back: 'What is your job?', audio: '你做什么工作？', tags: ['job', 'question'] },
      { front: 'wǒ shì xué shēng', back: 'I am a student', audio: '我是学生', tags: ['job', 'answer'] },
      { front: 'wǒ shì lǎo shī', back: 'I am a teacher', audio: '我是老师', tags: ['job', 'answer'] },
      { front: 'wǒ shì gōng chéng shī', back: 'I am an engineer', audio: '我是工程师', tags: ['job', 'answer'] },

      // Work location
      { front: 'nǐ zài nǎ lǐ gōng zuò?', back: 'Where do you work?', audio: '你在哪里工作？', tags: ['location', 'question'] },
      { front: 'wǒ zài běi jīng gōng zuò', back: 'I work in Beijing', audio: '我在北京工作', tags: ['location', 'answer'] },
      { front: 'wǒ zài gōng sī gōng zuò', back: 'I work at a company', audio: '我在公司工作', tags: ['location', 'answer'] },

      // Living location
      { front: 'nǐ xiàn zài zhù zài nǎ lǐ?', back: 'Where do you live now?', audio: '你现在住在哪里？', tags: ['location', 'question'] },
      { front: 'wǒ xiàn zài zhù zài shàng hǎi', back: 'I currently live in Shanghai', audio: '我现在住在上海', tags: ['location', 'answer'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Daily Routine',
    description: 'Learn to talk about daily activities and time in Mandarin',
    cards: [
      // Wake up
      { front: 'nǐ jǐ diǎn qǐ chuáng?', back: 'What time do you wake up?', audio: '你几点起床？', tags: ['routine', 'question'] },
      { front: 'wǒ liù diǎn qǐ chuáng', back: 'I wake up at 6 o\'clock', audio: '我六点起床', tags: ['routine', 'answer'] },
      { front: 'wǒ zǎo shàng qī diǎn qǐ chuáng', back: 'I wake up at 7 in the morning', audio: '我早上七点起床', tags: ['routine', 'answer'] },

      // Breakfast
      { front: 'nǐ jǐ diǎn chī zǎo fàn?', back: 'What time do you eat breakfast?', audio: '你几点吃早饭？', tags: ['food', 'question'] },
      { front: 'wǒ qī diǎn chī zǎo fàn', back: 'I eat breakfast at 7 o\'clock', audio: '我七点吃早饭', tags: ['food', 'answer'] },
      { front: 'nǐ chī zǎo fàn le ma?', back: 'Have you eaten breakfast?', audio: '你吃早饭了吗？', tags: ['food', 'question'] },

      // Work
      { front: 'nǐ jǐ diǎn shàng bān?', back: 'What time do you go to work?', audio: '你几点上班？', tags: ['work', 'question'] },
      { front: 'wǒ bā diǎn shàng bān', back: 'I go to work at 8 o\'clock', audio: '我八点上班', tags: ['work', 'answer'] },
      { front: 'nǐ jǐ diǎn xià bān?', back: 'What time do you finish work?', audio: '你几点下班？', tags: ['work', 'question'] },
      { front: 'wǒ wǔ diǎn xià bān', back: 'I finish work at 5 o\'clock', audio: '我五点下班', tags: ['work', 'answer'] },

      // Lunch
      { front: 'nǐ jǐ diǎn chī wǔ fàn?', back: 'What time do you eat lunch?', audio: '你几点吃午饭？', tags: ['food', 'question'] },
      { front: 'wǒ shí èr diǎn chī wǔ fàn', back: 'I eat lunch at 12 o\'clock', audio: '我十二点吃午饭', tags: ['food', 'answer'] },

      // Go home
      { front: 'nǐ jǐ diǎn huí jiā?', back: 'What time do you go home?', audio: '你几点回家？', tags: ['routine', 'question'] },
      { front: 'wǒ liù diǎn huí jiā', back: 'I go home at 6 o\'clock', audio: '我六点回家', tags: ['routine', 'answer'] },

      // Dinner
      { front: 'nǐ jǐ diǎn chī wǎn fàn?', back: 'What time do you eat dinner?', audio: '你几点吃晚饭？', tags: ['food', 'question'] },
      { front: 'wǒ qī diǎn chī wǎn fàn', back: 'I eat dinner at 7 o\'clock', audio: '我七点吃晚饭', tags: ['food', 'answer'] },

      // Sleep
      { front: 'nǐ jǐ diǎn shuì jiào?', back: 'What time do you go to sleep?', audio: '你几点睡觉？', tags: ['routine', 'question'] },
      { front: 'wǒ shí diǎn shuì jiào', back: 'I go to sleep at 10 o\'clock', audio: '我十点睡觉', tags: ['routine', 'answer'] },

      // Time expressions
      { front: 'liǎng diǎn', back: '2 o\'clock (Note: use liǎng, not èr)', audio: '两点', tags: ['time'] },
      { front: 'sān diǎn shí fēn', back: '3:10', audio: '三点十分', tags: ['time'] },
      { front: 'liù diǎn bàn', back: '6:30', audio: '六点半', tags: ['time'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Abilities',
    description: 'Learn to talk about abilities and skills in Mandarin',
    cards: [
      // Speaking Chinese
      { front: 'nǐ huì shuō zhōng wén ma?', back: 'Can you speak Chinese?', audio: '你会说中文吗？', tags: ['ability', 'question'] },
      { front: 'wǒ huì shuō zhōng wén', back: 'I can speak Chinese', audio: '我会说中文', tags: ['ability', 'answer'] },
      { front: 'wǒ huì shuō yì diǎn zhōng wén', back: 'I can speak a little Chinese', audio: '我会说一点中文', tags: ['ability', 'answer'] },
      { front: 'wǒ bú huì shuō zhōng wén', back: 'I can\'t speak Chinese', audio: '我不会说中文', tags: ['ability', 'answer'] },

      // Driving
      { front: 'nǐ huì kāi chē ma?', back: 'Can you drive?', audio: '你会开车吗？', tags: ['ability', 'question'] },
      { front: 'wǒ huì kāi chē', back: 'I can drive', audio: '我会开车', tags: ['ability', 'answer'] },
      { front: 'wǒ bú huì kāi chē', back: 'I can\'t drive', audio: '我不会开车', tags: ['ability', 'answer'] },

      // Cooking
      { front: 'nǐ huì zuò cài ma?', back: 'Can you cook?', audio: '你会做菜吗？', tags: ['ability', 'question'] },
      { front: 'wǒ huì zuò cài', back: 'I can cook', audio: '我会做菜', tags: ['ability', 'answer'] },
      { front: 'wǒ huì zuò zhōng guó cài', back: 'I can cook Chinese food', audio: '我会做中国菜', tags: ['ability', 'answer'] },

      // Learning
      { front: 'nǐ zài nǎ lǐ xué zhōng wén?', back: 'Where do you learn Chinese?', audio: '你在哪里学中文？', tags: ['learning', 'question'] },
      { front: 'wǒ zài wǎng shàng xué zhōng wén', back: 'I learn Chinese online', audio: '我在网上学中文', tags: ['learning', 'answer'] },
      { front: 'wǒ zài xué xiào xué zhōng wén', back: 'I learn Chinese at school', audio: '我在学校学中文', tags: ['learning', 'answer'] },

      // How long learning
      { front: 'nǐ xué zhōng wén duō jiǔ le?', back: 'How long have you been learning Chinese?', audio: '你学中文多久了？', tags: ['learning', 'question'] },
      { front: 'wǒ xué zhōng wén sān gè yuè le', back: 'I have been learning Chinese for three months', audio: '我学中文三个月了', tags: ['learning', 'answer'] },
      { front: 'wǒ xué zhōng wén yī nián le', back: 'I have been learning Chinese for one year', audio: '我学中文一年了', tags: ['learning', 'answer'] },

      // Ability level
      { front: 'nǐ zhōng wén zěn me yàng?', back: 'How is your Chinese?', audio: '你中文怎么样？', tags: ['level', 'question'] },
      { front: 'wǒ de zhōng wén bù tài hǎo', back: 'My Chinese is not very good', audio: '我的中文不太好', tags: ['level', 'answer'] },
      { front: 'wǒ de zhōng wén hái kě yǐ', back: 'My Chinese is okay', audio: '我的中文还可以', tags: ['level', 'answer'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Hobbies & Interests',
    description: 'Learn to talk about hobbies and interests in Mandarin',
    cards: [
      // General hobbies
      { front: 'nǐ xǐ huān zuò shén me?', back: 'What do you like to do?', audio: '你喜欢做什么？', tags: ['hobby', 'question'] },
      { front: 'nǐ de ài hào shì shén me?', back: 'What are your hobbies?', audio: '你的爱好是什么？', tags: ['hobby', 'question'] },

      // Hiking
      { front: 'nǐ xǐ huān pá shān ma?', back: 'Do you like hiking?', audio: '你喜欢爬山吗？', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān pá shān', back: 'I like hiking', audio: '我喜欢爬山', tags: ['hobby', 'answer'] },
      { front: 'wǒ xǐ huān sàn bù', back: 'I like taking walks', audio: '我喜欢散步', tags: ['hobby', 'answer'] },

      // Games
      { front: 'nǐ xǐ huān wán yóu xì ma?', back: 'Do you like playing games?', audio: '你喜欢玩游戏吗？', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān wán yóu xì', back: 'I like playing games', audio: '我喜欢玩游戏', tags: ['hobby', 'answer'] },

      // Movies/TV
      { front: 'nǐ xǐ huān kàn diàn yǐng ma?', back: 'Do you like watching movies?', audio: '你喜欢看电影吗？', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān kàn diàn yǐng', back: 'I like watching movies', audio: '我喜欢看电影', tags: ['hobby', 'answer'] },
      { front: 'wǒ xǐ huān kàn diàn shì', back: 'I like watching TV', audio: '我喜欢看电视', tags: ['hobby', 'answer'] },

      // Music
      { front: 'nǐ xǐ huān tīng gē ma?', back: 'Do you like listening to music?', audio: '你喜欢听歌吗？', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān tīng gē', back: 'I like listening to music', audio: '我喜欢听歌', tags: ['hobby', 'answer'] },

      // Shopping
      { front: 'nǐ xǐ huān guàng jiē ma?', back: 'Do you like shopping?', audio: '你喜欢逛街吗？', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān guàng jiē', back: 'I like shopping', audio: '我喜欢逛街', tags: ['hobby', 'answer'] },

      // Reading
      { front: 'nǐ xǐ huān kàn shū ma?', back: 'Do you like reading books?', audio: '你喜欢看书吗？', tags: ['hobby', 'question'] },
      { front: 'wǒ xǐ huān kàn shū', back: 'I like reading books', audio: '我喜欢看书', tags: ['hobby', 'answer'] },

      // With whom
      { front: 'nǐ hé shéi yì qǐ pá shān?', back: 'Who do you go hiking with?', audio: '你和谁一起爬山？', tags: ['activity', 'question'] },
      { front: 'wǒ hé péng yǒu yì qǐ pá shān', back: 'I go hiking with friends', audio: '我和朋友一起爬山', tags: ['activity', 'answer'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Plans & Activities',
    description: 'Learn to talk about plans and activities in Mandarin',
    cards: [
      // Today
      { front: 'nǐ jīn tiān zuò shén me?', back: 'What are you doing today?', audio: '你今天做什么？', tags: ['plans', 'question'] },
      { front: 'jīn tiān wǒ qù xué xiào', back: 'Today I go to school', audio: '今天我去学校', tags: ['plans', 'answer'] },
      { front: 'wǒ jīn tiān shàng bān', back: 'I go to work today', audio: '我今天上班', tags: ['plans', 'answer'] },
      { front: 'jīn tiān wǒ zài jiā xiū xi', back: 'Today I rest at home', audio: '今天我在家休息', tags: ['plans', 'answer'] },

      // Tomorrow
      { front: 'nǐ míng tiān zuò shén me?', back: 'What are you doing tomorrow?', audio: '你明天做什么？', tags: ['plans', 'question'] },
      { front: 'míng tiān wǒ qù gōng yuán', back: 'Tomorrow I go to the park', audio: '明天我去公园', tags: ['plans', 'answer'] },
      { front: 'wǒ míng tiān xiǎng qù cān tīng chī fàn', back: 'Tomorrow I want to go to a restaurant to eat', audio: '我明天想去餐厅吃饭', tags: ['plans', 'answer'] },

      // Yesterday
      { front: 'nǐ zuó tiān zuò le shén me?', back: 'What did you do yesterday?', audio: '你昨天做了什么？', tags: ['past', 'question'] },
      { front: 'zuó tiān wǒ qù xué xiào le', back: 'Yesterday I went to school', audio: '昨天我去学校了', tags: ['past', 'answer'] },
      { front: 'wǒ zuó tiān qù gōng yuán sàn bù le', back: 'Yesterday I went to the park for a walk', audio: '我昨天去公园散步了', tags: ['past', 'answer'] },

      // Weekend
      { front: 'nǐ zhè ge zhōu mò zuò shén me?', back: 'What are you doing this weekend?', audio: '你这个周末做什么？', tags: ['plans', 'question'] },
      { front: 'zhè ge zhōu mò wǒ xiǎng xiū xi', back: 'This weekend I want to rest', audio: '这个周末我想休息', tags: ['plans', 'answer'] },
      { front: 'wǒ zhè zhōu mò qù gōng yuán', back: 'This weekend I go to the park', audio: '我这周末去公园', tags: ['plans', 'answer'] },

      // Last weekend
      { front: 'nǐ shàng ge zhōu mò zuò le shén me?', back: 'What did you do last weekend?', audio: '你上个周末做了什么？', tags: ['past', 'question'] },
      { front: 'shàng ge zhōu mò wǒ qù guàng jiē le', back: 'Last weekend I went shopping', audio: '上个周末我去逛街了', tags: ['past', 'answer'] },

      // Negative
      { front: 'wǒ bù qù xué xiào', back: 'I don\'t go to school', audio: '我不去学校', tags: ['negative', 'statement'] },
      { front: 'wǒ bù xiǎng shàng bān', back: 'I don\'t want to go to work', audio: '我不想上班', tags: ['negative', 'statement'] },
      { front: 'wǒ jīn tiān bù xiǎng qù gōng yuán', back: 'Today I don\'t want to go to the park', audio: '我今天不想去公园', tags: ['negative', 'statement'] },
    ],
  },
  {
    name: 'Mandarin Chinese - Family Details',
    description: 'Learn to talk about family members in detail in Mandarin',
    cards: [
      // Mother
      { front: 'nǐ de mā ma jiào shén me míng zì?', back: 'What is your mother\'s name?', audio: '你的妈妈叫什么名字？', tags: ['family', 'question'] },
      { front: 'nǐ de mā ma zuò shén me gōng zuò?', back: 'What is your mother\'s job?', audio: '你的妈妈做什么工作？', tags: ['family', 'question'] },
      { front: 'wǒ de mā ma shì lǎo shī', back: 'My mother is a teacher', audio: '我的妈妈是老师', tags: ['family', 'answer'] },

      // Father
      { front: 'nǐ de bà ba jiào shén me míng zì?', back: 'What is your father\'s name?', audio: '你的爸爸叫什么名字？', tags: ['family', 'question'] },
      { front: 'nǐ de bà ba zuò shén me gōng zuò?', back: 'What is your father\'s job?', audio: '你的爸爸做什么工作？', tags: ['family', 'question'] },
      { front: 'wǒ de bà ba shì gōng chéng shī', back: 'My father is an engineer', audio: '我的爸爸是工程师', tags: ['family', 'answer'] },

      // Siblings
      { front: 'nǐ yǒu gē ge ma?', back: 'Do you have an older brother?', audio: '你有哥哥吗？', tags: ['family', 'question'] },
      { front: 'wǒ yǒu yī gè gē ge', back: 'I have one older brother', audio: '我有一个哥哥', tags: ['family', 'answer'] },
      { front: 'wǒ méi yǒu gē ge', back: 'I don\'t have an older brother', audio: '我没有哥哥', tags: ['family', 'answer'] },

      { front: 'nǐ yǒu jiě jie ma?', back: 'Do you have an older sister?', audio: '你有姐姐吗？', tags: ['family', 'question'] },
      { front: 'wǒ yǒu yī gè jiě jie', back: 'I have one older sister', audio: '我有一个姐姐', tags: ['family', 'answer'] },

      { front: 'nǐ yǒu dì di ma?', back: 'Do you have a younger brother?', audio: '你有弟弟吗？', tags: ['family', 'question'] },
      { front: 'wǒ yǒu yī gè dì di', back: 'I have one younger brother', audio: '我有一个弟弟', tags: ['family', 'answer'] },

      { front: 'nǐ yǒu mèi mei ma?', back: 'Do you have a younger sister?', audio: '你有妹妹吗？', tags: ['family', 'question'] },
      { front: 'wǒ yǒu liǎng gè mèi mei', back: 'I have two younger sisters', audio: '我有两个妹妹', tags: ['family', 'answer'] },

      // Grandparents
      { front: 'nǐ de yé ye duō dà le?', back: 'How old is your grandfather (dad\'s side)?', audio: '你的爷爷多大了？', tags: ['family', 'question'] },
      { front: 'wǒ de yé ye qī shí suì le', back: 'My grandfather is 70 years old', audio: '我的爷爷七十岁了', tags: ['family', 'answer'] },

      // Family wellbeing
      { front: 'nǐ de jiā rén zěn me yàng?', back: 'How is your family?', audio: '你的家人怎么样？', tags: ['family', 'question'] },
      { front: 'wǒ de jiā rén hěn hǎo', back: 'My family is very well', audio: '我的家人很好', tags: ['family', 'answer'] },
      { front: 'tā men dōu hěn hǎo', back: 'They are all very well', audio: '他们都很好', tags: ['family', 'answer'] },
    ],
  },
]
