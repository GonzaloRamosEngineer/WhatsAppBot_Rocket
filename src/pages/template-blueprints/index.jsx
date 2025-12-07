import { useEffect, useState } from "react";
import BlueprintCard from "./components/BlueprintCard";
import { supabase } from "../../lib/supabaseClient";

export default function TemplateBlueprintsPage() {
  const [blueprints, setBlueprints] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("template_blueprints").select("*");
    setBlueprints(data || []);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Plantillas sugeridas</h2>

      <div className="grid grid-cols-1 gap-4">
        {blueprints.map(bp => (
          <BlueprintCard key={bp.id} bp={bp} />
        ))}
      </div>
    </div>
  );
}
