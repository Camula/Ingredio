export default function AccountTab({ email }) {
  return (
    <div className="panel">
      <h2>Konto</h2>

      <div className="account-box">
        <div className="dashboard-line">
          <span>Email:</span>
          <strong>{email}</strong>
        </div>
      </div>

      <div className="empty-box">
        Ustawienia i motyw dodamy w kolejnym kroku.
      </div>
    </div>
  );
}