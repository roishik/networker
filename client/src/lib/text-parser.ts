export interface ParsedNote {
  englishName?: string;
  hebrewName?: string;
  company?: string;
  jobTitle?: string;
  introducedBy?: string;
  tags: string[];
  remainingText: string;
}

export function parseNoteText(text: string): ParsedNote {
  let remainingText = text;
  const result: ParsedNote = {
    tags: [],
    remainingText: text
  };

  // Remove punctuation for parsing but keep original for remaining text
  const cleanText = text.replace(/[.,!?;]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleanText.split(' ');

  // Find English name (first capitalized words)
  const englishNameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (englishNameMatch) {
    result.englishName = englishNameMatch[1];
    remainingText = remainingText.replace(englishNameMatch[1], '').trim();
  }

  // Find Hebrew name (Hebrew Unicode characters)
  const hebrewNameMatch = text.match(/[\u0590-\u05FF]+(?:\s+[\u0590-\u05FF]+)*/);
  if (hebrewNameMatch) {
    result.hebrewName = hebrewNameMatch[0];
    remainingText = remainingText.replace(hebrewNameMatch[0], '').trim();
  }

  // Find company (tokens ending with common suffixes or containing "Tech", "Inc", etc.)
  const companyPatterns = [
    /\b([A-Z][a-zA-Z]*(?:Tech|Lab|Labs|Inc|Corp|Ltd|LLC|Ventures|Capital|Fund|Solutions|Systems|Works|Group|Partners|Consulting))\b/i,
    /\b([A-Z][a-zA-Z]*\s+(?:Technologies|Corporation|Limited|Company|Ventures|Capital|Partners))\b/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.company = match[1];
      remainingText = remainingText.replace(match[1], '').trim();
      break;
    }
  }

  // Find job title (common titles)
  const jobTitlePatterns = [
    /\b(CEO|CTO|CFO|VP|Vice President|President|Director|Manager|Lead|Senior|Principal|Head of|Chief)\s+[A-Z&\s]+/i,
    /\b(Founder|Co-Founder|Partner|Associate|Analyst|Engineer|Developer|Designer|Product Manager|Sales Manager)\b/i
  ];

  for (const pattern of jobTitlePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.jobTitle = match[0];
      remainingText = remainingText.replace(match[0], '').trim();
      break;
    }
  }

  // Find introductions
  const introPatterns = [
    /intro(?:'?d)?\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /introduced\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /met\s+through\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];

  for (const pattern of introPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.introducedBy = match[1];
      remainingText = remainingText.replace(match[0], '').trim();
      break;
    }
  }

  // Generate tags based on content
  const tagKeywords = {
    'tech': /\b(tech|technology|software|development|engineering|AI|ML|startup)\b/i,
    'investor': /\b(investor|VC|venture|capital|fund|invest)\b/i,
    'founder': /\b(founder|co-founder|CEO|startup)\b/i,
    'prospect': /\b(prospect|client|customer|lead|opportunity)\b/i,
    'partner': /\b(partner|partnership|collaborate|alliance)\b/i
  };

  for (const [tag, pattern] of Object.entries(tagKeywords)) {
    if (pattern.test(text)) {
      result.tags.push(tag);
    }
  }

  // Clean up remaining text
  result.remainingText = remainingText
    .replace(/^\s*[,.-]\s*/, '') // Remove leading punctuation
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}
