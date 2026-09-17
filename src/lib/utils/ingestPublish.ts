// Guvenilir RSS kaynaklari icin dogrudan yayin kurali.
// Haber ancak TUM kapilar saglandiginda dogrudan yayimlanir; aksi halde
// guvenli varsayilan olarak incelemede (PENDING_REVIEW) kalir:
//  - autoPublishEligible: kaynak guvenilir (isTrustedForAutoPublish) VE
//    site genelinde aiAutoPublish modulu acik
//  - hasValidSourceDate: kaynaktan gecerli bir yayin tarihi cozuldu
//  - aiEditSucceeded: AI duzenlemesi hazirlandi ve engelleyici yasakli kelime yok
export function resolveIngestedArticleStatus(gates: {
  autoPublishEligible: boolean;
  hasValidSourceDate: boolean;
  aiEditSucceeded: boolean;
}): "PUBLISHED" | "PENDING_REVIEW" {
  const { autoPublishEligible, hasValidSourceDate, aiEditSucceeded } = gates;
  return autoPublishEligible && hasValidSourceDate && aiEditSucceeded
    ? "PUBLISHED"
    : "PENDING_REVIEW";
}
