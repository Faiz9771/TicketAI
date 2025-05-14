
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand } from "lucide-react";

interface TicketResponseFormProps {
  ticketId: string;
  ticketContent: string;
  onAddResponse: (ticketId: string, content: string, isAIGenerated: boolean) => void;
}

export default function TicketResponseForm({
  ticketId,
  ticketContent,
  onAddResponse,
}: TicketResponseFormProps) {
  const { toast } = useToast();
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = () => {
    if (!response.trim()) {
      toast({
        title: "Empty response",
        description: "Please enter a response before submitting",
        variant: "destructive",
      });
      return;
    }

    // Pass the response to the parent component
    onAddResponse(ticketId, response, false);
    
    toast({
      title: "Response added",
      description: "Your response has been added to the ticket",
    });
    
    // Clear the response field after submission
    setResponse("");
  };

  const generateAIResponse = async () => {
    setIsGenerating(true);
    
    try {
      // Call the actual API endpoint to generate a response
      const response = await fetch(`/api/company-data/generate-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          query: ticketContent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI response');
      }
      
      const data = await response.json();
      setResponse(data.response);
      
      toast({
        title: "AI response generated",
        description: "You can edit the response before sending",
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate AI response',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 mt-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800 shadow-md animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gradient">Add Response</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={generateAIResponse}
          disabled={isGenerating}
          className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 hover-scale"
        >
          <Wand className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
          {isGenerating ? (
            <>
              <span className="animate-pulse">Generating</span>
              <span className="ml-1 inline-flex">
                <span className="animate-bounce-subtle delay-100">.</span>
                <span className="animate-bounce-subtle delay-200">.</span>
                <span className="animate-bounce-subtle delay-300">.</span>
              </span>
            </>
          ) : (
            "Generate AI Response"
          )}
        </Button>
      </div>
      
      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response here..."
        rows={4}
        className="bg-white dark:bg-gray-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner"
      />
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="btn-gradient transition-all duration-200 hover:scale-105 shadow-md">
          Submit Response
        </Button>
      </div>
    </div>
  );
}
