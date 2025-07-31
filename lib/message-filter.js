/**
 * Message filtering utility to prevent sharing of contact information
 * This helps prevent off-platform transactions by blocking attempts to share
 * contact details in messages between users.
 */

/**
 * Checks if a message contains contact information and returns filtered content
 * @param {string} content - The message content to filter
 * @returns {object} - Object containing filtered content and whether content was filtered
 */
export function filterMessageContent(content) {
  if (!content) return { filteredContent: content, wasFiltered: false };

  // Regex patterns for common contact information
  const patterns = [
    // Email addresses
    {
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      replacement: "[Email removed]"
    },
    // Phone numbers - various formats
    {
      regex: /(\+?[0-9]{1,3}[-\s.]?)?\(?[0-9]{3,5}\)?[-\s.]?[0-9]{3,4}[-\s.]?[0-9]{3,4}/g,
      replacement: "[Phone number removed]"
    },
    // WhatsApp references
    {
      regex: /\b(?:whatsapp|wa|whats app).{0,10}(?:me|at|:).{0,15}[0-9+]/gi,
      replacement: "[Contact reference removed]"
    },
    // Social media handles with numbers
    {
      regex: /\b(?:instagram|ig|facebook|fb|twitter|x|telegram|tg)[\s:@]+[\w\d_.]{3,30}\b/gi,
      replacement: "[Social media handle removed]"
    },
    // URLs
    {
      regex: /(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?/gi,
      replacement: "[Link removed]"
    },
    // Common evasion tactics
    {
      regex: /\b(?:contact|reach|text|call|message|dm)[\s:]+(?:me|us)[\s:]+(?:at|on|via|using|with|through)/gi,
      replacement: "[Contact request removed]"
    },
    // Numbers with deliberate spacing or characters between
    {
      regex: /\b\d{3}[\s.-_*]{1,3}\d{3}[\s.-_*]{1,3}\d{4}\b/g,
      replacement: "[Phone number removed]"
    }
  ];

  let filteredContent = content;
  let wasFiltered = false;

  // Apply each pattern
  patterns.forEach(pattern => {
    const originalContent = filteredContent;
    filteredContent = filteredContent.replace(pattern.regex, pattern.replacement);
    
    // Check if this pattern resulted in a change
    if (originalContent !== filteredContent) {
      wasFiltered = true;
    }
  });

  return {
    filteredContent,
    wasFiltered
  };
}

/**
 * Checks if a message should be blocked entirely due to excessive contact information
 * @param {string} content - The message content to check
 * @returns {boolean} - Whether the message should be blocked
 */
export function shouldBlockMessage(content) {
  if (!content) return false;
  
  // If more than 3 instances of contact info are detected, block the message entirely
  const { filteredContent, wasFiltered } = filterMessageContent(content);
  
  // Count how many replacements were made
  const replacementCount = (filteredContent.match(/\[(Email|Phone number|Contact reference|Social media handle|Link|Contact request) removed\]/g) || []).length;
  
  return replacementCount >= 3;
}