import React from "react";
import Icon from "../../../components/AppIcon";

const categoryColors = {
  MARKETING: "bg-blue-100 text-blue-700 border-blue-300",
  UTILITY: "bg-emerald-100 text-emerald-700 border-emerald-300",
  AUTHENTICATION: "bg-purple-100 text-purple-700 border-purple-300",
  SERVICE: "bg-orange-100 text-orange-700 border-orange-300",
};

const statusColors = {
  APPROVED: "bg-green-100 text-green-700 border-green-300",
  REJECTED: "bg-red-100 text-red-700 border-red-300",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
  IN_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-300",
};


export default function TemplatesListCard({ templates }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Plantillas sincronizadas
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: {templates.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 text-left font-medium">Nombre</th>
              <th className="py-2 text-left font-medium">Categoría</th>
              <th className="py-2 text-left font-medium">Idioma</th>
              <th className="py-2 text-left font-medium">Estado</th>
              <th className="py-2 text-left font-medium">Última sync</th>
            </tr>
          </thead>

          <tbody>
            {templates.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border hover:bg-muted/30 transition"
              >
                {/* NOMBRE */}
                <td className="py-2 font-medium text-foreground">
                  {t.name}
                </td>

                {/* CATEGORÍA */}
                <td className="py-2">
                  <span
                    className={`
                      text-xs px-2 py-1 rounded border
                      ${
                        categoryColors[t.category] ||
                        "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    `}
                  >
                    {t.category}
                  </span>
                </td>

                {/* IDIOMA */}
                <td className="py-2 text-muted-foreground">
                  {t.language}
                </td>

                {/* ESTADO */}
                <td className="py-2">
                  <span
                    className={`
                      text-xs px-2 py-1 rounded border font-medium
                      ${
                        statusColors[t.status] ||
                        "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    `}
                  >
                    {t.status}
                  </span>
                </td>

                {/* FECHA */}
                <td className="py-2 text-muted-foreground">
                  {t.last_synced_at
                    ? new Date(t.last_synced_at).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {templates.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No hay plantillas sincronizadas aún.
          <br />
          Hacé clic en <strong>“Sincronizar plantillas”</strong> para cargar las de Meta.
        </div>
      )}
    </div>
  );
}
