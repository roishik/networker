export interface ParsedNote {
  englishName?: string;
  hebrewName?: string;
  company?: string;
  jobTitle?: string;
  introducedBy?: string;
  howMet?: string;
  followUpDate?: string;
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

  // Find company - enhanced pattern to detect "working at X" or "at X" patterns
  const companyPatterns = [
    /\bworking\s+at\s+([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*)*)/i,
    /\bat\s+([A-Z][a-zA-Z0-9]+)(?:\s+as\s+|\s+in\s+|\s*[,.])/i,
    /\bfrom\s+([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*)*)\b/i,
    /\b([A-Z][a-zA-Z]*(?:Tech|Lab|Labs|Inc|Corp|Ltd|LLC|Ventures|Capital|Fund|Solutions|Systems|Works|Group|Partners|Consulting))\b/i,
    /\b([A-Z][a-zA-Z]*\s+(?:Technologies|Corporation|Limited|Company|Ventures|Capital|Partners))\b/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.company = match[1].trim();
      remainingText = remainingText.replace(match[0], '').trim();
      break;
    }
  }

  // Find job title - enhanced to capture "product manager of X" patterns
  const jobTitlePatterns = [
    /\b(product\s+manager(?:\s+of\s+[a-zA-Z\s]+)?)/i,
    /\b(CEO|CTO|CFO|VP|Vice President|President|Director|Manager|Lead|Senior|Principal|Head of|Chief)(?:\s+of)?\s+[a-zA-Z&\s]+/i,
    /\b(Founder|Co-Founder|Partner|Associate|Analyst|Engineer|Developer|Designer|Sales Manager|Marketing Manager)\b/i
  ];

  for (const pattern of jobTitlePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.jobTitle = match[0];
      remainingText = remainingText.replace(match[0], '').trim();
      break;
    }
  }

  // Find how met - look for "met at/in" patterns
  const howMetPatterns = [
    /\bmet\s+(?:him|her|them)?\s*(?:at|in)\s+([^,.\n]+?)(?:\s+conference|\s+event|\s+meeting|\s+and|\s*[,.])/i,
    /\bat\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:conference|event|summit|expo)/i,
    /\bfrom\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:conference|event|summit|expo)/i
  ];

  for (const pattern of howMetPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.howMet = match[1].trim();
      if (text.toLowerCase().includes('conference')) {
        result.howMet += ' Conference';
      }
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

  // Find follow-up dates - parse "next Tuesday at 17:00" patterns
  const followUpPatterns = [
    /\b(?:follow[\s-]?up|meeting|call|appointment)\s+(?:scheduled\s+)?(?:for\s+)?(?:on\s+)?(next\s+\w+day(?:\s+at\s+\d{1,2}:\d{2})?)/i,
    /\b(?:scheduled|set|arranged)\s+(?:a\s+)?(?:follow[\s-]?up|meeting|call)?\s+(?:for\s+)?(next\s+\w+day(?:\s+at\s+\d{1,2}:\d{2})?)/i,
    /\b(next\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+at\s+\d{1,2}:\d{2})?)/i
  ];

  for (const pattern of followUpPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Parse the relative date to absolute
      const dateStr = match[1] || match[0];
      result.followUpDate = parseRelativeDate(dateStr);
      remainingText = remainingText.replace(match[0], '').trim();
      break;
    }
  }

  // Generate tags based on content - enhanced tag detection
  const tagKeywords = {
    'tech': /\b(tech|technology|software|development|engineering|AI|ML|startup)\b/i,
    'investor': /\b(investor|VC|venture|capital|fund|invest)\b/i,
    'founder': /\b(founder|co-founder|CEO|startup)\b/i,
    'prospect': /\b(prospect|client|customer|lead|opportunity)\b/i,
    'partner': /\b(partner|partnership|collaborate|alliance)\b/i,
    'conference': /\b(conference|summit|expo|event|meetup)\b/i,
    'parking': /\b(parking|automotive|mobility)\b/i
  };

  // Also add company name as tag if found
  if (result.company) {
    result.tags.push(result.company.toLowerCase());
  }

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

// Helper function to parse relative dates
function parseRelativeDate(dateStr: string): string {
  const now = new Date();
  const dayMatch = dateStr.match(/next\s+(\w+day)/i);
  const timeMatch = dateStr.match(/at\s+(\d{1,2}):(\d{2})/);
  
  if (dayMatch) {
    const targetDay = dayMatch[1].toLowerCase();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.findIndex(d => targetDay.includes(d));
    
    if (targetDayIndex !== -1) {
      const currentDay = now.getDay();
      let daysToAdd = targetDayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysToAdd);
      
      if (timeMatch) {
        targetDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      }
      
      return targetDate.toISOString();
    }
  }
  
  return dateStr; // Return original if can't parse
}
