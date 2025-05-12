
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

    onAddResponse(ticketId, response, false);
    
    toast({
      title: "Response added",
      description: "Your response has been added to the ticket",
    });
    
    setResponse("");
  };

  const generateAIResponse = () => {
    setIsGenerating(true);
    
    // Simulate AI response generation
    setTimeout(() => {
      const aiResponses = [
        "Thank you for reaching out. Based on our documentation, this issue can be resolved by clearing your browser cache and cookies. Please try this and let us know if the problem persists.",
        "I understand your concern. This appears to be a known issue with the latest update. Our development team is working on a fix that should be released in the next 24-48 hours. In the meantime, you can use the previous version as a workaround.",
        "Thanks for your patience. I've looked into your account and can confirm that your payment was processed successfully. The service should be activated within the next hour. Please let me know if you need further assistance."
      ];
      
      const generatedResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setResponse(generatedResponse);
      setIsGenerating(false);
      
      toast({
        title: "AI response generated",
        description: "You can edit the response before sending",
      });
    }, 1500);
  };

  return (
    <div className="space-y-4 mt-4 bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Add Response</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={generateAIResponse}
          disabled={isGenerating}
          className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700"
        >
          <Wand className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate AI Response"}
        </Button>
      </div>
      
      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response here..."
        rows={4}
        className="bg-white dark:bg-gray-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="transition-all duration-200 hover:scale-105">
          Submit Response
        </Button>
      </div>
    </div>
  );
}
