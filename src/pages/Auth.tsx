import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsFlipping(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img src={logo} alt="Entoto Polytechnic College" className="h-20 w-auto" />
        </Link>

        <div className="perspective-1000">
          <Card
            className={`p-8 transition-all duration-300 ${
              isFlipping ? "scale-95 opacity-0 rotate-y-90" : "scale-100 opacity-100"
            }`}
          >
            {isLogin ? (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your.email@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" />
                  </div>
                  <Button className="w-full" size="lg">
                    Login
                  </Button>
                </form>
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={handleFlip} className="text-primary font-medium hover:underline">
                    Sign Up
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" type="text" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="your.email@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="••••••••" />
                  </div>
                  <Button className="w-full" size="lg">
                    Sign Up
                  </Button>
                </form>
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={handleFlip} className="text-primary font-medium hover:underline">
                    Login
                  </button>
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
