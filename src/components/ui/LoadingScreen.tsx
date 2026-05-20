import cutsLogo from '../../assets/cuts_logo.png'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--s-bg)]">
      <img src={cutsLogo} alt="CUTS" className="w-16 h-16 mb-4" />
      <div className="auth-spinner" />
    </div>
  );
}
