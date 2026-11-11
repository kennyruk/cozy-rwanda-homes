export function Brand({ light = false }: { light?: boolean }) {
  const color = light ? "#ffffff" : "#172b46";

  return (
    <span className={light ? "brand brand-light" : "brand"} aria-label="Smart Rent home">
      <svg
        viewBox="0 0 732 176"
        width="732"
        height="176"
        role="img"
        aria-label="Smart Rent"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <g fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 79 83 22l63 57" />
          <path d="M38 69v82h90V69" />
          <path d="M70 151v-47h27v47" />
        </g>
        <g fill={color} fontFamily="Arial, Helvetica, sans-serif" fontWeight="500">
          <text x="174" y="91" fontSize="76" letterSpacing="2">SMART</text>
          <text x="174" y="157" fontSize="57" fontWeight="300" letterSpacing="10">RENT</text>
        </g>
      </svg>
    </span>
  );
}
