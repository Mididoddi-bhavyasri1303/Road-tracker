import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, BarChart3, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">RoadTracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link>
            <Link to="/signup"><Button size="sm">Sign Up</Button></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Report Road Issues.<br />
              <span className="text-primary">Build Better Roads.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              RoadTracker empowers citizens to report potholes, open manholes, flood damage, and more. Track your reports and see real progress.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/signup"><Button size="lg" className="px-8">Get Started</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="px-8">Sign In</Button></Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-accent/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center text-foreground mb-10">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: AlertTriangle, title: "Report Issues", desc: "Submit road problems with photos and location" },
                { icon: MapPin, title: "Map Location", desc: "Auto-detect or manually select location on map" },
                { icon: BarChart3, title: "Track Progress", desc: "Monitor repair status from pending to completed" },
                { icon: Shield, title: "Admin Action", desc: "Authorities update status and generate reports" },
              ].map(f => (
                <div key={f.title} className="bg-card rounded-xl p-6 text-center space-y-3 border">
                  <f.icon className="w-10 h-10 mx-auto text-primary" />
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
            <p className="text-muted-foreground">
              To create a transparent system where every pothole gets fixed and every road is safe. We believe citizens and authorities working together can transform infrastructure.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} RoadTracker. Built for better roads.
      </footer>
    </div>
  );
};

export default Index;
