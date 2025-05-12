
import { useState } from "react";
import { Ticket, TicketCategory } from "../types/ticket";
import { determineTicketPriority, suggestKnowledgeArticles } from "../utils/priorityUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import KnowledgeBase from "./KnowledgeBase";
import { mockKnowledgeBase } from "../utils/mockData";

interface TicketFormProps {
  onSubmit: (ticket: Omit<Ticket, "id" | "status" | "createdAt" | "updatedAt">) => void;
}

export default function TicketForm({ onSubmit }: TicketFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("technical");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [suggestedArticles, setSuggestedArticles] = useState<string[]>([]);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updateSuggestions(e.target.value, description);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    updateSuggestions(title, e.target.value);
  };
  
  const updateSuggestions = (currentTitle: string, currentDescription: string) => {
    if (currentTitle.length > 3 || currentDescription.length > 10) {
      const suggestions = suggestKnowledgeArticles(currentTitle, currentDescription, mockKnowledgeBase);
      setSuggestedArticles(suggestions.map(article => article.id));
      
      if (suggestions.length > 0 && !showKnowledgeBase) {
        setShowKnowledgeBase(true);
      }
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!description.trim()) {
      errors.description = "Description is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Invalid form",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    // Determine priority based on content
    const priority = determineTicketPriority(title, description);
    
    // Create new ticket object
    const newTicket = {
      title,
      description,
      userName: name,
      userEmail: email,
      category,
      priority,
    };
    
    onSubmit(newTicket);
    
    // Reset form
    setName("");
    setEmail("");
    setTitle("");
    setDescription("");
    setCategory("technical");
    setSuggestedArticles([]);
    setShowKnowledgeBase(false);
    
    toast({
      title: "Ticket submitted",
      description: "Your support ticket has been submitted successfully",
    });
  };
  
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Submit a Support Ticket</CardTitle>
          <CardDescription>
            Fill out the form below to create a new support ticket. Our team will respond as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm">{formErrors.email}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Subject</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm">{formErrors.title}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing & Payments</SelectItem>
                  <SelectItem value="account">Account Management</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={description}
                onChange={handleDescriptionChange}
                className={formErrors.description ? "border-red-500" : ""}
                placeholder="Please describe your issue in detail..."
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm">{formErrors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attachments">Attachments (optional)</Label>
              <div className="flex items-center">
                <Button type="button" variant="outline" className="w-full">
                  <Paperclip className="h-4 w-4 mr-2" />
                  <span>Add Attachment</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Max file size: 10MB. Allowed formats: PDF, JPG, PNG
              </p>
            </div>
            
            {suggestedArticles.length > 0 && (
              <div className="flex items-start p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    We found some articles that might help you resolve your issue.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-blue-600 dark:text-blue-400"
                    onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                  >
                    {showKnowledgeBase ? "Hide suggestions" : "View suggestions"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => {
            setName("");
            setEmail("");
            setTitle("");
            setDescription("");
            setCategory("technical");
            setFormErrors({});
          }}>
            Clear Form
          </Button>
          <Button onClick={handleSubmit}>Submit Ticket</Button>
        </CardFooter>
      </Card>

      {showKnowledgeBase && (
        <Card className="md:col-span-1 h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Solutions</CardTitle>
            <CardDescription>
              These articles might help resolve your issue immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeBase 
              articles={mockKnowledgeBase}
              suggestedArticleIds={suggestedArticles}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
