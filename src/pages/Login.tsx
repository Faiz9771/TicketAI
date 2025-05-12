
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserRole } from "../types/ticket";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Shield } from "lucide-react";

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
    <div className="auth-page">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-indigo-100 dark:from-blue-900 dark:via-gray-900 dark:to-indigo-900 opacity-70"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-blue-500/10 to-transparent"></div>
      </div>
      
      <Card className="form-container glass-card animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center rounded-full">
            <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gradient">Support Ticket System</CardTitle>
          <CardDescription>Log in to your account to get started</CardDescription>
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
                className="bg-white/50 dark:bg-gray-900/50 ring-focus"
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
                className="bg-white/50 dark:bg-gray-900/50 ring-focus"
              />
            </div>
            <Button type="submit" className="w-full btn-gradient hover-scale" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col space-y-4 border-t pt-4">
          <div className="text-center text-sm text-muted-foreground">
            For demo purposes, choose a role:
          </div>
          <div className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleLogin("customer")}
              disabled={isLoading}
              className="flex-1 hover-scale bg-white/70 dark:bg-gray-800/70"
            >
              <UserPlus className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Customer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleLogin("employee")}
              disabled={isLoading}
              className="flex-1 hover-scale bg-white/70 dark:bg-gray-800/70"
            >
              <Shield className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
              Employee
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
