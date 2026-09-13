/**
 * What to do after a dog or cat bite or scratch.
 *
 * This is the one page in PawBook that can save a human life. Rabies kills
 * around 20,000 people a year in India — about a third of the world's deaths —
 * almost all from dog bites, and almost all preventable by two things most
 * people do not know: wash the wound under running water with soap for fifteen
 * minutes, and get the vaccine the same day. Once symptoms appear, rabies is
 * fatal in essentially every case.
 *
 * The guidance follows the WHO rabies fact sheet and India's National
 * Guidelines on Rabies Prophylaxis (MoHFW). It is deliberately short, in three
 * languages, and static — it must work with no network and no database,
 * because the person reading it may be at a gate at 2 a.m. with one bar of
 * signal.
 *
 * Translation note: the Hindi and Marathi below were written to be plain and
 * unambiguous rather than literary, and should be checked by a native speaker
 * before the page is printed or handed to a health office. The English is the
 * reference text.
 */

export type Lang = 'en' | 'hi' | 'mr';

export const LANG_LABEL: Record<Lang, string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };

export interface FirstAidStep {
  title: string;
  body: string;
  /** Emphasised: the two steps that decide whether someone lives. */
  critical?: boolean;
}

export interface FirstAidContent {
  heading: string;
  intro: string;
  steps: FirstAidStep[];
  categories: { heading: string; items: string[] };
  timerHeading: string;
  timerBody: string;
  timerStart: string;
  timerRunning: (daysLeft: number) => string;
  timerDone: string;
  timerNote: string;
  disclaimer: string;
}

export const FIRST_AID: Record<Lang, FirstAidContent> = {
  en: {
    heading: 'Bitten or scratched by a dog or cat?',
    intro: 'Do these now, in this order. Even if the wound looks small. Even if the animal seemed healthy.',
    steps: [
      {
        title: 'Wash the wound for 15 minutes',
        body: 'Under running water, with soap. Keep going for the full fifteen minutes — time it. This alone removes most of the virus.',
        critical: true,
      },
      {
        title: 'Go to a hospital today',
        body: 'Ask for the anti-rabies vaccine. If the bite broke the skin, also ask by name for "rabies immunoglobulin" — some clinics do not offer it unless asked. Do not wait to see how the wound heals.',
        critical: true,
      },
      {
        title: 'Do not cover, stitch or apply anything first',
        body: 'No turmeric, no lime, no chilli, no bandage before the hospital. These do nothing against rabies and can trap the virus.',
      },
      {
        title: 'Note which animal, and log it',
        body: 'If it was a campus animal you can identify, log it in PawBook. That lets the campus check its vaccination record and watch the animal.',
      },
    ],
    categories: {
      heading: 'How serious is it? (WHO categories)',
      items: [
        'Touching or feeding, skin intact — no treatment needed, wash anyway.',
        'Nibbling of bare skin, minor scratches without bleeding — wash + vaccine.',
        'Any bite that breaks the skin, scratches that bleed, licks on broken skin — wash + vaccine + immunoglobulin.',
      ],
    },
    timerHeading: '10-day observation',
    timerBody: 'If the animal that bit you is known and can be watched, and it is still healthy after ten days, it was not shedding rabies when it bit you. Start this when the bite happened. It does NOT replace the vaccine — start the vaccine today and stop only if a doctor says so.',
    timerStart: 'Start 10-day watch',
    timerRunning: (d) => `${d} day${d === 1 ? '' : 's'} left — keep checking the animal is eating and behaving normally.`,
    timerDone: 'Ten days have passed. If the animal is alive and well, tell your doctor. Do not stop any treatment without them.',
    timerNote: 'The timer is saved on this phone only.',
    disclaimer: 'This is first-aid guidance from WHO and India\'s national rabies guidelines, not a substitute for a doctor. When in doubt, go to the hospital.',
  },
  hi: {
    heading: 'कुत्ते या बिल्ली ने काटा या खरोंचा है?',
    intro: 'अभी, इसी क्रम में ये करें। घाव छोटा लगे तब भी। जानवर स्वस्थ दिखे तब भी।',
    steps: [
      {
        title: 'घाव को 15 मिनट तक धोएँ',
        body: 'बहते पानी और साबुन से। पूरे पंद्रह मिनट — घड़ी देखकर। इतने से ही ज़्यादातर वायरस निकल जाता है।',
        critical: true,
      },
      {
        title: 'आज ही अस्पताल जाएँ',
        body: 'रेबीज़ का टीका (एंटी-रेबीज़ वैक्सीन) माँगें। अगर काटने से खून निकला है, तो "रेबीज़ इम्युनोग्लोबुलिन" भी नाम लेकर माँगें — कई जगह बिना माँगे नहीं देते। घाव ठीक होने का इंतज़ार न करें।',
        critical: true,
      },
      {
        title: 'पहले कुछ भी न लगाएँ, न ढकें, न टाँके लगवाएँ',
        body: 'हल्दी, चूना, मिर्च, पट्टी — अस्पताल से पहले कुछ नहीं। इनसे रेबीज़ पर कोई असर नहीं होता और वायरस अंदर फँस सकता है।',
      },
      {
        title: 'कौन सा जानवर था, नोट करें और दर्ज करें',
        body: 'अगर वह कैंपस का जानवर है और आप पहचानते हैं, तो PawBook में दर्ज करें। इससे कैंपस उसका टीकाकरण रिकॉर्ड देख सकता है और उस पर नज़र रख सकता है।',
      },
    ],
    categories: {
      heading: 'कितना गंभीर है? (WHO श्रेणियाँ)',
      items: [
        'छूना या खिलाना, त्वचा सही — इलाज की ज़रूरत नहीं, फिर भी धो लें।',
        'बिना खून के हल्की खरोंच या दाँत लगना — धोएँ + टीका।',
        'कोई भी काटना जिससे त्वचा कटे, खून वाली खरोंच, कटी त्वचा पर चाटना — धोएँ + टीका + इम्युनोग्लोबुलिन।',
      ],
    },
    timerHeading: '10 दिन की निगरानी',
    timerBody: 'अगर काटने वाला जानवर पहचाना हुआ है और उस पर नज़र रखी जा सकती है, और वह दस दिन बाद भी स्वस्थ है, तो काटते समय उसमें रेबीज़ नहीं था। यह टीके की जगह नहीं लेता — टीका आज ही शुरू करें और डॉक्टर के कहने पर ही रोकें।',
    timerStart: '10 दिन की निगरानी शुरू करें',
    timerRunning: (d) => `${d} दिन बाकी — देखते रहें कि जानवर खा रहा है और सामान्य व्यवहार कर रहा है।`,
    timerDone: 'दस दिन पूरे हो गए। अगर जानवर ज़िंदा और स्वस्थ है, तो अपने डॉक्टर को बताएँ। उनके बिना कोई इलाज न रोकें।',
    timerNote: 'यह टाइमर सिर्फ़ इसी फ़ोन में सेव है।',
    disclaimer: 'यह WHO और भारत के राष्ट्रीय रेबीज़ दिशानिर्देशों पर आधारित प्राथमिक उपचार की जानकारी है, डॉक्टर का विकल्प नहीं। शक हो तो अस्पताल जाएँ।',
  },
  mr: {
    heading: 'कुत्रा किंवा मांजर चावले किंवा ओरखडले आहे का?',
    intro: 'आत्ता, याच क्रमाने हे करा. जखम लहान वाटली तरी. प्राणी निरोगी दिसला तरी.',
    steps: [
      {
        title: 'जखम १५ मिनिटे धुवा',
        body: 'वाहत्या पाण्याने आणि साबणाने. पूर्ण पंधरा मिनिटे — घड्याळ लावून. एवढ्यानेच बहुतेक विषाणू निघून जातो.',
        critical: true,
      },
      {
        title: 'आजच रुग्णालयात जा',
        body: 'रेबीजची लस (अँटी-रेबीज व्हॅक्सिन) मागा. चावल्याने रक्त आले असेल तर "रेबीज इम्युनोग्लोब्युलिन" हे नाव घेऊन मागा — अनेक ठिकाणी मागितल्याशिवाय देत नाहीत. जखम बरी होण्याची वाट पाहू नका.',
        critical: true,
      },
      {
        title: 'आधी काहीही लावू नका, झाकू नका, टाके घालू नका',
        body: 'हळद, चुना, मिरची, पट्टी — रुग्णालयाआधी काहीही नाही. याचा रेबीजवर काहीही परिणाम होत नाही आणि विषाणू आत अडकू शकतो.',
      },
      {
        title: 'कोणता प्राणी होता ते नोंदवा',
        body: 'तो कॅम्पसमधला प्राणी असेल आणि तुम्ही ओळखत असाल, तर PawBook मध्ये नोंदवा. त्यामुळे कॅम्पसला त्याचा लसीकरण रेकॉर्ड पाहता येतो आणि त्यावर लक्ष ठेवता येते.',
      },
    ],
    categories: {
      heading: 'किती गंभीर आहे? (WHO वर्ग)',
      items: [
        'स्पर्श किंवा खाऊ घालणे, त्वचा अखंड — उपचाराची गरज नाही, तरी धुवा.',
        'रक्त न येता हलके ओरखडे किंवा दात लागणे — धुवा + लस.',
        'त्वचा फाटेल असे कोणतेही चावणे, रक्त येणारे ओरखडे, फाटलेल्या त्वचेवर चाटणे — धुवा + लस + इम्युनोग्लोब्युलिन.',
      ],
    },
    timerHeading: '१० दिवसांचे निरीक्षण',
    timerBody: 'चावणारा प्राणी ओळखीचा असेल आणि त्याच्यावर लक्ष ठेवता येत असेल, आणि दहा दिवसांनंतरही तो निरोगी असेल, तर चावताना त्याला रेबीज नव्हता. हे लसीला पर्याय नाही — लस आजच सुरू करा आणि डॉक्टर सांगतील तरच थांबवा.',
    timerStart: '१० दिवसांचे निरीक्षण सुरू करा',
    timerRunning: (d) => `${d} दिवस बाकी — प्राणी खातो आहे आणि सामान्य वागतो आहे हे पाहत राहा.`,
    timerDone: 'दहा दिवस पूर्ण झाले. प्राणी जिवंत आणि निरोगी असेल तर डॉक्टरांना सांगा. त्यांच्याशिवाय कोणताही उपचार थांबवू नका.',
    timerNote: 'हा टायमर फक्त याच फोनवर साठवला आहे.',
    disclaimer: 'ही WHO आणि भारताच्या राष्ट्रीय रेबीज मार्गदर्शक तत्त्वांवर आधारित प्रथमोपचाराची माहिती आहे, डॉक्टरांना पर्याय नाही. शंका असेल तर रुग्णालयात जा.',
  },
};

export const OBSERVATION_DAYS = 10;
