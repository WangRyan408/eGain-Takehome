"use client"

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoaderCircle, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import  { trackingDatabase } from "@/app/_database/trackingDatabase";


// Helper to extract tracking numbers from text
function extractTrackingNumber(text: string): string | null {
  // Look for tracking number patterns (simplified for demo)
  const trackingPattern = /\b(TRK\d{9})\b/i;
  const match = text.match(trackingPattern);
  return match ? match[0].toUpperCase() : null;
}

//
function emailChecker(text: string): string {
  const emailRegex = /\b((([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))\b/;
  const emailMatch = text.match(emailRegex);
  return emailMatch ? emailMatch[0] : "";
}

function sendMissingPackageClaim(text: string): string {
  // Placeholder function to send a missing package claim
  // In a real application, this would send the claim to a server or API
  console.log("Sending missing package claim:", text);
  return "Your missing package claim has been submitted. We'll get back to you shortly.";
}

function connectToAgent(): void {
  
  // Placeholder function to connect to a customer service agent
  // In a real application, this would initiate a websockett connection to a live agent
  console.log("Connecting to customer service agent...");
}

function delayNotification(email: string): void {
  const emailAddress = emailChecker(email);
  // Placeholder function to send a delay notification
  // In a real application, this would create a hook to send an email notification when eta changes in the database
  console.log("Sending delay notification to:", emailAddress);
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | undefined;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [startClaim, setStartClaim] = useState(false);
  const [delayNotif, setDelayNotif] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badInput, setBadInput] = useState<number>(0);
  const [agentConnected, setAgentConnected] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setTheme } = useTheme();

  // On page render, set the initial assistant message
  useEffect(() => {
    // Checks to see if page has been rendered before -- shouldn't work after first page load.
    if (!initialized) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm your friendly neighborhood package tracking assistant, here to help you track a lost package. To get started, please provide your tracking number.",
        },
      ]);
      //Set true afterwards so we don't run this again and wipe any messages from our message state.
      setInitialized(true);
    }
  }, [initialized]);

  // A ref to the last message in the chat, so we can scroll to it when a new message is added.
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
}, [isLoading]);

  // Function w/ if else decision tree to generate bot response
  const generateResponse = (userMessage: string): string | undefined => {
    const trackingNumber = extractTrackingNumber(userMessage);

    if (badInput > 5) {
      setAgentConnected(true);
      connectToAgent();
      setBadInput(0);
      return `I'm unable to understand your requests. Transferring you to a customer service agent.`;
    }
    // Check if the user provided a tracking number or order ID
    if (trackingNumber) {
      const trackingInfo = trackingDatabase[trackingNumber];  // Finds tracking info from our "database"

      // Checks for a valid tracking number
      if (!trackingInfo) {
        return `I couldn't find any information for tracking number ${trackingNumber}. Please verify the number and try again.`;
      }
  
      switch (trackingInfo.status) {
        // If the package is in transit, provide the location and ETA
        case "in_transit":
          return `I found your package with tracking number ${trackingNumber}! It's currently in transit at ${trackingInfo.location}. Expected delivery is in ${trackingInfo.eta}. Is there anything else you'd like to know about your package?`;
          break;

        // If the package is delayed, provide the reason and new ETA
        case "delayed":
          setDelayNotif(true);
          return `I found your package with tracking number ${trackingNumber}. Unfortunately, it's currently delayed at ${trackingInfo.location} due to ${trackingInfo.reason}. The new estimated delivery is in ${trackingInfo.eta}. Would you like me to notify you when there's an update? If so, respond with "yes" and your email address.`;
          break;

        // If the package is lost, provide the last known location and ask if they want to file a claim
        case "lost":
          setStartClaim(true);
          return `I'm sorry, but it appears that your package with tracking number ${trackingNumber} may be lost. It was last seen at ${trackingInfo.lastSeen} on ${trackingInfo.lastUpdate ? new Date(trackingInfo.lastUpdate).toLocaleDateString() : "Unknown Date"}. Would you like to file a missing package claim?`;
          break;

        // If the package is delivered, provide advice and prompt them to ask for a human agent if necessary.
        case "delivered":
          setStartClaim(true);
          return `It looks like your package has already been marked as delivered. Your delivery driver may have left the package out of view. Please check your mailbox, porch, or with your neighbors. If you still can't find it, please let me know and I can help you file a claim.`;
          break;
        
        // If there's some crazy error where the tracking number is in the database but has no valid status.
        default:
          return `Error: Unknown status for tracking number ${trackingNumber}. Please contact customer support for further assistance.`;
          break;
      }
    }
  
    // Handle messages that don't include a tracking number
    const messageLower = userMessage.toLowerCase();
    switch (true) {
      case messageLower.includes("person") || messageLower.includes("human") || messageLower.includes("agent") || messageLower.includes("support"):
        // Fake function that in a real app would open a websocket connection to a live agent.
        setAgentConnected(true);
        connectToAgent();  
        return "I'd be happy to connect you with a customer service representative. Please hold while I transfer you to the next available agent.";
        break;

      case (messageLower.includes("claim") || messageLower.includes("yes")) && startClaim == true:
        //setStartClaim(true);
        return "To file a missing package claim, I'll need some additional information. Please provide your email address and a brief description of the package contents.";
        break;

      // If user responds to missing package claim prompt, the response should have an email address. Bot responds by performing the "claim" and confirms it to the user.
      case emailChecker(messageLower) !== "" && startClaim == true: //
        setStartClaim(false);
        return sendMissingPackageClaim(messageLower);
        // If user asks for help again, bot prompts user to ask anything else.
        break;

      // If user asks for help again, bot prompts user to ask anything else.
      case messageLower.includes("help") || messageLower.includes("lost package"):
        return "I can help you track your lost package. Please provide your tracking number (format: TRK123456789)";
        break;
      
      case messageLower.includes("yes") && emailChecker(messageLower) !== "" && delayNotif == true:
          setDelayNotif(false);
          delayNotification(userMessage);
          return "You've just signed up for notification updates. We'll let you know when there's an update on your package's status.";
        
      // Fallback response for unrecognized input
      default:
        setBadInput(badInput + 1);
        return "I'm not sure I understand. To help you track your package, please provide your tracking number (format: TRK123456789).";
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // User Message Schema and Data
    const userMessage: Message = {
      id: `user-${messages.length}`,
      role: "user",
      content: input,
    }

    // Doin a lil state updating here...
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    if (agentConnected) {
      // Code for websocket message here
      // websocket message would be pushed into message state array
    } else {
    // Simulate processing delay for OPTIMAL user experience
    setTimeout(() => {
      try {
        const responseContent = generateResponse(userMessage.content || "");

        // Assistant Message Schema and Data
        const assistantMessage: Message = {
          id: `assistant-${messages.length}`,
          role: "assistant",
          content: responseContent,
        }
        
        // State/Message update for the assistant
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        
      } catch (err) {
        console.error("Error generating response:", err);
        setError("There was a problem processing your request. Please try again.");
        setIsLoading(false);
      }
    }, 1000) // Could play around with this value
  }
  }

  return (
    <div className="flex flex-col h-svh bg-background">
      <header className="border-b bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src="/robot.png" />
              <AvatarFallback>eG</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">eGain Package Tracker</h1>
              <p className="text-sm text-muted-foreground">Your package found or your money back!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")} className="text-foreground">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="text-foreground">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="text-foreground">
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4 border-l-4 border-red-600 bg-red-50">
              <div className="flex justify-between items-center">
                <div>
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-4"
                >
                  Close
                </Button>
              </div>
            </Alert>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border shadow-sm"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={lastMessageRef} />
        </div>
      </main>
      <footer className="border-t bg-background p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <Input
            autoFocus
            ref={inputRef}
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </footer>
    </div>
  )
}