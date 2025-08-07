
import { useState, useEffect } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

const levels = [
  {
    level: 1,
    title: "El Forjador de Máquinas",
    description: "Domina Proxmox, la consola, y automatiza lo básico.",
    tasks: [
      "Crea 3 VMs manualmente desde la GUI y desde la CLI.",
      "Automatiza la creación de una VM con cloud-init.",
      "Explora pvesh y haz un script que te liste el estado de todas las VMs.",
      "Configura backups programados (vzdump) + snapshots automáticos.",
      "Instala un contenedor LXC optimizado (ej: Alpine o Debian mínimo).",
      "Bonus: Script bash que clona una VM base, la renombra y la lanza."
    ],
  },
  {
    level: 2,
    title: "VPN del Viajero",
    description: "Despliega y configura una VPN segura para acceder a tu Proxmox desde cualquier lugar.",
    tasks: [
      "Instala y configura WireGuard en un contenedor o VM.",
      "Asegura acceso remoto solo desde claves públicas conocidas.",
      "Testea la conexión desde fuera de tu red local.",
      "Crea un QR para añadir el túnel desde el móvil fácilmente.",
      "Automatiza la creación de nuevos peers con un script."
    ]
  },
];

const STORAGE_KEY = "retogame-progress";

export default function Home() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggleTask = (levelIdx, taskIdx) => {
    const key = `l${levelIdx}-t${taskIdx}`;
    setProgress((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Reto Admin Proxmox</h1>
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold">
            Nivel {levels[currentLevel].level}: {levels[currentLevel].title}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {levels[currentLevel].description}
          </p>
          <ul className="list-disc list-inside space-y-2">
            {levels[currentLevel].tasks.map((task, i) => {
              const key = `l${currentLevel}-t${i}`;
              const completed = progress[key];
              return (
                <li
                  key={i}
                  onClick={() => toggleTask(currentLevel, i)}
                  className={`cursor-pointer ${completed ? "line-through text-green-600" : ""}`}
                >
                  {task}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentLevel(Math.max(currentLevel - 1, 0))}
          disabled={currentLevel === 0}
        >
          Nivel anterior
        </Button>
        <Button
          onClick={() =>
            setCurrentLevel(Math.min(currentLevel + 1, levels.length - 1))
          }
          disabled={currentLevel === levels.length - 1}
        >
          Siguiente nivel
        </Button>
      </div>
    </div>
  );
}
