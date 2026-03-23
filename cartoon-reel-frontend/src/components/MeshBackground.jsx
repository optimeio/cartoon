/**
 * MeshBackground.jsx
 * Fixed animated mesh gradient background that stays consistent across all screens.
 */
export default function MeshBackground() {
  return (
    <div className="mesh-bg" aria-hidden="true">
      <div className="mesh-orb mesh-orb-1" />
      <div className="mesh-orb mesh-orb-2" />
      <div className="mesh-orb mesh-orb-3" />
    </div>
  );
}
