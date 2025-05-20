
// Copied from src/app/(authenticated)/page.tsx and kept simplified
console.log("DEBUG: /src/app/(authenticated)/dashboard/page.tsx - FILE PARSED");

export default function DashboardPage() {
  console.log("DEBUG: /src/app/(authenticated)/dashboard/page.tsx - DashboardPage FUNCTION CALLED");
  return (
    <div style={{ border: '10px solid fuchsia', padding: '20px', backgroundColor: 'lightpink' }}>
      <h1 style={{ color: 'purple', fontSize: '2em' }}>DEBUG: DASHBOARD PAGE (MOVED TO /dashboard) MINIMAL</h1>
      <p style={{ color: 'purple' }}>Esta é a página do painel ultra simplificada em /dashboard.</p>
    </div>
  );
}
