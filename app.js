// =======================================================
// app.js V3 (1/6)
// =======================================================

function beep(duration = 120, frequency = 900, volume = 0.2) {

    try {

        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        if (ctx.state === "suspended") {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();

        setTimeout(() => {

            oscillator.stop();
            ctx.close();

        }, duration);

    } catch (e) {

        console.log("AudioContext Error");

    }

}

// ===========================
// Element
// ===========================

const blessing = document.getElementById("blessing");
const infoBox = document.getElementById("infoBox");

const API_URL = document.getElementById("apiUrl").value;

const statusBadge = document.getElementById("statusBadge");

const resultCard = document.getElementById("resultCard");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const memberName = document.getElementById("memberName");

const todayCount = document.getElementById("todayCount");
const department = document.getElementById("department");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const checkTime = document.getElementById("checkTime");

// ===========================
// Variable
// ===========================

let scanning = true;
let lastQr = "";

const html5QrCode = new Html5Qrcode("reader");

// ===========================
// Initialize
// ===========================

setStatus("waiting", "🟢 인증 대기 중");

blessing.innerHTML = "은혜 많이 받는 예배 되세요.";

resultCard.className = "result-card hidden";

resetCard();

// ===========================
// Reset
// ===========================

function resetCard() {

    todayCount.innerHTML = "-명";
    department.innerHTML = "-";
    startDate.innerHTML = "-";
    endDate.innerHTML = "-";
    checkTime.innerHTML = "-";

}

// ===========================
// Status
// ===========================

function setStatus(type, text) {

    statusBadge.className = "status " + type;
    statusBadge.innerHTML = text;

}

// ===========================
// Result Card
// ===========================

function showCard(data, success) {

    resultCard.classList.remove("hidden");

    if (success) {

        resultCard.className = "result-card success";

        resultIcon.innerHTML = "✅";

        resultTitle.innerHTML = "인증 완료";

        memberName.innerHTML =
            (data.name || "-") + " 성도님";

        blessing.innerHTML =
            "은혜 많이 받는 예배 되세요.";

        todayCount.innerHTML =
            (data.todayCount || 0) + "명";

        department.innerHTML =
            data.department || "-";

        startDate.innerHTML =
            data.startDate || "-";

        endDate.innerHTML =
            data.endDate || "-";

        checkTime.innerHTML =
            data.checkinTime || "-";

        if (navigator.vibrate) {

            navigator.vibrate(100);

        }

        beep();

    } else {

        resultCard.className = "result-card error";

        resultIcon.innerHTML = "❌";

        resultTitle.innerHTML = "인증 실패";

        memberName.innerHTML =
            data.message || "인증 실패";

        blessing.innerHTML = "";

        resetCard();

        if (navigator.vibrate) {

            navigator.vibrate([100, 60, 100]);

        }

        beep(250, 350);

    }

}
// ===========================
// QR Scan Success
// ===========================

async function onScanSuccess(qrText) {

    if (!scanning) return;

    // 같은 QR 연속 인식 방지
    if (lastQr === qrText) return;

    lastQr = qrText;
    scanning = false;

    setStatus("processing", "🟡 인증 중...");

    resultCard.className = "result-card hidden";

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                action: "checkIn",
                qrId: qrText

            })

        });

        if (!response.ok) {

            throw new Error(`HTTP ${response.status}`);

        }

        const data = await response.json();

        if (data.success) {

            setStatus("success", "✅ 인증 완료");

            showCard(data, true);

        } else {

            setStatus("error", "❌ 인증 실패");

            showCard(data, false);

        }

    } catch (err) {

        console.error(err);

        setStatus("error", "❌ 서버 연결 실패");

        showCard({

            message: "서버 연결에 실패했습니다."

        }, false);

    }

    setTimeout(() => {

        resultCard.className = "result-card hidden";

        blessing.innerHTML = "은혜 많이 받는 예배 되세요.";

        resetCard();

        lastQr = "";

        setStatus("waiting", "🟢 인증 대기 중");

        scanning = true;

    }, 1200);

}

// ===========================
// Camera Error
// ===========================

function onScanFailure(error) {

    // 필요 시 디버깅
    // console.log(error);

}
// ===========================
// Camera Start
// ===========================

async function startCamera() {

    try {

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {

            setStatus("error", "❌ 카메라를 찾을 수 없습니다.");

            return;

        }

        // 후면 카메라 우선
        const backCamera =

            cameras.find(camera => {

                const label = (camera.label || "").toLowerCase();

                return (
                    label.includes("back") ||
                    label.includes("rear") ||
                    label.includes("후면")
                );

            })

            ||

            cameras[cameras.length - 1];

        await html5QrCode.start(

            backCamera.id,

            {

                fps: 15,

                qrbox: {

                    width: 320,
                    height: 320

                },

                aspectRatio: 1,

                disableFlip: false

            },

            onScanSuccess,

            onScanFailure

        );

    } catch (err) {

        console.error(err);

        setStatus("error", "❌ 카메라 실행 실패");

    }

}

// ===========================
// Start
// ===========================

startCamera();

// ===========================
// Page Visibility
// ===========================

document.addEventListener("visibilitychange", () => {

    if (document.hidden) {

        scanning = false;

        return;

    }

    scanning = true;

});

// ===========================
// Window Focus
// ===========================

window.addEventListener("focus", () => {

    scanning = true;

});

// ===========================
// Window Blur
// ===========================

window.addEventListener("blur", () => {

    scanning = false;

});
// ===========================
// Utility
// ===========================

function lockScanner() {

    scanning = false;

}

function unlockScanner() {

    scanning = true;

}

function clearResult() {

    resultCard.className = "result-card hidden";

    blessing.innerHTML = "은혜 많이 받는 예배 되세요.";

    resetCard();

}

function resetScanner(delay = 1200) {

    setTimeout(() => {

        clearResult();

        lastQr = "";

        setStatus("waiting", "🟢 인증 대기 중");

        unlockScanner();

    }, delay);

}

// ===========================
// Sound Test (개발용)
// ===========================

function testSuccess() {

    showCard({

        success: true,

        name: "홍길동",

        department: "청년회",

        todayCount: 37,

        startDate: "2026-08-02",

        endDate: "2026-11-02",

        checkinTime: "09:51:33"

    }, true);

    resetScanner();

}

function testFail() {

    showCard({

        success: false,

        message: "오늘 이미 인증되었습니다."

    }, false);

    resetScanner();

}

// ===========================
// ESC 키 → 화면 초기화 (개발용)
// ===========================

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        clearResult();

        lastQr = "";

        setStatus("waiting", "🟢 인증 대기 중");

        unlockScanner();

    }

});

// ===========================
// 개발용 (필요시 콘솔에서 실행)
// testSuccess()
// testFail()
// ===========================
// ===========================
// 모바일 최적화
// ===========================

// 더블탭 확대 방지
let lastTouchEnd = 0;

document.addEventListener("touchend", (event) => {

    const now = Date.now();

    if (now - lastTouchEnd <= 300) {

        event.preventDefault();

    }

    lastTouchEnd = now;

}, { passive: false });

// 화면 항상 활성 유지(지원 브라우저)
if ("wakeLock" in navigator) {

    let wakeLock = null;

    async function requestWakeLock() {

        try {

            wakeLock = await navigator.wakeLock.request("screen");

        } catch (err) {

            console.log("WakeLock :", err);

        }

    }

    requestWakeLock();

    document.addEventListener("visibilitychange", async () => {

        if (wakeLock !== null && document.visibilityState === "visible") {

            requestWakeLock();

        }

    });

}

// ===========================
// 새로고침 방지(실수 방지)
// ===========================

window.addEventListener("beforeunload", (e) => {

    e.preventDefault();

    e.returnValue = "";

});

// ===========================
// Console Banner
// ===========================

console.log(
`
==========================================
   SDM QR CHECK-IN SYSTEM
   Version : V3
   Status  : Running
==========================================
`
);

// ===========================
// Version
// ===========================

const APP_VERSION = "V3.0.0";

console.log("App Version :", APP_VERSION);

// ===========================
// End
// ===========================