
console.log("DEBUG: /src/app/(authenticated)/page.tsx - FILE PARSED");

export default function DashboardPage() {
  console.log("DEBUG: /src/app/(authenticated)/page.tsx - DashboardPage FUNCTION CALLED");
  return (
    <div style={{ border: '10px solid cyan', padding: '20px', backgroundColor: 'lightcyan' }}>
      <h1 style={{ color: 'blue', fontSize: '2em' }}>DEBUG: DASHBOARD PAGE MINIMAL</h1>
      <p style={{ color: 'blue' }}>Esta é a página do painel ultra simplificada.</p>
    </div>
  );
}
