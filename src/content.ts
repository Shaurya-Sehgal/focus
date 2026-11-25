// Campaign facts live here so they can be checked against focusBrief.txt in one place.

export const navLinks = [
  { href: '#why', label: 'Why it matters' },
  { href: '#habits', label: 'Habits' },
  { href: '#challenge', label: 'Challenge' },
  { href: '#about', label: 'About' },
];

// The two habits already in the campaign. Used by the hero choice and the Habits section.
export type HabitId = 'study' | 'bed';
export const habits: Record<HabitId, { moment: string; name: string; text: string }> = {
  study: {
    moment: 'Studying',
    name: 'A phone-free study block.',
    text: 'Choose one block of study time and keep your phone out of reach until it’s over. Start with a length you can actually finish.',
  },
  bed: {
    moment: 'Before bed',
    name: 'No short videos in the hour before bed.',
    text: 'Leave short-form entertainment out of the last hour before you sleep, so the feed isn’t the last thing you see.',
  },
};

// A typo in a finding's source list now fails the build instead of blanking the page.
export type SourceId = 'okn' | 'hpcdp' | 'yan' | 'gong';
export type Source = { id: SourceId; cite: string; title: string; url: string };

// Only sources whose text has been read and checked. Unverified ones are listed in DEVELOPMENT.md.
export const sources: Source[] = [
  {
    id: 'okn',
    cite: 'Our Kids Network (2024)',
    title: 'Youth Mental Health Report: Insights into youth mental health and well-being in Halton',
    url: 'https://ourkidsnetwork.ca/youth-mental-health-report/',
  },
  {
    id: 'hpcdp',
    cite: 'Lafontaine-Poissant et al. (2024)',
    title: 'Social media use and sleep health among adolescents in Canada. Health Promotion and Chronic Disease Prevention in Canada, 44(7/8)',
    url: 'https://www.canada.ca/en/public-health/services/reports-publications/health-promotion-chronic-disease-prevention-canada-research-policy-practice/vol-44-no-7-8-2024/social-media-sleep-health-among-adolescents-canada.html',
  },
  {
    id: 'yan',
    cite: 'Yan et al. (2024)',
    title: 'Mobile phone short video use negatively impacts attention functions: an EEG study. Frontiers in Human Neuroscience, 18',
    url: 'https://doi.org/10.3389/fnhum.2024.1383913',
  },
  {
    id: 'gong',
    cite: 'Gong & Tao (2024)',
    title: 'The relationship between short video usage and academic achievement among elementary school students. PLOS ONE, 19(11)',
    url: 'https://doi.org/10.1371/journal.pone.0309899',
  },
];

export const findings: {
  topic: string;
  scope: string;
  claim: string;
  method: string;
  sources: SourceId[];
}[] = [
  {
    topic: 'Sleep',
    scope: 'Canada, Grades 6 to 10',
    claim:
      'Among Canadian students in Grades 6 to 10, intense and problematic social-media use was linked with higher odds of poor sleep.',
    method:
      'A national survey of students aged 11 to 17, from the 2017–2018 Health Behaviour in School-aged Children study. Students answered questions about their social-media use and sleep once.',
    sources: ['hpcdp'],
  },
  {
    topic: 'Close to home',
    scope: 'Halton, Grades 7 and 10',
    claim:
      'In a 2023 Halton survey, most Grade 7 and Grade 10 students reported more screen time and less sleep than Canadian guidelines recommend.',
    method:
      'School surveys of Grade 7 and Grade 10 students in Halton’s public and Catholic school boards in spring 2023, compared with the Canadian 24-Hour Movement Guidelines.',
    sources: ['okn'],
  },
  {
    topic: 'Attention and school',
    scope: 'Two studies in China',
    claim:
      'Studies elsewhere have linked heavier short-video use with weaker attention and self-control in young adults, and with lower grades in elementary students.',
    method:
      'One study measured young adults with questionnaires and brain-activity (EEG) recordings. The other surveyed students at two elementary schools in Shenzhen, China.',
    sources: ['yan', 'gong'],
  },
];

export const challenge = {
  baseline: { label: 'Baseline week', dates: 'January 4–10, 2027', start: 4 },
  challenge: { label: 'Challenge week', dates: 'January 11–17, 2027', start: 11 },
};

// Walkthrough of the planned challenge. Wording comes from the brief; nothing here is final.
export type StageId = 'record' | 'try' | 'reflect';
export const stages: { id: StageId; title: string; when: string; body: string; note?: string }[] = [
  {
    id: 'record',
    title: 'Record your usual week',
    when: `Baseline week, ${challenge.baseline.dates}`,
    body: 'Use your phone as you normally would. Each day, record your minutes on a fixed list of selected social-media apps.',
    note: 'Use the same app list and the same way of measuring in both weeks, so they can be compared fairly.',
  },
  {
    id: 'try',
    title: 'Try one habit',
    when: `Challenge week, ${challenge.challenge.dates}`,
    body: 'Practise the habit you chose, such as a phone-free study block or no short videos in the hour before bed. Keep recording the same apps the same way.',
    note: 'Aim to log your habit on at least five of the seven days.',
  },
  {
    id: 'reflect',
    title: 'Reflect and compare',
    when: 'When both weeks are done',
    body: 'Look at your two weeks side by side and think about what changed. The proposed completion includes a short reflection, and a five-question learning quiz earns one bonus draw entry.',
  },
];
