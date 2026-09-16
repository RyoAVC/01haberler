export function BrandCampaign({ brand, compact = false }: { brand: "avci" | "adana"; compact?: boolean }) {
  const avci = brand === "avci";
  return <aside aria-label={`${avci ? "Avcı E-Ticaret" : "Adana360"} reklamı`} className={`brand-campaign ${avci ? "campaign-avci" : "campaign-adana"} ${compact ? "campaign-compact" : ""}`}>
    <span className="campaign-disclosure">REKLAM</span>
    <a href={avci ? "https://avcieticaret.com" : "https://adana360.com"} target="_blank" rel="noopener noreferrer sponsored" className="campaign-link">
      <span className="campaign-brand">{avci ? <>AVCI<span>E-TİCARET</span></> : <>adana<span className="campaign-360">360°</span></>}</span>
      <span className="campaign-art" aria-hidden="true">{avci ? <><i /><i /><i /><b>↗</b></> : <><i /><i /><i /><b>01</b></>}</span>
      <strong className="campaign-title">{avci ? <>Yeni bir<br />keşfe çık.</> : <>Şehre başka<br />bir açıdan bak.</>}</strong>
      <span className="campaign-caption">{avci ? "Avcı E-Ticaret dünyasını keşfet." : "Adana360 ile şehri keşfet."}</span>
      <span className="campaign-cta">{avci ? "Siteyi keşfet" : "Adana360’a git"}<span aria-hidden>↗</span></span>
      <span className="campaign-domain">{avci ? "avcieticaret.com" : "adana360.com"}</span>
    </a>
  </aside>;
}
