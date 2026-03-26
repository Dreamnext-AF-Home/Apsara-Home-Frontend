const blockedWords = [
  // English
  'fuck','fucking','fuckyou','fucku','fck','fcku','fckyou',
  'shit','shitty','bullshit',
  'bitch','bitchass','bitchy',
  'ass','asshole','asshat','asslicker',
  'bastard','dumbass','jackass',
  'dick','dickhead','dickface',
  'pussy','pussies',
  'cunt',
  'motherfucker','mf','mofo',
  'slut','whore',
  'retard','retarded',
  'faggot','fag',
  'nigger','nigga',
  'porn','porno','pornhub',
  'sex','sexy','sexvideo','sexchat',

  // Tagalog / Filipino
  'puta','putahe','putangina','putangina','putanginamo','putanginamoka',
  'putanginamopo','putanginanyo','putangina nyo',
  'tangina','tanginamo','tanginamoka','tanginanyo',
  'taena','taenamo','taenanyo',
  'gago','gagoka','gagomo','gagoka','gaguka',
  'ulol','ulolka','ulolmo',
  'tanga','tangaka','tangamo',
  'tarantado','tarantadoka','tarantadomo',
  'bobo','boboka','bobomo',
  'kupal','kupalka','kupalmo',
  'bwisit','bwisitka',
  'leche','lecheng','lechengka',
  'hayop','hayopka',
  'punyeta','punyetaka',
  'lintik','lintikka',
  'yawa','yawaka',

  // No spacing / compressed / bypass forms
  'putangina','putanginamo','putanginamoka','putanginamopo',
  'tangina','tanginamo','tanginamoka',
  'gagoka','gagomo','ulolka','ulolmo',
  'tangaka','tangamo',
  'boboka','bobomo',
  'kupalka','kupalmo',
  'punyetaka','bwisitka',

  // Mixed / stylized bypass
  'p0ta','pota','potaena','potangina',
  'g4go','gago','gag0',
  'ul0l','ulol',
  't4nga','tanga',
  'b0bo','bobo',
  'kupal','kup4l',
  'f*ck','sh*t','b*tch'
];

export const containsBlockedWord = (value: string) => {
  const lower = value.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9]+/g, ' ');
  const compact = lower.replace(/[^a-z0-9]+/g, '');

  return blockedWords.some((word) => {
    const needle = word.toLowerCase();
    const needleCompact = needle.replace(/[^a-z0-9]+/g, '');
    return normalized.includes(needle) || (needleCompact.length > 0 && compact.includes(needleCompact));
  });
};

export { blockedWords };
