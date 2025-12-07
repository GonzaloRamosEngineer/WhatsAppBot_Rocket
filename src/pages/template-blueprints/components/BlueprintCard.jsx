export default function BlueprintCard({ bp }) {

  async function activate() {
    const res = await fetch("/functions/v1/activate-template-blueprint", {
      method: "POST",
      body: JSON.stringify({
        blueprintId: bp.id,
        channelId: localStorage.getItem("activeChannel") // o provisto por contexto
      }),
    });

    const data = await res.json();
    alert("Plantilla enviada a Meta para aprobación");
    console.log(data);
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold">{bp.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{bp.use_case}</p>
      <p className="whitespace-pre-line text-gray-800 mb-3">{bp.body}</p>

      <button
        className="btn btn-primary"
        onClick={activate}
      >
        Activar en Meta
      </button>
    </div>
  );
}
