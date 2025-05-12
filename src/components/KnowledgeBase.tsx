
import { useState } from "react";
import { KnowledgeArticle, TicketCategory } from "../types/ticket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Book } from "lucide-react";

interface KnowledgeBaseProps {
  articles: KnowledgeArticle[];
  suggestedArticleIds?: string[];
}

export default function KnowledgeBase({ articles, suggestedArticleIds }: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredArticles = articles.filter(article => 
    (searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const categoryClasses = {
    "technical": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    "billing": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    "account": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    "general": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  
  const renderArticle = (article: KnowledgeArticle) => {
    const isSuggested = suggestedArticleIds?.includes(article.id);
    
    return (
      <Card key={article.id} className={`mb-4 ${isSuggested ? 'border-blue-500' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {article.title}
            {isSuggested && (
              <Badge className="ml-2 bg-blue-100 text-blue-800">Suggested</Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge className={categoryClasses[article.category]} variant="outline">
              {article.category}
            </Badge>
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="bg-gray-100 text-gray-800">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <p>{article.content}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search knowledge base..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Book className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Knowledge Base</h2>
        </div>
        
        {filteredArticles.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No articles found</p>
          </div>
        ) : (
          filteredArticles.map(renderArticle)
        )}
      </div>
    </div>
  );
}
