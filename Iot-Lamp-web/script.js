// 1. IMPORT LIBRARY FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. KONFIGURASI FIREBASE
// (PASTIKAN Bagian ini sudah sesuai dengan punya kamu sendiri)
const firebaseConfig = {
  apiKey: "AIzaSyCFZeocCU94dHcg0DjE3JC4uumv0LDQ2E8",
  authDomain: "iot-sensor-saya.firebaseapp.com",
  databaseURL:
    "https://iot-sensor-saya-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-sensor-saya",
  storageBucket: "iot-sensor-saya.firebasestorage.app",
  messagingSenderId: "930380131488",
  appId: "1:930380131488:web:c984fd6691b055b0226dc5",
};

// 3. URL DATABASE (PERUBAHAN DISINI)
// Kita ambil folder "Virtual_Object" agar dapat Status DAN Waktu sekaligus.
const URL_DB_POLLING = firebaseConfig.databaseURL + "/Virtual_Object.json";

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Variabel Global
let pollingService;

// ================= FUNGSI LOGIN =================

window.prosesAuth = function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  const errorMsg = document.getElementById("error-msg");
  const btn = document.getElementById("btn-submit");

  errorMsg.innerText = "";
  btn.innerText = "Loading...";
  btn.disabled = true;

  signInWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      console.log("Login Sukses:", userCredential.user.email);
    })
    .catch((error) => {
      btn.innerText = "MASUK";
      btn.disabled = false;
      errorMsg.innerText = terjemahkanError(error.code);
    });
};

window.keluarAkun = function () {
  signOut(auth)
    .then(() => {
      console.log("User Logout");
    })
    .catch((error) => {
      console.error(error);
    });
};

function terjemahkanError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Format email salah.";
    case "auth/user-not-found":
      return "Akun tidak ditemukan.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau Password salah.";
    case "auth/missing-password":
      return "Password tidak boleh kosong.";
    default:
      return "Error: " + errorCode;
  }
}

// ================= MONITOR STATUS USER =================
onAuthStateChanged(auth, (user) => {
  const authSection = document.getElementById("auth-section");
  const dashSection = document.getElementById("dashboard-section");
  const btn = document.getElementById("btn-submit");

  if (user) {
    // USER LOGIN
    authSection.classList.add("hidden");
    dashSection.classList.remove("hidden");
    document.getElementById("user-email").innerText = user.email;

    btn.disabled = false;
    btn.innerText = "MASUK";

    mulaiPollingData();
  } else {
    // USER LOGOUT
    dashSection.classList.add("hidden");
    authSection.classList.remove("hidden");
    clearInterval(pollingService);
  }
});

// ================= MONITOR DATA (POLLING) =================
function mulaiPollingData() {
  ambilData();
  pollingService = setInterval(ambilData, 1000);
}

function ambilData() {
  fetch(URL_DB_POLLING)
    .then((response) => response.json())
    .then((data) => {
      updateTampilan(data);
    })
    .catch((error) => {
      console.error("Gagal ambil data:", error);
      document.getElementById("status-teks").innerText = "OFFLINE";
    });
}

// FUNGSI UPDATE TAMPILAN (DIPERBAHARUI)
function updateTampilan(data) {
  const elemenLampu = document.getElementById("visual-lampu");
  const elemenTeks = document.getElementById("status-teks");
  const elemenWaktu = document.getElementById("last-update");

  // Cek apakah data ada?
  if (data) {
    // 1. Ambil Status (Default OFF jika kosong)
    const status = data.status_sekarang || "OFF";

    // 2. Ambil Waktu & Konversi
    const timestamp = data.waktu_update;
    if (timestamp) {
      // Ubah angka detik (Unix) jadi Tanggal Manusia
      // Kalikan 1000 karena Javascript butuh milidetik
      const dateObj = new Date(timestamp * 1000);
      // Format Indonesia
      elemenWaktu.innerText = dateObj.toLocaleString("id-ID");
    } else {
      elemenWaktu.innerText = "-";
    }

    // 3. Update Visual Lampu
    if (status === "ON") {
      elemenLampu.className = "lampu nyala";
      elemenTeks.innerText = "STATUS: TERDETEKSI (ON)";
      elemenTeks.style.color = "#d4a017";
    } else {
      elemenLampu.className = "lampu mati";
      elemenTeks.innerText = "STATUS: KOSONG (OFF)";
      elemenTeks.style.color = "#333";
    }
  }
}
