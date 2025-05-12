
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserRole } from "../types/ticket";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (role: UserRole) => {
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      // Store user role in localStorage for simplicity
      localStorage.setItem("userRole", role);
      
      toast({
        title: "Logged in successfully",
        description: `You are now logged in as ${role}`,
      });
      
      // Redirect based on user role
      if (role === "customer") {
        navigate("/customer");
      } else {
        navigate("/admin");
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // For demo purposes, determine role based on email domain
    const role = email.endsWith("@company.com") ? "employee" : "customer";
    handleLogin(role);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Support Ticket System</CardTitle>
          <CardDescription>Log in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            For demo purposes:
          </div>
          <div className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleLogin("customer")}
              disabled={isLoading}
            >
              Login as Customer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleLogin("employee")}
              disabled={isLoading}
            >
              Login as Employee
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
