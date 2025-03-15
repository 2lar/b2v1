// Utility functions for text processing and analysis

/**
 * Calculate similarity between two text strings
 * This is a simple implementation that counts common words
 */
export const calculateSimilarity = (text1: string, text2: string): number => {
    // Convert to lowercase and split into words
    const words1 = text1.toLowerCase().split(/\W+/).filter(word => word.length > 0);
    const words2 = text2.toLowerCase().split(/\W+/).filter(word => word.length > 0);
    
    // Find common words
    const commonWords = words1.filter(word => words2.includes(word));
    
    // Get unique words from both texts
    const uniqueWords = Array.from(new Set([...words1, ...words2]));
    
    // If no words, return 0
    if (uniqueWords.length === 0) return 0;
    
    // Return similarity ratio
    return commonWords.length / uniqueWords.length;
  };
  
  /**
   * List of common English stop words to filter out
   */
  const stopwords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 
    'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 
    'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
    'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 
    'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 
    'just', 'don', 'should', 'now'
  ]);
  
  /**
   * Extract keywords from text
   */
  export const extractKeywords = (text: string, maxKeywords: number = 10): string[] => {
    // Convert to lowercase and remove special characters
    const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Split into words
    const words = cleanedText.split(/\s+/);
    
    // Remove common stop words and short words
    const filteredWords = words.filter(word => 
      word.length > 2 && !stopwords.has(word)
    );
    
    // Count word occurrences
    const wordCounts: Record<string, number> = {};
    filteredWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Sort by count
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
    
    return sortedWords.slice(0, maxKeywords);
  };
  
  /**
   * Calculate cosine similarity between two texts
   * This is a more sophisticated similarity measure than the simple one above
   */
  export const calculateCosineSimilarity = (text1: string, text2: string): number => {
    // Convert texts to word frequency vectors
    const getText1Words = text1.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const getText2Words = text2.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    
    // Get unique words from both texts
    const uniqueWords = [...new Set([...getText1Words, ...getText2Words])];
    
    // If no words, return 0
    if (uniqueWords.length === 0) return 0;
    
    // Create vectors
    const vector1 = uniqueWords.map(word => getText1Words.filter(w => w === word).length);
    const vector2 = uniqueWords.map(word => getText2Words.filter(w => w === word).length);
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < uniqueWords.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  };