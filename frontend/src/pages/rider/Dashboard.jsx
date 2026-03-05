const Dashboard = () => (
  <div>
    <h1>Rider Dashboard</h1>
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Today's Earnings</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$0.00</p>
      </div>
      <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Deliveries Completed</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0</p>
      </div>
    </div>
  </div>
);
export default Dashboard;