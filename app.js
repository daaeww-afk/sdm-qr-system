const API_URL =
  "https://script.google.com/macros/s/AKfycbyMaEjQNZvCK_OYpB6h4Wc9CxnqIjivTOuwD8zhcT7thyYUlZJt3dMZD7m-ZrDf5GtM/exec";

let scanning = false;
let html5QrCode;

window.onload = () => {
    startScanner();
};

function startScanner() {

    html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras()
        .then(cameras => {

            if (!cameras.length) {
                alert("카메라를 찾을 수 없습니다.");
                return;
            }

            return html5QrCode.start(
                cameras[0].id,
                {
                    fps: 10,
                    qrbox: 250
                },
                onScanSuccess
            );

        })
        .catch(err => {
            alert("카메라 실행 실패\n" + err);
        });
}

async function onScanSuccess(qrText) {

    if (scanning) return;

    scanning = true;

    try {

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "checkIn",
                qrId: qrText
            })
        });

        const data = await res.json();

        if (data.success) {

            document.getElementById("result").style.display = "block";

            document.getElementById("result").innerHTML = `
                <h2>✅ 체크인 완료</h2>
                <hr><br>
                <b>성명</b><br>${data.name}<br><br>
                <b>소속</b><br>${data.department}<br><br>
                <b>고유번호</b><br>${data.memberId}<br><br>
                <b>이용기간</b><br>${data.startDate} ~ ${data.endDate}<br><br>
                <b>체크인 시간</b><br>${data.checkinTime}
            `;

        } else {

            alert(data.message);

        }

    } catch (e) {

        alert("통신 오류\n" + e);

    }

    setTimeout(() => {

        scanning = false;

        document.getElementById("result").style.display = "none";

    }, 2500);

}