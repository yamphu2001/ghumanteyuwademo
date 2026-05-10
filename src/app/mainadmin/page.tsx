import Link from 'next/link';

export default function AdminPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '50px' 
    }}>
      <h1>Admin Dashboard</h1>
      <p>Click below to view the system location data.</p>

      {/* Direct link to /location */}
      <Link href="/mainadmin/location">
        <button style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          📍 View Location Page
        </button>
      </Link>
    </div>
  );
}