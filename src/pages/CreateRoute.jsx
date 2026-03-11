import React, { useState } from "react";
import { base44 } from "@/api/base44client";
import { useSiteId } from "@/lib/SiteIdContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Undo2, Save, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import PhotoUploader from "@/components/routes/PhotoUploader";
import WallCanvas from "@/components/routes/WallCanvas";
import HoldTypePicker from "@/components/routes/HoldTypePicker";
import GradeSelector from "@/components/routes/GradeSelector";

export default function CreateRoute() {
  const navigate = useNavigate();
  const { siteId } = useSiteId();
  const [step, setStep] = useState("photo"); // photo | holds | details
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [holds, setHolds] = useState([]);
  const [activeHoldType, setActiveHoldType] = useState("middle");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    grade: "",
    description: "",
    style: "boulder",
    setter_name: "",
  });

  const handleUpload = async (file) => {
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setIsUploading(false);
    setStep("holds");
  };

  const addHold = (hold) => {
    setHolds((prev) => [...prev, hold]);
  };

  const removeHold = (index) => {
    setHolds((prev) => prev.filter((_, i) => i !== index));
  };

  const updateHold = (index, updatedHold) => {
    setHolds((prev) => {
      const newHolds = [...prev];
      newHolds[index] = updatedHold;
      return newHolds;
    });
  };

  const undoLastHold = () => {
    setHolds((prev) => prev.slice(0, -1));
  };

  const handleSave = async (publish) => {
    console.log("CreateRoute: Saving - siteId:", siteId, "publish:", publish, "form:", form);
    setIsSaving(true);
    try {
      const route = await base44.entities.Route.create({
        ...form,
        wall_image_url: imageUrl,
        holds,
        published: publish,
        site_id: siteId,
      });
      console.log("CreateRoute: Route created successfully", route);
      navigate(createPageUrl("ViewRoute") + `?id=${route.id}`);
    } catch (error) {
      console.error("CreateRoute: Error saving route", error);
      setIsSaving(false);
      alert("Failed to save route: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to={createPageUrl("Home")}
            className="text-zinc-400 hover:text-white p-1 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold">
            {step === "photo" && "Upload Wall Photo"}
            {step === "holds" && "Mark Holds"}
            {step === "details" && "Route Details"}
          </span>
          <div className="w-7" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Step: Photo */}
        {step === "photo" && (
          <PhotoUploader onUpload={handleUpload} isUploading={isUploading} />
        )}

        {/* Step: Holds */}
        {step === "holds" && (
          <div className="mt-4 space-y-4">
            <WallCanvas
              imageUrl={imageUrl}
              holds={holds}
              onAddHold={addHold}
              onRemoveHold={removeHold}
              onUpdateHold={updateHold}
              activeHoldType={activeHoldType}
              interactive
            />

            <HoldTypePicker value={activeHoldType} onChange={setActiveHoldType} />

            <div className="flex gap-3">
              <button
                onClick={undoLastHold}
                disabled={holds.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={() => setStep("details")}
                disabled={holds.length === 0}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                Continue · {holds.length} holds
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="mt-4 space-y-5">
            <div className="rounded-2xl overflow-hidden">
              <WallCanvas imageUrl={imageUrl} holds={holds} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Route Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Midnight Crimp"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Your Name
                </label>
                <input
                  type="text"
                  value={form.setter_name}
                  onChange={(e) => setForm({ ...form, setter_name: e.target.value })}
                  placeholder="Route setter name"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Style
                </label>
                <div className="flex gap-2">
                  {["boulder", "sport", "trad"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, style: s, grade: "" })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        form.style === s
                          ? "bg-zinc-700 text-white"
                          : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Grade
                </label>
                <GradeSelector
                  value={form.grade}
                  onChange={(g) => setForm({ ...form, grade: g })}
                  style={form.style}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Beta / Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Any tips for sending this route..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("holds")}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={!form.name || isSaving}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={!form.name || isSaving}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}