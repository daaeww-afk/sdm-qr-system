const API_URL = "https://tight-feather-2125.daaeww.workers.dev";

let html5QrCode = null;
let scanning = false;
let processing = false;

window.onload = initScanner;

/**
 * 스캐너 시작
 */
async function initScanner() {

    if (scanning) return;

    scanning = true;

    setStatus(
        "waiting",
        "📷 카메라를 준비하고 있습니다..."
    );

    html5QrCode = new Html5Qrcode("reader");

    try {

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras.length) {
            setStatus("error", "카메라를 찾을 수 없습니다.");
            return;
        }

        let cameraId = cameras[0].id;

        const backCamera = cameras.find(c =>
            c.label.toLowerCase().includes("back") ||
            c.label.includes("후면")
        );

        if (backCamera) {
            cameraId = backCamera.id;
        }

        await html5QrCode.start(
            cameraId,
            {
                fps: 10,
                qrbox: {
                    width: 260,
                    height: 260
                }
            },
            onScanSuccess
        );

        setStatus(
            "waiting",
            "QR을 카메라에 비춰주세요."
        );

} catch(err){

    console.error(err);

    alert(err);

    setStatus(
        "error",
        "카메라 실행 실패"
    );

}

}

/**
 * QR 인식
 */
async function onScanSuccess(decodedText) {

    if (processing) return;

    processing = true;

    html5QrCode.pause(true);

    setStatus(
        "waiting",
        "🔍 인증 확인 중..."
    );

    try {

const response = await fetch(API_URL, {
    method: "POST",
    headers: {
        "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
        action: "checkIn",
        qrId: decodedText
    }),
    redirect: "follow"
});

        console.log("========== API RESPONSE ==========");
        console.log("Status:", response.status);
        console.log("URL:", response.url);

const result = await response.json();

alert(JSON.stringify(result, null, 2)); 

console.log(result);

if (result.success) {

    playSuccess(result);

    document.getElementById("todayCount").innerText =
        result.todayCount;

    setStatus(
        "success",
        "✅ 체크인 완료"
    );

} else {

    playError(result.message);

}

    } catch (err) {

        console.error(err);

        alert(err.toString());

    }

}

/**
 * 상태 표시
 */
function setStatus(type, message) {

    const status = document.getElementById("status");

    status.className = "status " + type;

    status.innerHTML = message;

}

/**
 * 성공
 */
function playSuccess(result) {

    beep();
    vibrate();

    document.getElementById("successName").innerHTML =
        result.name + "님";

    document.getElementById("successDept").innerHTML =
        result.department;

    document.getElementById("todayCount").innerText =
        result.todayCount ?? 0;

    document.getElementById("lastResult").innerHTML =
        `✅ ${result.name} (${result.department})<br>${result.checkinTime}`;

    document
        .getElementById("successOverlay")
        .classList.add("show");

    setStatus(
        "success",
        "✅ 체크인 완료"
    );

    setTimeout(async () => {

        hideOverlay();

        processing = false;

        await html5QrCode.resume();

        setStatus(
            "waiting",
            "QR을 카메라에 비춰주세요."
        );

    }, 2000);

}

/**
 * 실패
 */
function playError(message) {

    beep();

    document.getElementById("errorMessage").innerHTML =
        message;

    document.getElementById("lastResult").innerHTML =
        "❌ " + message;

    document
        .getElementById("errorOverlay")
        .classList.add("show");

    setStatus(
        "error",
        message
    );

    setTimeout(async ()=>{

        hideOverlay();

        processing = false;

        await html5QrCode.resume();

        setStatus(
            "waiting",
            "QR을 카메라에 비춰주세요."
        );

    },2000);

}

/**
 * 오버레이 숨김
 */
function hideOverlay() {

    document
        .getElementById("successOverlay")
        .classList.remove("show");

    document
        .getElementById("errorOverlay")
        .classList.remove("show");

}

/**
 * 효과음
 */
function beep() {

    try {

        const audio = new Audio(
            "https://actions.google.com/sounds/v1/cartoon/pop.ogg"
        );

        audio.play();

    } catch (e) {}

}

/**
 * 진동
 */
function vibrate() {

    if (navigator.vibrate) {
        navigator.vibrate(200);
    }

}