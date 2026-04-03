import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, FileText } from "lucide-react";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  location_text: string | null;
  state: string | null;
  city: string | null;
}

const AIAnalyzer = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, title, description, category, location_text, state, city")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReports(data || []);
      setFetching(false);
    };
    fetch();
  }, [user]);

  const generateReport = async (report: Report) => {
    setSelectedReport(report);
    setGenerating(true);
    setGeneratedLetter("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-letter", {
        body: {
          title: report.title,
          description: report.description,
          category: report.category.replace(/_/g, " "),
          location: report.location_text || "Not specified",
          state: report.state || "Not specified",
          city: report.city || "Not specified",
        },
      });

      if (error) throw error;
      setGeneratedLetter(data.letter);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate letter", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const categoryLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">AI Report Analyzer</h1>
        </div>
        <p className="text-muted-foreground">
          Select a report to generate a formal government-style letter for municipal authorities.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Report list */}
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Your Reports</h2>
            {fetching ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : reports.length === 0 ? (
              <p className="text-muted-foreground">No reports. Submit a report first.</p>
            ) : (
              reports.map(r => (
                <Card
                  key={r.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedReport?.id === r.id ? "border-primary ring-2 ring-primary/20" : ""}`}
                  onClick={() => setSelectedReport(r)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground">{categoryLabel(r.category)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Generated letter */}
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Generated Letter</h2>
            {selectedReport && (
              <Button onClick={() => generateReport(selectedReport)} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {generating ? "Generating..." : "Generate AI Report"}
              </Button>
            )}
            {generatedLetter ? (
              <Card>
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                    {generatedLetter}
                  </pre>
                </CardContent>
              </Card>
            ) : !selectedReport ? (
              <p className="text-muted-foreground text-sm">Select a report from the left to get started.</p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAnalyzer;
