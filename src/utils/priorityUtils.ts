
import { Ticket, TicketPriority } from "../types/ticket";

// Simple keyword-based prioritization
const highPriorityKeywords = ["urgent", "critical", "immediately", "emergency", "broken", "crashes"];
const mediumPriorityKeywords = ["important", "issue", "problem", "error", "not working"];

/**
 * Analyzes ticket content to assign a priority level
 */
export const determineTicketPriority = (title: string, description: string): TicketPriority => {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Check for high priority keywords
  if (highPriorityKeywords.some(keyword => combinedText.includes(keyword))) {
    return "high";
  }
  
  // Check for medium priority keywords
  if (mediumPriorityKeywords.some(keyword => combinedText.includes(keyword))) {
    return "medium";
  }
  
  // Default to low priority
  return "low";
};

/**
 * Suggests knowledge base articles based on ticket content
 */
export const suggestKnowledgeArticles = (title: string, description: string, knowledgeBase: any[]) => {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Simple matching algorithm based on article tags and content
  return knowledgeBase
    .filter(article => {
      const articleText = `${article.title} ${article.content}`.toLowerCase();
      const tagMatches = article.tags.some((tag: string) => combinedText.includes(tag.toLowerCase()));
      const contentMatches = articleText.split(' ').some(word => 
        word.length > 3 && combinedText.includes(word)
      );
      
      return tagMatches || contentMatches;
    })
    .slice(0, 3); // Limit to 3 suggestions
};
