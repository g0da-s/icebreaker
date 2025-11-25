import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { parse } from "date-fns";

interface AIAvailabilityEditorProps {
  onAvailabilityUpdated: (availability: any) => void;
  onDateSlotsUpdated?: (dateSlots: any[]) => void;
}

export const AIAvailabilityEditor = ({ onAvailabilityUpdated, onDateSlotsUpdated }: AIAvailabilityEditorProps) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const parseAvailability = (text: string) => {
    // Simple AI parsing logic - in production, this would call an LLM
    const dateSlots: any[] = [];
    
    // Try to parse specific dates
    const datePatterns = [
      /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{4}-\d{2}-\d{2}/g,
    ];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(dateStr => {
          try {
            let parsedDate: Date | null = null;
            
            // Try different date formats
            if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
              const [month, day, year] = dateStr.split('/').map(Number);
              parsedDate = new Date(year, month - 1, day);
            } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              parsedDate = new Date(dateStr);
            } else {
              // Parse natural language dates
              const cleaned = dateStr.replace(/(?:st|nd|rd|th),?/gi, '');
              parsedDate = new Date(cleaned);
            }
            
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              // Extract time if present in the context
              const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
              
              let start = "09:00";
              let end = "17:00";
              
              if (timeMatch) {
                let startHour = parseInt(timeMatch[1]);
                const startMin = timeMatch[2] || "00";
                const startPeriod = timeMatch[3];
                let endHour = parseInt(timeMatch[4]);
                const endMin = timeMatch[5] || "00";
                const endPeriod = timeMatch[6];

                if (startPeriod?.toLowerCase() === 'pm' && startHour !== 12) startHour += 12;
                if (startPeriod?.toLowerCase() === 'am' && startHour === 12) startHour = 0;
                if (endPeriod?.toLowerCase() === 'pm' && endHour !== 12) endHour += 12;
                if (endPeriod?.toLowerCase() === 'am' && endHour === 12) endHour = 0;

                start = `${startHour.toString().padStart(2, '0')}:${startMin}`;
                end = `${endHour.toString().padStart(2, '0')}:${endMin}`;
              }
              
              dateSlots.push({
                date: parsedDate,
                start,
                end,
              });
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        });
      }
    });
    
    const availability = {
      monday: { active: false, start: "09:00", end: "17:00" },
      tuesday: { active: false, start: "09:00", end: "17:00" },
      wednesday: { active: false, start: "09:00", end: "17:00" },
      thursday: { active: false, start: "09:00", end: "17:00" },
      friday: { active: false, start: "09:00", end: "17:00" },
      saturday: { active: false, start: "09:00", end: "17:00" },
      sunday: { active: false, start: "09:00", end: "17:00" },
    };

    const lowerText = text.toLowerCase();

    // Detect days
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      if (lowerText.includes(day)) {
        availability[day as keyof typeof availability].active = true;
      }
    });

    // Detect weekdays
    if (lowerText.includes('weekday') || lowerText.includes('monday to friday') || lowerText.includes('mon-fri')) {
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        availability[day as keyof typeof availability].active = true;
      });
    }

    // Detect weekends
    if (lowerText.includes('weekend')) {
      availability.saturday.active = true;
      availability.sunday.active = true;
    }

    // Detect time ranges
    const timeMatch = lowerText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let startHour = parseInt(timeMatch[1]);
      const startMin = timeMatch[2] || "00";
      const startPeriod = timeMatch[3];
      let endHour = parseInt(timeMatch[4]);
      const endMin = timeMatch[5] || "00";
      const endPeriod = timeMatch[6];

      if (startPeriod?.toLowerCase() === 'pm' && startHour !== 12) startHour += 12;
      if (startPeriod?.toLowerCase() === 'am' && startHour === 12) startHour = 0;
      if (endPeriod?.toLowerCase() === 'pm' && endHour !== 12) endHour += 12;
      if (endPeriod?.toLowerCase() === 'am' && endHour === 12) endHour = 0;

      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;

      days.forEach(day => {
        if (availability[day as keyof typeof availability].active) {
          availability[day as keyof typeof availability].start = startTime;
          availability[day as keyof typeof availability].end = endTime;
        }
      });
    }

    return { availability, dateSlots };
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({
        title: "Please describe your availability",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const { availability, dateSlots } = parseAvailability(input);
      onAvailabilityUpdated(availability);
      
      if (dateSlots.length > 0 && onDateSlotsUpdated) {
        onDateSlotsUpdated(dateSlots);
      }
      
      const message = dateSlots.length > 0 
        ? `Parsed ${dateSlots.length} specific date(s) and weekly availability`
        : "Your weekly schedule has been parsed and saved";
      
      toast({
        title: "Availability Updated",
        description: message,
      });
      
      setInput("");
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="p-4 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Availability Assistant</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe your availability in plain language
        </p>
        <div className="space-y-2">
          <Textarea
            placeholder="e.g., 'I'm available Monday to Friday from 9am to 5pm, and Saturday mornings 10am-12pm'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Parse My Availability
              </>
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Examples:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>"Monday to Friday, 9am-5pm"</li>
            <li>"Available November 30th, 2025 from 2pm-5pm"</li>
            <li>"Weekdays from 10:00 to 18:00"</li>
            <li>"December 25, 2025 morning 9am-12pm"</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
