import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Report {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, title, category, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReports(data || []);
      setFetching(false);
    };
    fetchReports();
  }, [user]);

  if (loading || !user) return null;

  const pending = reports.filter(r => r.status === "pending").length;
  const inProgress = reports.filter(r => r.status === "in_progress").length;
  const completed = reports.filter(r => r.status === "completed").length;
  const total = reports.length || 1;

  const categoryLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Banner */}
        <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Your Dashboard</h1>
          <p className="opacity-90">Track your reported road issues and see their status updates.</p>
        </div>

        {/* Quick action */}
        <div className="flex justify-center">
          <Link to="/report">
            <Button size="lg" className="h-14 px-10 text-lg gap-3 rounded-2xl shadow-lg">
              <Plus className="w-5 h-5" /> Report New Issue
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Pending", count: pending, icon: XCircle, cls: "text-warning" },
            { label: "In Progress", count: inProgress, icon: Clock, cls: "text-info" },
            { label: "Completed", count: completed, icon: CheckCircle2, cls: "text-success" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-6 text-center space-y-2">
                <s.icon className={`w-10 h-10 mx-auto ${s.cls}`} />
                <p className="text-3xl font-bold text-foreground">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Overall Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(completed / total) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {completed} of {reports.length} issues resolved ({reports.length > 0 ? Math.round((completed / total) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        {/* Reports table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Your Reports</CardTitle></CardHeader>
          <CardContent>
            {fetching ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No reports yet. Report your first road issue!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2 text-foreground">{r.title}</td>
                        <td className="py-3 px-2 text-muted-foreground">{categoryLabel(r.category)}</td>
                        <td className="py-3 px-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-2"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
