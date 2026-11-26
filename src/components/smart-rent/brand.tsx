import logoAsset from "../../assets/smart-rent-logo.png";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={light ? "brand brand-light" : "brand"} aria-label="Smart Rent home">
      <img src={logoAsset} alt="Smart Rent" width="732" height="176" />
    </span>
  );
}