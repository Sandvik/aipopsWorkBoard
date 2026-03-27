// Simpelt header-bånd der viser fejl- og info-beskeder.
// Selve beskedernes indhold og varighed styres i App.tsx.
type AppHeaderProps = {
  error: string;
  message: string;
};

export function AppHeader({ error, message }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-main" />
      <div className="app-header-toolbar">
        {error ? <div className="error-banner">{error}</div> : null}
        {message ? <div className="notice-banner">{message}</div> : null}
      </div>
    </header>
  );
}

