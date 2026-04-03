import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, XCircle, Search, ChevronLeft, ChevronRight, MapPin, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location_text: string | null;
  state: string | null;
  city: string | null;
  district: string | null;
  address_line1: string | null;
  address_line2: string | null;
  reporter_name: string | null;
  reporter_contact: string | null;
  reporter_signature: string | null;
  image_url: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;
const PIE_COLORS = [
  "hsl(168, 72%, 29%)", "hsl(45, 93%, 58%)", "hsl(0, 72%, 51%)",
  "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(280, 60%, 50%)", "hsl(30, 80%, 50%)",
];

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<"reports" | "analytics" | "states" | "ai">("reports");
  const [generatingLetter, setGeneratingLetter] = useState<string | null>(null);
  const [generatedLetters, setGeneratedLetters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/admin");
  }, [user, isAdmin, loading, navigate]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports((data as Report[]) || []);
    setFetching(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchReports();
  }, [user, isAdmin]);

  const updateStatus = async (id: string, newStatus: "pending" | "in_progress" | "completed") => {
    const { error } = await supabase.from("reports").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("admin.statusUpdated") });
      fetchReports();
      if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, status: newStatus });
    }
  };

  const generateLetter = async (report: Report) => {
    setGeneratingLetter(report.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-letter", {
        body: {
          title: report.title,
          description: report.description,
          category: report.category.replace(/_/g, " "),
          location: report.location_text || "Not specified",
          state: report.state || "Not specified",
          city: report.city || report.district || "Not specified",
          district: report.district || "Not specified",
          address_line1: report.address_line1 || "Not specified",
          address_line2: report.address_line2 || "",
          reporter_name: report.reporter_name || "Not specified",
          reporter_contact: report.reporter_contact || "Not specified",
          reporter_signature: report.reporter_signature || "Concerned Citizen",
        },
      });
      if (error) throw error;
      setGeneratedLetters(prev => ({ ...prev, [report.id]: data.letter }));
    } catch (err: any) {
      toast({ title: t("admin.error"), description: err.message || "Failed to generate letter", variant: "destructive" });
    } finally {
      setGeneratingLetter(null);
    }
  };

  const categoryLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  // State & district groups
  const stateGroups = useMemo(() => {
    const groups: Record<string, Report[]> = {};
    reports.forEach(r => {
      const st = r.state || "Unknown";
      if (!groups[st]) groups[st] = [];
      groups[st].push(r);
    });
    return groups;
  }, [reports]);

  const districtGroups = useMemo(() => {
    const groups: Record<string, Report[]> = {};
    reports.forEach(r => {
      const d = r.district || r.city || "Unknown";
      if (!groups[d]) groups[d] = [];
      groups[d].push(r);
    });
    return groups;
  }, [reports]);

  const uniqueStates = useMemo(() => Object.keys(stateGroups).sort(), [stateGroups]);
  const uniqueDistricts = useMemo(() => Object.keys(districtGroups).sort(), [districtGroups]);

  const filtered = useMemo(() => reports.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      (r.location_text || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.address_line1 || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.district || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchState = stateFilter === "all" || (r.state || "Unknown") === stateFilter;
    const matchDistrict = districtFilter === "all" || (r.district || r.city || "Unknown") === districtFilter;
    return matchSearch && matchStatus && matchState && matchDistrict;
  }), [reports, search, statusFilter, stateFilter, districtFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageReports = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const pending = reports.filter(r => r.status === "pending").length;
  const inProgress = reports.filter(r => r.status === "in_progress").length;
  const completed = reports.filter(r => r.status === "completed").length;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: categoryLabel(name), value }));
  }, [reports]);

  const trendData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    reports.forEach(r => {
      const day = r.created_at.slice(0, 10);
      if (days[day] !== undefined) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    }));
  }, [reports]);

  if (loading || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.dashboard")}</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: t("admin.total"), count: reports.length, cls: "text-foreground" },
            { label: t("admin.pending"), count: pending, icon: XCircle, cls: "text-warning" },
            { label: t("admin.inProgress"), count: inProgress, icon: Clock, cls: "text-info" },
            { label: t("admin.completed"), count: completed, icon: CheckCircle2, cls: "text-success" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2 overflow-x-auto">
          {(["reports", "analytics", "states", "ai"] as const).map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="whitespace-nowrap"
            >
              {tab === "reports" && t("admin.total")}
              {tab === "analytics" && t("admin.reportAnalytics")}
              {tab === "states" && t("admin.stateAnalyzer")}
              {tab === "ai" && "AI Letter Generator"}
            </Button>
          ))}
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.categoryBreakdown")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("admin.recentTrend")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={trendData}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(168, 72%, 29%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* State Analyzer Tab */}
        {activeTab === "states" && (
          <div className="space-y-6">
            {/* State-wise */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {t("admin.stateAnalyzer")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t("admin.stateAnalyzerDesc")}</p>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniqueStates.map(state => {
                    const stateReports = stateGroups[state];
                    const statePending = stateReports.filter(r => r.status === "pending").length;
                    const stateInProg = stateReports.filter(r => r.status === "in_progress").length;
                    const stateDone = stateReports.filter(r => r.status === "completed").length;
                    // Districts within this state
                    const stateDistricts: Record<string, number> = {};
                    stateReports.forEach(r => {
                      const d = r.district || r.city || "Unknown";
                      stateDistricts[d] = (stateDistricts[d] || 0) + 1;
                    });
                    return (
                      <Card key={state} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{state}</h3>
                            <span className="text-lg font-bold text-primary">{stateReports.length}</span>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <span className="text-warning">⏳ {statePending}</span>
                            <span className="text-info">🔄 {stateInProg}</span>
                            <span className="text-success">✅ {stateDone}</span>
                          </div>
                          {Object.keys(stateDistricts).length > 0 && (
                            <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                              <p className="font-medium">Districts:</p>
                              {Object.entries(stateDistricts).sort((a, b) => b[1] - a[1]).map(([d, c]) => (
                                <span key={d} className="inline-block mr-2 px-2 py-0.5 rounded bg-accent text-accent-foreground">{d}: {c}</span>
                              ))}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => { setStateFilter(state); setActiveTab("reports"); }}
                          >
                            {t("admin.viewReports")}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Letter Generator Tab */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  AI Formal Letter Generator
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Analyze user reports and generate formal complaint letters to municipal authorities.
                </p>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <select
                    value={stateFilter}
                    onChange={e => setStateFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">{t("admin.allStates")}</option>
                    {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={districtFilter}
                    onChange={e => setDistrictFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All Districts</option>
                    {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  {filtered.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("admin.noReports")}</p>
                  ) : (
                    filtered.slice(0, 20).map(report => (
                      <Card key={report.id} className="border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{report.title}</h4>
                              <p className="text-sm text-muted-foreground">{categoryLabel(report.category)}</p>
                              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                {report.address_line1 && <p>📍 {report.address_line1}{report.address_line2 ? `, ${report.address_line2}` : ""}</p>}
                                {(report.district || report.state) && (
                                  <p>🏛️ {[report.district, report.state].filter(Boolean).join(", ")}</p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={report.status} />
                              <Button
                                size="sm"
                                onClick={() => generateLetter(report)}
                                disabled={generatingLetter === report.id}
                                className="gap-1"
                              >
                                {generatingLetter === report.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileText className="w-3 h-3" />
                                )}
                                {generatingLetter === report.id ? "Generating..." : "Generate Letter"}
                              </Button>
                            </div>
                          </div>

                          {generatedLetters[report.id] && (
                            <div className="mt-3 p-4 bg-muted/50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-foreground">Generated Formal Letter</h5>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedLetters[report.id]);
                                    toast({ title: "Copied to clipboard" });
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                                {generatedLetters[report.id]}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t("admin.searchReports")} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">{t("admin.allStatus")}</option>
                <option value="pending">{t("admin.pending")}</option>
                <option value="in_progress">{t("admin.inProgress")}</option>
                <option value="completed">{t("admin.completed")}</option>
              </select>
              <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(0); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">{t("admin.allStates")}</option>
                {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setPage(0); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All Districts</option>
                {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <Card>
              <CardContent className="p-0">
                {fetching ? (
                  <p className="text-center text-muted-foreground py-8">{t("admin.loading")}</p>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t("admin.noReports")}</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("admin.title_col")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("admin.category")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">District</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">{t("admin.date")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("admin.status")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("admin.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageReports.map(r => (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-4 text-foreground">{r.title}</td>
                              <td className="py-3 px-4 text-muted-foreground">{categoryLabel(r.category)}</td>
                              <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{r.district || r.city || "—"}</td>
                              <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{new Date(r.created_at).toLocaleDateString()}</td>
                              <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                              <td className="py-3 px-4">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => setSelectedReport(r)}>{t("admin.view")}</Button>
                                  {r.status === "pending" && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "in_progress")}>{t("admin.toInProgress")}</Button>
                                  )}
                                  {r.status === "in_progress" && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "completed")}>{t("admin.toComplete")}</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-sm text-muted-foreground">{t("admin.page")} {page + 1} {t("admin.of")} {totalPages}</p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Detail modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
            <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>{selectedReport.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <StatusBadge status={selectedReport.status} />
                  <span className="text-sm text-muted-foreground">{categoryLabel(selectedReport.category)}</span>
                </div>
                <p className="text-sm text-foreground">{selectedReport.description || t("admin.noDescription")}</p>
                {selectedReport.address_line1 && (
                  <div className="text-sm text-muted-foreground">
                    <p>📍 {selectedReport.address_line1}</p>
                    {selectedReport.address_line2 && <p>&nbsp;&nbsp;&nbsp;{selectedReport.address_line2}</p>}
                  </div>
                )}
                {(selectedReport.district || selectedReport.state) && (
                  <p className="text-sm text-muted-foreground">
                    🏛️ {[selectedReport.district, selectedReport.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {selectedReport.location_text && (
                  <p className="text-sm text-muted-foreground">📌 GPS: {selectedReport.location_text}</p>
                )}
                {selectedReport.image_url && (
                  <img src={selectedReport.image_url} alt="Report" className="rounded-lg max-h-64 w-full object-cover" />
                )}
                <p className="text-xs text-muted-foreground">{new Date(selectedReport.created_at).toLocaleString()}</p>
                <div className="flex gap-2 pt-2 flex-wrap">
                  {selectedReport.status === "pending" && (
                    <Button size="sm" onClick={() => updateStatus(selectedReport.id, "in_progress")}>{t("admin.markInProgress")}</Button>
                  )}
                  {selectedReport.status === "in_progress" && (
                    <Button size="sm" onClick={() => updateStatus(selectedReport.id, "completed")}>{t("admin.markCompleted")}</Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generateLetter(selectedReport)}
                    disabled={generatingLetter === selectedReport.id}
                    className="gap-1"
                  >
                    {generatingLetter === selectedReport.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    Generate Letter
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedReport(null)}>{t("admin.close")}</Button>
                </div>
                {generatedLetters[selectedReport.id] && (
                  <div className="mt-3 p-4 bg-muted/50 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                      {generatedLetters[selectedReport.id]}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
