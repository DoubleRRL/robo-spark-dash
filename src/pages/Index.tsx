import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Car, Zap, Shield, Cpu } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <Car className="h-16 w-16 text-tesla-blue mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Tesla Robotaxi
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the future of autonomous transportation with our advanced fleet management system
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              variant="tesla" 
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="text-lg px-8 py-6"
            >
              Launch Dashboard
            </Button>
            <Button 
              variant="teslaGhost" 
              size="lg"
              className="text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-card border-border hover:border-tesla-blue/50 transition-all duration-300 shadow-card hover:shadow-tesla">
              <CardHeader className="text-center">
                <Zap className="h-8 w-8 text-tesla-blue mx-auto mb-2" />
                <CardTitle className="text-lg">Fully Electric</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Zero emissions, maximum efficiency with Tesla's cutting-edge battery technology
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:border-tesla-blue/50 transition-all duration-300 shadow-card hover:shadow-tesla">
              <CardHeader className="text-center">
                <Cpu className="h-8 w-8 text-tesla-blue mx-auto mb-2" />
                <CardTitle className="text-lg">Full Self-Driving</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Advanced AI and neural networks enable complete autonomous operation
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:border-tesla-blue/50 transition-all duration-300 shadow-card hover:shadow-tesla">
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-tesla-blue mx-auto mb-2" />
                <CardTitle className="text-lg">Ultra Safe</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Multiple redundant safety systems ensure the highest level of passenger protection
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
