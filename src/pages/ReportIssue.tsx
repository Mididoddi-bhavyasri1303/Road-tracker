import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, MapPin, Loader2 } from "lucide-react";

const categories = [
  { value: "pothole", label: "Pothole" },
  { value: "open_manhole", label: "Open Manhole" },
  { value: "flood_damage", label: "Flood Damage" },
  { value: "road_block", label: "Road Block" },
  { value: "road_sign", label: "Road Sign Problem" },
  { value: "damaged_road", label: "Damaged Road" },
  { value: "other", label: "Other" },
];

const ReportIssue = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("pothole");
  const [locationText, setLocationText] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [reporterSignature, setReporterSignature] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationText(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setDetecting(false);
        toast({ title: "Location detected", description: "Your current location has been set." });
      },
      () => {
        setDetecting(false);
        toast({ title: "Error", description: "Could not detect location", variant: "destructive" });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("report-images").upload(path, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("report-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("reports").insert({
      user_id: user.id,
      title,
      description,
      category: category as any,
      location_text: locationText || null,
      latitude: lat,
      longitude: lng,
      image_url: imageUrl,
      address_line1: addressLine1 || null,
      address_line2: addressLine2 || null,
      state: state || null,
      district: district || null,
      city: district || null,
      reporter_name: reporterName || null,
      reporter_contact: reporterContact || null,
      reporter_signature: reporterSignature || null,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report submitted!", description: "Your road issue has been reported." });
      navigate("/dashboard");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Report a Road Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Reporter Details */}
              <div className="space-y-4 p-4 border border-input rounded-lg bg-muted/30">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  👤 Your Details (for formal letter)
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="reporterName">Full Name *</Label>
                  <Input id="reporterName" placeholder="Your full name" value={reporterName} onChange={e => setReporterName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporterContact">Contact Number *</Label>
                  <Input id="reporterContact" placeholder="e.g. +91 9876543210" value={reporterContact} onChange={e => setReporterContact(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporterSignature">Signature / Designation</Label>
                  <Input id="reporterSignature" placeholder="e.g. Concerned Citizen / Ward Member" value={reporterSignature} onChange={e => setReporterSignature(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g. Large pothole on MG Road" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat">Category</Label>
                <select
                  id="cat"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Address Section */}
              <div className="space-y-4 p-4 border border-input rounded-lg bg-muted/30">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Address Details
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="addr1">Address Line 1 *</Label>
                  <Input id="addr1" placeholder="Street name, road number, landmark" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr2">Address Line 2</Label>
                  <Input id="addr2" placeholder="Area, locality (optional)" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Input id="district" placeholder="e.g. Hyderabad" value={district} onChange={e => setDistrict(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" placeholder="e.g. Telangana" value={state} onChange={e => setState(e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="border-2 border-dashed border-input rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      <Button type="button" variant="outline" size="sm" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload an image</p>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* GPS Location */}
              <div className="space-y-2">
                <Label htmlFor="loc">GPS Location (optional)</Label>
                <div className="flex gap-2">
                  <Input id="loc" placeholder="Auto-detect your coordinates" value={locationText} onChange={e => setLocationText(e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" onClick={detectLocation} disabled={detecting}>
                    {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReportIssue;
