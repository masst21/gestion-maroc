'use client';

export default function LogoutButton({ label = 'Déconnexion' }: { label?: string }) {
  async function handleLogout(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <form onSubmit={handleLogout}>
      <button 
        type="submit" 
        className="store-logout w-full text-start text-sm px-3 py-2 rounded-lg hover:bg-blue-800 text-red-300"
      >
        🚪 {label}
      </button>
    </form>
  );
}