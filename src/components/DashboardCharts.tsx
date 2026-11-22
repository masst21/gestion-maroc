'use client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatMad } from '@/lib/utils';

export default function DashboardCharts({ data }: { data: any[] }) {
  // Si aucune donnée (pas de ventes), on affiche le graphique avec des zéros
  const hasData = data.some(d => d.ca > 0 || d.nbVentes > 0);

  if (!hasData) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-400 text-sm bg-white rounded-xl border">
        Aucune vente enregistrée ces 7 derniers jours.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique 1 : CA vs Profit */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Situation financière (7 jours)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={60} />
              <Tooltip formatter={(value: any) => formatMad(value)} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="ca" name="Chiffre d'Affaires" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 2 : Nombre de ventes */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Fréquence des ventes (7 jours)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="nbVentes" name="Nombre de tickets" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}