// C:\Projects\WhatsAppBot_Rocket\src\pages\template-blueprints\index.jsx

import { useEffect, useState } from "react";
import BlueprintCard from "./components/BlueprintCard";
import { supabase } from "../../lib/supabaseClient";
import Icon from "../../components/AppIcon";

export default function TemplateBlueprintsPage() {
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("template_blueprints").select("*").order("sector", { ascending: true });
    setBlueprints(data || []);
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Template Library</h2>
        <p className="text-slate-500">
          Ready-to-use templates approved for common use cases. Select one to activate it instantly on your WhatsApp account.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
               <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((bp) => (
            <BlueprintCard key={bp.id} bp={bp} />
          ))}
        </div>
      )}
    </div>
  );
}