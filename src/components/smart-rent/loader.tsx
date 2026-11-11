import { Brand } from "./brand";

/** Branded loading screen shown while a route is pending. Motion is transform/opacity only. */
export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading">
      <Brand />
      <span className="page-loader-bar" aria-hidden="true" />
    </div>
  );
}
