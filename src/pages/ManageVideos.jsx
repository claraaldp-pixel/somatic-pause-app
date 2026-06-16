import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Upload, Link, ChevronLeft, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";

const STATE_LABELS = {
  fight: { label: "Fight", emoji: "🔥" },
  flight: { label: "Flight", emoji: "💨" },
  freeze: { label: "Freeze", emoji: "🧊" },
  fawn: { label: "Fawn", emoji: "🫶" },
  safe: { label: "Safe", emoji: "🌿" },
};

export default function ManageVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ exercise_id: "", survival_state: "", exercise_title: "", video_url: "", video_type: "youtube" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allExercises, setAllExercises] = useState([]);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id, title, survival_state, category')
      .order('survival_state')
      .order('category_order')
      .order('exercise_order')
      .then(({ data }) => setAllExercises(data || []));
  }, []);

  const loadVideos = async () => {
    const { data } = await supabase
      .from('exercise_videos')
      .select('*')
      .order('created_at', { ascending: false });
    setVideos(data || []);
    setLoading(false);
  };

  const handleExerciseChange = (exerciseId) => {
    const ex = allExercises.find((e) => e.id === exerciseId);
    if (ex) {
      setForm((f) => ({ ...f, exercise_id: exerciseId, survival_state: ex.survival_state, exercise_title: ex.title }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('exercise-videos')
      .upload(fileName, file);

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(fileName);
      setForm((f) => ({ ...f, video_url: publicUrl, video_type: 'upload' }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.exercise_id || !form.video_url) return;
    setSaving(true);
    await supabase.from('exercise_videos').insert(form);
    await loadVideos();
    setForm({ exercise_id: "", survival_state: "", exercise_title: "", video_url: "", video_type: "youtube" });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('exercise_videos').delete().eq('id', id);
    setVideos((v) => v.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20">
      <nav className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto">
        <a href={createPageUrl("Home")} className="flex items-center gap-1 text-[#9C8878] text-sm hover:text-[#4A3728] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to app
        </a>
        <h1 className="text-sm font-semibold text-[#4A3728]">Manage Videos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#4A3728] text-white rounded-xl px-4 py-2 text-xs font-medium hover:bg-[#3A2A1E] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add video
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white rounded-2xl p-6 border border-[#EDE8E2] shadow-sm mb-6"
            >
              <h2 className="text-base font-semibold text-[#4A3728] mb-5">Add a video</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#9C8878] font-medium mb-1.5 block">Exercise</label>
                  <select
                    value={form.exercise_id}
                    onChange={(e) => handleExerciseChange(e.target.value)}
                    className="w-full border border-[#EDE8E2] rounded-xl px-3 py-2.5 text-sm text-[#4A3728] bg-white outline-none focus:border-[#C5A882]"
                  >
                    <option value="">Select an exercise...</option>
                    {Object.entries(STATE_LABELS).map(([state, info]) => {
                      const stateExercises = allExercises.filter((ex) => ex.survival_state === state);
                      if (stateExercises.length === 0) return null;
                      return (
                        <optgroup key={state} label={`${info.emoji} ${info.label}`}>
                          {stateExercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.title}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#9C8878] font-medium mb-1.5 block">Video source</label>
                  <div className="flex gap-2">
                    {["youtube", "vimeo", "upload"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setForm((f) => ({ ...f, video_type: type, video_url: "" }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors capitalize ${
                          form.video_type === type
                            ? "bg-[#4A3728] text-white border-[#4A3728]"
                            : "bg-white text-[#9C8878] border-[#EDE8E2] hover:border-[#C5A882]"
                        }`}
                      >
                        {type === "upload" ? "Upload file" : type}
                      </button>
                    ))}
                  </div>
                </div>

                {form.video_type !== "upload" ? (
                  <div>
                    <label className="text-xs text-[#9C8878] font-medium mb-1.5 block">
                      <Link className="inline w-3 h-3 mr-1" />
                      {form.video_type === "youtube" ? "YouTube URL" : "Vimeo URL"}
                    </label>
                    <input
                      type="url"
                      value={form.video_url}
                      onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                      placeholder={form.video_type === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."}
                      className="w-full border border-[#EDE8E2] rounded-xl px-3 py-2.5 text-sm text-[#4A3728] outline-none focus:border-[#C5A882]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-[#9C8878] font-medium mb-1.5 block">
                      <Upload className="inline w-3 h-3 mr-1" />
                      Upload video file
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#EDE8E2] rounded-xl cursor-pointer hover:border-[#C5A882] transition-colors">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-[#C5A882] animate-spin" />
                      ) : form.video_url ? (
                        <span className="text-xs text-[#1A5A1A] font-medium">✓ Video uploaded</span>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-[#BEB0A5] mb-1" />
                          <span className="text-xs text-[#BEB0A5]">Click to upload MP4, MOV, WebM</span>
                        </>
                      )}
                      <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-[#EDE8E2] text-[#9C8878] rounded-xl py-2.5 text-sm hover:border-[#C5A882] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.exercise_id || !form.video_url || saving}
                    className="flex-1 bg-[#4A3728] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#3A2A1E] transition-colors disabled:opacity-40"
                  >
                    {saving ? "Saving..." : "Save video"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-20 border border-[#EDE8E2] animate-pulse" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-[#9C8878] font-light text-sm">No videos added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((v, i) => {
              const info = STATE_LABELS[v.survival_state] || {};
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-4 border border-[#EDE8E2] shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{info.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#4A3728] truncate">{v.exercise_title || v.exercise_id}</p>
                      <p className="text-xs text-[#BEB0A5] capitalize">{info.label} · {v.video_type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-[#BEB0A5] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
