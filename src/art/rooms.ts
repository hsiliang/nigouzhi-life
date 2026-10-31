import type { RoomId } from '../engine/types';

const svg = (body: string, sky = 'none') => `<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect width="200" height="100" fill="${sky}"/>${body}</svg>`;
const ink = 'stroke="#5a4334" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';

export const roomArt: Record<RoomId, string> = {
  rooftop: svg(`
    <defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ea6d8"/><stop offset=".55" stop-color="#f4b58f"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient></defs>
    <rect width="200" height="100" fill="url(#dusk)"/><circle cx="150" cy="62" r="17" fill="#ffe59c"/>
    <path d="M0 78 q30 -12 60 -2 t70 -4 t70 4 v24 H0z" fill="#8c7fa8" opacity=".55"/>
    <rect y="90" width="200" height="10" fill="#c9a98a" ${ink}/>
    <path d="M28 90 V48 M18 54 h20 M21 60 h14" fill="none" ${ink}/><rect x="60" y="70" width="28" height="20" rx="3" fill="#7ca3c2" ${ink}/><rect x="64" y="74" width="20" height="12" fill="#cfe7f2"/>`),
  penthouse: svg(`
    <rect width="200" height="100" fill="#f7e9d7"/>
    <rect x="12" y="10" width="74" height="60" rx="3" fill="#bfe3ee" ${ink}/><path d="M49 10 v60" ${ink}/><path d="M12 62 q37 -18 74 0" fill="#9dcbb2"/>
    <rect x="112" y="60" width="72" height="26" rx="8" fill="#e8a5a0" ${ink}/><rect x="106" y="48" width="18" height="30" rx="7" fill="#d98c8a" ${ink}/>
    <path d="M150 0 v14" ${ink}/><path d="M136 14 h28 l-6 12 h-16z" fill="#ffd978" ${ink}/><circle cx="96" cy="84" r="7" fill="#a9b2ba" ${ink}/>`),
  lab: svg(`
    <rect width="200" height="100" fill="#dfe8f1"/>
    <rect x="10" y="60" width="180" height="30" rx="3" fill="#8e9db0" ${ink}/>
    <rect x="28" y="44" width="26" height="16" rx="2" fill="#5e6e84" ${ink}/><path d="M54 52 H150" stroke="#ff5a6a" stroke-width="2.4"/><circle cx="150" cy="52" r="6" fill="#ffd978" ${ink}/>
    <rect x="150" y="12" width="36" height="28" rx="3" fill="#29334a" ${ink}/><path d="M154 30 l6 -8 6 5 6 -10 8 10" fill="none" stroke="#7ff0c8" stroke-width="1.6"/>
    <rect x="72" y="46" width="14" height="14" rx="2" fill="#ffffff" ${ink}/><path d="M76 46 q3 -8 8 -6" fill="none" ${ink}/>`),
  factory: svg(`
    <rect width="200" height="100" fill="#efe2c6"/>
    <rect x="20" y="58" width="90" height="32" rx="3" fill="#b98a5f" ${ink}/><rect x="36" y="38" width="40" height="22" rx="2" fill="#39485e" ${ink}/>
    <rect x="130" y="46" width="48" height="44" rx="3" fill="#cfd3d8" ${ink}/><rect x="138" y="38" width="32" height="10" fill="#fff" ${ink}/>
    <rect x="16" y="12" width="60" height="16" rx="2" fill="#fff" ${ink}/><path d="M22 18 h44 M22 23 h30" ${ink}/>`),
  gym: svg(`
    <rect width="200" height="100" fill="#ffd9c4"/>
    <rect y="84" width="200" height="16" fill="#7c6a5e"/>
    <path d="M36 62 h128" stroke="#5a4334" stroke-width="4"/><rect x="24" y="44" width="12" height="36" rx="3" fill="#39485e" ${ink}/><rect x="164" y="44" width="12" height="36" rx="3" fill="#39485e" ${ink}/><rect x="40" y="50" width="8" height="24" rx="2" fill="#e8705a" ${ink}/><rect x="152" y="50" width="8" height="24" rx="2" fill="#e8705a" ${ink}/>
    <rect x="70" y="8" width="60" height="26" rx="3" fill="#dff1f4" ${ink}/>`),
  artroom: svg(`
    <rect width="200" height="100" fill="#fbecc3"/>
    <path d="M60 90 L80 26 L100 90 M66 66 H94" fill="none" ${ink}/><rect x="60" y="26" width="42" height="34" rx="2" fill="#fff" ${ink}/><circle cx="74" cy="42" r="7" fill="#f2c14e"/><path d="M84 50 q6 -12 12 0" fill="#7fc29b"/>
    <rect x="124" y="14" width="24" height="18" fill="#a7d5ec" ${ink}/><rect x="154" y="14" width="24" height="18" fill="#f3a9a0" ${ink}/><rect x="124" y="38" width="24" height="18" fill="#c5e3a8" ${ink}/><rect x="154" y="38" width="24" height="18" fill="#d6b9e8" ${ink}/>`),
  cafe: svg(`
    <rect width="200" height="100" fill="#3d3a5c"/>
    <rect x="10" y="62" width="180" height="28" rx="3" fill="#68597c" ${ink}/>
    <rect x="26" y="34" width="44" height="28" rx="2" fill="#141627" ${ink}/><path d="M32 54 l8 -10 8 6 10 -12" fill="none" stroke="#6ef3ff" stroke-width="1.8"/>
    <rect x="124" y="34" width="44" height="28" rx="2" fill="#141627" ${ink}/><path d="M130 44 h30 M130 50 h20 M130 56 h26" stroke="#ff8fb4" stroke-width="1.6"/>
    <rect x="80" y="10" width="40" height="12" rx="6" fill="#ff5fa2"/>`),
  courtyard: svg(`
    <rect width="200" height="100" fill="#cfe8c6"/><rect y="84" width="200" height="16" fill="#cdb695"/>
    <path d="M0 12 q50 22 100 4 t100 4" fill="none" ${ink}/><circle cx="30" cy="21" r="4" fill="#ffd978"/><circle cx="74" cy="24" r="4" fill="#ff9d8a"/><circle cx="122" cy="16" r="4" fill="#ffd978"/><circle cx="170" cy="20" r="4" fill="#ff9d8a"/>
    <rect x="118" y="52" width="66" height="32" rx="3" fill="#e8c28a" ${ink}/><path d="M110 52 l10 -14 h60 l10 14z" fill="#e8705a" ${ink}/>
    <circle cx="30" cy="72" r="12" fill="#7fc29b" ${ink}/><rect x="27" y="80" width="6" height="8" fill="#a97755"/>`),
  clinic: svg(`
    <rect width="200" height="100" fill="#e8f7f4"/>
    <rect x="30" y="64" width="110" height="20" rx="4" fill="#fff" ${ink}/><rect x="30" y="56" width="26" height="14" rx="4" fill="#cfe7f2" ${ink}/>
    <path d="M162 88 V26 M154 26 h16" ${ink}/><rect x="156" y="28" width="12" height="20" rx="3" fill="#bfe3ee" ${ink}/><path d="M162 48 q-8 12 -22 16" fill="none" ${ink}/>
    <rect x="86" y="10" width="28" height="28" rx="4" fill="#fff" ${ink}/><path d="M100 16 v16 M92 24 h16" stroke="#e8505a" stroke-width="5"/>`),
  warehouse: svg(`
    <rect width="200" height="100" fill="#e5d3b3"/>
    <rect x="24" y="52" width="42" height="36" fill="#c99a68" ${ink}/><rect x="70" y="52" width="42" height="36" fill="#d6ab7c" ${ink}/><rect x="46" y="18" width="42" height="34" fill="#d6ab7c" ${ink}/>
    <rect x="118" y="40" width="50" height="48" fill="#c99a68" ${ink}/><path d="M45 52 v36 M91 52 v36 M67 18 v34 M143 40 v48" stroke="#f7e6b5" stroke-width="3"/>`),
  police: svg(`
    <rect width="200" height="100" fill="#c9d8ee"/>
    <rect x="30" y="50" width="140" height="38" rx="3" fill="#7c8cab" ${ink}/><rect x="70" y="8" width="60" height="18" rx="4" fill="#31568f" ${ink}/><circle cx="58" cy="17" r="6" fill="#ff5a6a"/><circle cx="142" cy="17" r="6" fill="#4e8df5"/>
    <path d="M44 88 V50 M72 88 V50 M100 88 V50 M128 88 V50 M156 88 V50" stroke="#39485e" stroke-width="2"/>`),
};
