/**
 * Kiosk-mode string tables for C.3 localization.
 *
 * Five languages cover the primary HK FDH cohorts plus the smaller plan-
 * specified Malay community: English (baseline), Filipino (Tagalog),
 * Bahasa Indonesia, Bahasa Malaysia, Cantonese (Traditional + colloquial
 * particles where natural).
 *
 * **AI-generated baseline.** These translations are LLM-produced from the
 * English source and have NOT yet been reviewed by a native speaker from
 * the target community. The kiosk reality row in /about explicitly flags
 * this. Native-speaker review is gated on the C.4 outreach replies (per
 * docs/outreach/README.md). Until then, the v1 kiosk localization is a
 * scaffold + honest disclosure, not a production-quality translation.
 *
 * Scope is deliberately narrow — only the kiosk-specific copy (welcome
 * screen + 4 step titles/details + receipt-confirmation lines + reset
 * CTA). The rest of the app stays English on the assumption that judges
 * + technical operators read English. C.5 mitigates illiteracy
 * specifically at the drop-in centre touch-point.
 */

export type Locale = "en" | "fil" | "id" | "ms" | "yue";

export type KioskStrings = {
  // Welcome screen
  welcomeKicker: string;
  welcomeTitleA: string;
  welcomeTitleB: string;
  welcomeBody: string;
  welcomeCTA: string;
  welcomeFooter: string;

  // Active flow header
  flowKicker: string;
  flowTitle: string;
  flowTitleItalic: string;

  // Step 1: Sign in
  step1Title: string;
  step1Detail: string;

  // Step 2: Mint agent
  step2Title: string;
  step2Detail: string;

  // Step 3: Issue credential
  step3Title: string;
  step3Detail: string;

  // Step 4: Request eligibility
  step4Title: string;
  step4Detail: string;

  // Done screen
  doneStatus: string;
  doneTitleA: string;
  doneTitleItalic: string;
  doneTitleB: string;
  doneReceiptLabel: string;
  doneReceiptIdLabel: string;
  doneBody: string;
  doneReset: string;

  // Common
  cancelOver: string;
  stepDone: string;
};

const en: KioskStrings = {
  welcomeKicker: "Welcome",
  welcomeTitleA: "Prove you qualify for help.",
  welcomeTitleB: "Without giving up your name.",
  welcomeBody: "This kiosk creates a private receipt the clinic can show under any request — even a subpoena. The receipt proves you qualified. It does not say who you are.",
  welcomeCTA: "Touch to start →",
  welcomeFooter: "Operated by HELP for Domestic Workers · Compass v1 demo · No information leaves this device without your consent.",
  flowKicker: "HELP for Domestic Workers · Eligibility Check",
  flowTitle: "Three steps.",
  flowTitleItalic: "Private.",
  step1Title: "Sign in",
  step1Detail: "Email login. We send a one-time code. No password, no personal information stored.",
  step2Title: "Create your private agent",
  step2Detail: "A one-time setup. The agent acts on your behalf so the clinic never sees your name, your HKID, or your documents.",
  step3Title: "Prove you qualify",
  step3Detail: "The agent checks your eligibility and prints a receipt. The receipt is the only thing the clinic ever sees about you.",
  step4Title: "Get your receipt",
  step4Detail: "The receipt shows the clinic only that you qualified — nothing else. Show it at the intake desk.",
  doneStatus: "✓ Eligibility confirmed",
  doneTitleA: "Show this to the",
  doneTitleItalic: "intake desk",
  doneTitleB: ".",
  doneReceiptLabel: "Receipt",
  doneReceiptIdLabel: "Receipt ID",
  doneBody: "The clinic can verify this receipt on the 0G blockchain. Only that you qualified — at this time bucket — is recorded. Nothing about you.",
  doneReset: "Done — start over for next visitor →",
  cancelOver: "Cancel and start over",
  stepDone: "✓ done",
};

const fil: KioskStrings = {
  welcomeKicker: "Maligayang pagdating",
  welcomeTitleA: "Patunayan na karapat-dapat ka sa tulong.",
  welcomeTitleB: "Nang hindi ibinibigay ang iyong pangalan.",
  welcomeBody: "Ang kiosk na ito ay gumagawa ng pribadong resibo na maaaring ipakita ng klinika kahit sa anumang kahilingan — kahit subpoena. Pinatutunayan ng resibo na karapat-dapat ka. Hindi nito sinasabi kung sino ka.",
  welcomeCTA: "Pindutin para magsimula →",
  welcomeFooter: "Pinapatakbo ng HELP for Domestic Workers · Compass v1 demo · Walang impormasyong umaalis sa device na ito nang walang pahintulot mo.",
  flowKicker: "HELP for Domestic Workers · Pagsusuri ng Karapatan",
  flowTitle: "Tatlong hakbang.",
  flowTitleItalic: "Pribado.",
  step1Title: "Mag-sign in",
  step1Detail: "Email login. Magpapadala kami ng one-time code. Walang password, walang personal na impormasyong itinatago.",
  step2Title: "Gumawa ng iyong pribadong agent",
  step2Detail: "Isang beses na setup. Ang agent ang kikilos para sa iyo upang hindi makita ng klinika ang iyong pangalan, HKID, o mga dokumento.",
  step3Title: "Patunayan na karapat-dapat ka",
  step3Detail: "Sinusuri ng agent ang iyong pagiging karapat-dapat at gumagawa ng resibo. Ang resibo ang tanging nakikita ng klinika tungkol sa iyo.",
  step4Title: "Kunin ang iyong resibo",
  step4Detail: "Ipinapakita lamang ng resibo na karapat-dapat ka — wala nang iba. Ipakita ito sa intake desk.",
  doneStatus: "✓ Karapat-dapat na kumpirmado",
  doneTitleA: "Ipakita ito sa",
  doneTitleItalic: "intake desk",
  doneTitleB: ".",
  doneReceiptLabel: "Resibo",
  doneReceiptIdLabel: "Receipt ID",
  doneBody: "Maaaring i-verify ng klinika ang resibong ito sa 0G blockchain. Ang itinala lamang ay na karapat-dapat ka — sa oras na ito. Walang tungkol sa iyo.",
  doneReset: "Tapos na — magsimulang muli para sa susunod na bisita →",
  cancelOver: "Kanselahin at magsimulang muli",
  stepDone: "✓ tapos",
};

const id: KioskStrings = {
  welcomeKicker: "Selamat datang",
  welcomeTitleA: "Buktikan bahwa Anda memenuhi syarat untuk bantuan.",
  welcomeTitleB: "Tanpa menyerahkan nama Anda.",
  welcomeBody: "Kiosk ini membuat tanda terima pribadi yang dapat ditunjukkan klinik atas permintaan apa pun — bahkan subpoena. Tanda terima membuktikan Anda memenuhi syarat. Ia tidak menyebutkan siapa Anda.",
  welcomeCTA: "Sentuh untuk mulai →",
  welcomeFooter: "Dioperasikan oleh HELP for Domestic Workers · Compass v1 demo · Tidak ada informasi yang keluar dari perangkat ini tanpa persetujuan Anda.",
  flowKicker: "HELP for Domestic Workers · Pemeriksaan Kelayakan",
  flowTitle: "Tiga langkah.",
  flowTitleItalic: "Pribadi.",
  step1Title: "Masuk",
  step1Detail: "Login email. Kami mengirim kode satu kali. Tanpa kata sandi, tanpa informasi pribadi disimpan.",
  step2Title: "Buat agen pribadi Anda",
  step2Detail: "Pengaturan sekali. Agen bertindak atas nama Anda sehingga klinik tidak pernah melihat nama, HKID, atau dokumen Anda.",
  step3Title: "Buktikan Anda memenuhi syarat",
  step3Detail: "Agen memeriksa kelayakan Anda dan mencetak tanda terima. Tanda terima adalah satu-satunya hal yang dilihat klinik tentang Anda.",
  step4Title: "Ambil tanda terima Anda",
  step4Detail: "Tanda terima hanya menunjukkan kepada klinik bahwa Anda memenuhi syarat — tidak lebih. Tunjukkan di meja intake.",
  doneStatus: "✓ Kelayakan dikonfirmasi",
  doneTitleA: "Tunjukkan ini ke",
  doneTitleItalic: "meja intake",
  doneTitleB: ".",
  doneReceiptLabel: "Tanda terima",
  doneReceiptIdLabel: "ID Tanda terima",
  doneBody: "Klinik dapat memverifikasi tanda terima ini di blockchain 0G. Hanya tercatat bahwa Anda memenuhi syarat — pada slot waktu ini. Tidak ada tentang Anda.",
  doneReset: "Selesai — mulai lagi untuk pengunjung berikutnya →",
  cancelOver: "Batalkan dan mulai lagi",
  stepDone: "✓ selesai",
};

const ms: KioskStrings = {
  welcomeKicker: "Selamat datang",
  welcomeTitleA: "Buktikan anda layak mendapat bantuan.",
  welcomeTitleB: "Tanpa menyerahkan nama anda.",
  welcomeBody: "Kiosk ini mencipta resit peribadi yang boleh ditunjukkan oleh klinik di bawah sebarang permintaan — walaupun subpoena. Resit ini membuktikan anda layak. Ia tidak menyebut siapa anda.",
  welcomeCTA: "Sentuh untuk mula →",
  welcomeFooter: "Dikendalikan oleh HELP for Domestic Workers · Compass v1 demo · Tiada maklumat keluar dari peranti ini tanpa kebenaran anda.",
  flowKicker: "HELP for Domestic Workers · Semakan Kelayakan",
  flowTitle: "Tiga langkah.",
  flowTitleItalic: "Peribadi.",
  step1Title: "Log masuk",
  step1Detail: "Log masuk e-mel. Kami menghantar kod sekali guna. Tiada kata laluan, tiada maklumat peribadi disimpan.",
  step2Title: "Cipta ejen peribadi anda",
  step2Detail: "Persediaan sekali sahaja. Ejen bertindak bagi pihak anda supaya klinik tidak melihat nama, HKID, atau dokumen anda.",
  step3Title: "Buktikan anda layak",
  step3Detail: "Ejen menyemak kelayakan anda dan mencetak resit. Resit adalah satu-satunya perkara yang klinik lihat tentang anda.",
  step4Title: "Dapatkan resit anda",
  step4Detail: "Resit hanya menunjukkan kepada klinik bahawa anda layak — tiada lagi. Tunjukkannya di kaunter pendaftaran.",
  doneStatus: "✓ Kelayakan disahkan",
  doneTitleA: "Tunjukkan ini di",
  doneTitleItalic: "kaunter pendaftaran",
  doneTitleB: ".",
  doneReceiptLabel: "Resit",
  doneReceiptIdLabel: "ID Resit",
  doneBody: "Klinik boleh mengesahkan resit ini pada blockchain 0G. Hanya direkodkan bahawa anda layak — pada slot masa ini. Tiada tentang anda.",
  doneReset: "Selesai — mula semula untuk pelawat seterusnya →",
  cancelOver: "Batalkan dan mula semula",
  stepDone: "✓ selesai",
};

const yue: KioskStrings = {
  welcomeKicker: "歡迎",
  welcomeTitleA: "證明你合資格獲得幫助。",
  welcomeTitleB: "唔需要交出你嘅名。",
  welcomeBody: "呢個自助站會整一張私人收據,診所喺任何要求下都可以出示——就算係傳票都得。張收據證明你合資格,但唔會講你係邊個。",
  welcomeCTA: "撳呢度開始 →",
  welcomeFooter: "由 HELP for Domestic Workers 營運 · Compass v1 demo · 冇你同意,冇任何資料離開呢部機。",
  flowKicker: "HELP for Domestic Workers · 資格審核",
  flowTitle: "三個步驟。",
  flowTitleItalic: "私隱。",
  step1Title: "登入",
  step1Detail: "用電郵登入。我哋會寄一次性密碼俾你。冇密碼,冇儲低個人資料。",
  step2Title: "建立你嘅私人代理",
  step2Detail: "一次性設定。個代理會幫你做嘢,診所唔會見到你個名、HKID 或者文件。",
  step3Title: "證明你合資格",
  step3Detail: "代理會檢查你嘅資格,印張收據出嚟。診所就只會見到呢張收據。",
  step4Title: "攞你嘅收據",
  step4Detail: "張收據只係話俾診所知你合資格——冇其他資料。將佢喺接待處出示就得。",
  doneStatus: "✓ 已確認資格",
  doneTitleA: "出示呢個俾",
  doneTitleItalic: "接待處",
  doneTitleB: "。",
  doneReceiptLabel: "收據",
  doneReceiptIdLabel: "收據編號",
  doneBody: "診所可以喺 0G 區塊鏈上面核實呢張收據。淨係記錄咗你喺呢個時段合資格——關於你嘅資料一啲都冇。",
  doneReset: "完成 —— 為下一位訪客重新開始 →",
  cancelOver: "取消並重新開始",
  stepDone: "✓ 完成",
};

const STRINGS: Record<Locale, KioskStrings> = { en, fil, id, ms, yue };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fil: "Filipino",
  id: "Bahasa Indonesia",
  ms: "Bahasa Malaysia",
  yue: "廣東話",
};

export const LOCALE_ORDER: Locale[] = ["en", "fil", "id", "ms", "yue"];

export function getKioskStrings(locale: Locale): KioskStrings {
  return STRINGS[locale] ?? STRINGS.en;
}

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "en" || v === "fil" || v === "id" || v === "ms" || v === "yue";
}
