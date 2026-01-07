import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
    getFirestore, collection, query, where, orderBy, limit, getDocs,
    addDoc, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD36S7mRWj080VDFM30hhWIL3qtjU-TjbU",
    authDomain: "sabangnet-meeting-app.firebaseapp.com",
    projectId: "sabangnet-meeting-app",
    storageBucket: "sabangnet-meeting-app.firebasestorage.app",
    messagingSenderId: "841331066338",
    appId: "1:841331066338:web:428a498c4804eb80e825bb",
    measurementId: "G-VHDQZ7PB8B"
};

const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

function getTodayKeySeoul() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === "year").value;
    const m = parts.find(p => p.type === "month").value;
    const d = parts.find(p => p.type === "day").value;
    return Number(`${y}${m}${d}`);
}

function formatDateKey(dateKey) {
    const s = String(dateKey);
    if (s.length !== 8) return String(dateKey);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function initials(name) {
    const n = (name || "?").trim();
    return n ? n.slice(0, 1) : "?";
}

function formatKST(ts) {
    try {
        const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : null);
        if (!d) return "";
        return new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            year: "2-digit", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit"
        }).format(d);
    } catch {
        return "";
    }
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateNickname() {
    return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

const ANIMALS = ["🐯", "🦁", "🐻", "🐼", "🐶", "🐱", "🐸", "🦊", "🐰", "🐹", "🐵", "🐨", "🐮", "🐧", "🦄"];
const ADJECTIVES = [
    "용감한", "수줍은", "조용한", "열정적인", "차분한",
    "느긋한", "빠른", "똑똑한", "귀여운", "진지한",
    "엉뚱한", "꼼꼼한", "성실한", "유연한", "단단한",
    "부드러운", "강인한", "낙천적인", "신중한", "솔직한",
    "명랑한", "차가운", "따뜻한", "예민한", "침착한",
    "꾸준한", "호기심많은", "대담한", "겸손한", "현명한",
    "집중하는", "몰입한", "끈질긴", "단순한", "복잡한",
    "정직한", "재빠른", "느린", "침묵하는", "말많은",
    "유쾌한", "차분해진", "깊이있는", "가벼운", "든든한",
    "단호한", "섬세한", "차오르는", "빛나는"
];
const NOUNS = [
    "개발자", "고래", "토끼", "펭귄", "곰",
    "사자", "여우", "고양이", "강아지", "판다",
    "요정", "전사", "마법사", "러너", "장인",
    "커밋요정", "리팩터러", "버그헌터", "아키텍트", "탐험가",
    "코더", "엔지니어", "빌더", "설계자", "문서장인",
    "로그수집가", "테스터", "자동화요정", "배포요정", "리뷰어",
    "관찰자", "해결사", "개척자", "조율자", "정리왕",
    "기록자", "분석가", "실험가", "관리자", "수호자",
    "트러블슈터", "개선러", "최적화러", "디버거", "빌런(?)",
    "주니어", "시니어", "마스터", "장인정신"
];
const TODAY_MSG = [
    "코드는 거짓말을 하지 않는다.",
    "잘 돌아가는 코드가 최고의 문서다.",
    "완벽보다 완료가 중요하다.",
    "작은 개선이 큰 차이를 만든다.",
    "오늘의 리팩터링이 내일의 평화를 만든다.",
    "버그는 배신이 아니라 신호다.",
    "코드는 읽히기 위해 존재한다.",
    "지금의 선택이 미래의 유지보수를 만든다.",
    "문제는 항상 데이터에 있다.",
    "단순함은 최고의 정교함이다.",
    "돌아가면 절반은 성공이다.",
    "오늘의 커밋이 내일의 자신감이다.",
    "테스트는 믿음을 만든다.",
    "한 줄의 개선이 하루를 바꾼다.",
    "좋은 코드는 설명하지 않아도 이해된다.",
    "느린 코드보다 이해 안 되는 코드가 더 위험하다.",
    "실패는 배움의 로그다.",
    "문제는 숨기지 말고 드러내라.",
    "자동화는 최고의 동료다.",
    "오늘의 삽질은 내일의 노하우다.",
    "코드는 팀의 언어다.",
    "완벽한 설계는 없다, 진화할 뿐이다.",
    "작동하는 코드가 정의다.",
    "읽기 쉬운 코드가 오래 산다.",
    "고민한 흔적은 코드에 남는다.",
    "지금 고친 버그는 다시 오지 않는다.",
    "기능보다 경험이 중요하다.",
    "코드는 결국 사람을 위한 것이다.",
    "작게 나누면 길이 보인다.",
    "문제를 이해하면 해결은 반이다.",
    "코드 리뷰는 공격이 아니라 협업이다.",
    "오늘의 결정이 기술부채를 만든다.",
    "간결함은 실력이다.",
    "빠른 해결보다 올바른 해결이 중요하다.",
    "코드는 쌓이고 신뢰는 만들어진다.",
    "한 번 더 생각하면 버그가 줄어든다.",
    "지금의 불편함이 미래를 편하게 한다.",
    "명확함은 최고의 성능이다.",
    "의도는 코드로 말하라.",
    "문서 없는 코드는 반쪽짜리다.",
    "테스트 없는 자신감은 위험하다.",
    "잘못된 가정이 버그의 시작이다.",
    "코드는 팀의 역사다.",
    "오늘의 개선이 장애를 막는다.",
    "작은 실패를 자주 하라.",
    "코드는 줄어들수록 강해진다.",
    "이해할 수 있으면 고칠 수 있다.",
    "기술은 수단이고 목적은 문제 해결이다.",
    "결국 중요한 건 꾸준함이다."
];

const ownerName = $("ownerName");
const ownerType = $("ownerType");
const ownerDateChip = $("ownerDateChip");
const avatar = $("avatar");
const todayMessage = $("todayMessage");
const statusText = $("statusText");

const boardList = $("boardList");
const scheduleList = $("scheduleList");
const scheduleSearch = $("scheduleSearch");

const guestbookForm = $("guestbookForm");
const nickname = $("nickname");
const message = $("message");
const counterText = $("counterText");
const submitBtn = $("submitBtn");

const openScheduleBtn = $("openScheduleBtn");
const closeSidebarBtn = $("closeSidebarBtn");
const overlay = $("overlay");
const sidebar = $("sidebar");
const reloadBtn = $("reloadBtn");

function openSidebar() {
    overlay.classList.add("open");
    sidebar.classList.add("open");
}
function closeSidebar() {
    overlay.classList.remove("open");
    sidebar.classList.remove("open");
}
openScheduleBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);
reloadBtn.addEventListener("click", () => location.reload());

function setStatus(text, isError = false) {
    statusText.classList.toggle("error", !!isError);
    statusText.textContent = text;
}

function updateCounter() {
    const len = message.value.length;
    counterText.textContent = `${len}/100`;
    submitBtn.disabled = !(currentOwner && message.value.trim().length > 0);
}
message.addEventListener("input", updateCounter);

function initRandomUI() {
    nickname.value = generateNickname();
    todayMessage.textContent = pick(TODAY_MSG);
}
initRandomUI();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let presentersCache = [];
let currentOwner = null;
let unsubscribeBoards = null;

function renderSchedule(list) {
    const q = scheduleSearch.value.trim().toLowerCase();
    const filtered = q
        ? list.filter(p => String(p.name || "").toLowerCase().includes(q))
        : list;

    scheduleList.innerHTML = filtered.map(p => {
        const isOwner = currentOwner && p.id === currentOwner.id;
        return `
  <div class="sched-item" title="${escapeHtml(p.name || "")}">
    <div class="sched-left">
      <div class="sched-name">${isOwner ? "👑 " : ""}${escapeHtml(p.name || "—")}</div>
      <div class="sched-meta">
        <span>📅 ${escapeHtml(p.date || formatDateKey(p.dateKey))}</span>
        <span>·</span>
        <span>🔖 ${escapeHtml(convertType(p.type) || "GENERAL")}</span>
      </div>
    </div>
    <div class="tag">${isOwner ? "OWNER" : "NEXT"}</div>
  </div>`;
    }).join("") || `<div style="color:var(--muted);font-size:12px">표시할 스케줄이 없어요.</div>`;
}
scheduleSearch.addEventListener("input", () => renderSchedule(presentersCache));

function applyOwner(p) {
    currentOwner = p;

    ownerName.textContent = p?.name ? p.name : "예정된 발표자가 없어요";
    ownerType.textContent = p?.type ? convertType(p.type) : "—";
    ownerDateChip.textContent = p?.date ? p.date : (p?.dateKey ? formatDateKey(p.dateKey) : "—");
    avatar.textContent = initials(p?.name);

    if (unsubscribeBoards) unsubscribeBoards();
    boardList.innerHTML = "";

    if (!p) {
        submitBtn.disabled = true;
        setStatus("오늘 이후 발표자가 없습니다. (presenters 데이터 확인)", true);
        return;
    }

    setStatus("방명록 로딩 중…");
    submitBtn.disabled = message.value.trim().length === 0;

    const boardsCol = collection(db, "presenters", p.id, "boards");
    const boardsQ = query(boardsCol, orderBy("createdAt", "desc"), limit(50));

    unsubscribeBoards = onSnapshot(boardsQ, (snap) => {
        const items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if (items.length === 0) {
            boardList.innerHTML = `
    <div style="color:var(--muted);font-size:12px;padding:10px 2px">
      아직 방명록이 없어요. 첫 글의 주인공이 되어주세요! ✨
    </div>
  `;
        } else {
            boardList.innerHTML = items.map(it => {
                const who = it.nickname?.trim() ? it.nickname.trim() : "익명";
                const time = formatKST(it.createdAt);
                const msg = it.message ?? "";
                return `
      <div class="entry">
        <div class="entry-top">
          <div class="entry-who">
            <div class="tiny">${escapeHtml(initials(who))}</div>
            <div class="entry-name">${escapeHtml(who)}</div>
          </div>
          <div class="entry-time">${escapeHtml(time || "")}</div>
        </div>
        <div class="entry-msg">${escapeHtml(msg)}</div>
      </div>
    `;
            }).join("");
        }

        setStatus(`방명록 ${items.length}개`);
    }, (err) => {
        console.error(err);
        setStatus("방명록을 불러오지 못했어요. (권한/룰 확인)", true);
    });
}

function convertType(type) {
    if (type === "AI") return "AI 주간회의";
    return "일반 주간회의"
}

async function loadPresenters() {
    setStatus("발표자(presenters) 불러오는 중…");
    const todayKey = getTodayKeySeoul();

    const presentersCol = collection(db, "presenters");
    const qy = query(
        presentersCol,
        where("dateKey", ">=", todayKey),
        orderBy("dateKey", "asc"),
        limit(100)
    );

    const snap = await getDocs(qy);
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));

    presentersCache = list;

    const owner = list.length > 0 ? list[0] : null;
    renderSchedule(list);
    applyOwner(owner);
}

guestbookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentOwner) return;

    const nick = nickname.value.trim().slice(0, 20);
    const msg = message.value.trim().slice(0, 100);
    if (!msg) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "등록 중…";

    try {
        const boardsCol = collection(db, "presenters", currentOwner.id, "boards");
        await addDoc(boardsCol, {
            nickname: nick,
            message: msg,
            presenterDateKey: currentOwner.dateKey ?? null,
            createdAt: serverTimestamp()
        });

        message.value = "";
        updateCounter();
        submitBtn.textContent = "✍️ 방명록 남기기";
    } catch (err) {
        console.error(err);
        alert("방명록 등록 실패! (Firestore rules/권한 확인)");
        submitBtn.textContent = "✍️ 방명록 남기기";
    } finally {
        submitBtn.disabled = !(currentOwner && message.value.trim().length > 0);
    }
});

updateCounter();

try {
    await loadPresenters();
} catch (err) {
    console.error(err);
    setStatus("데이터를 불러오지 못했어요. (인덱스/권한/컬렉션명 확인)", true);
}
