#include <WiFi.h>
#include <FirebaseESP32.h>
#include "time.h" // Library buat ambil jam internet

// --- KONFIGURASI WIFI ---
#define WIFI_SSID "ID."
#define WIFI_PASSWORD "eko12345"

// --- KONFIGURASI FIREBASE ---
#define FIREBASE_HOST "iot-sensor-saya-default-rtdb.asia-southeast1.firebasedatabase.app" 
#define FIREBASE_AUTH "VyZAufVYXlWuXu21APUHfFzN91V1unnlr2sBmdz6"

// --- SETTING JAM WIB (UTC+7) ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 25200; // 7 jam x 3600 detik = 25200
const int   daylightOffset_sec = 0;

// --- DEFINISI PIN ---
const int pinSensor = 15; 

// --- OBJEK FIREBASE ---
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

String statusTerakhir = ""; 

// --- FUNGSI AMBIL JAM SEKARANG ---
String getJamSekarang() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Gagal ambil waktu");
    return "Error Waktu";
  }
  
  // Format jadi: "10/01/2026, 15:45:00"
  char timeStringBuff[50]; 
  strftime(timeStringBuff, sizeof(timeStringBuff), "%d/%m/%Y, %H:%M:%S", &timeinfo);
  
  return String(timeStringBuff);
}

void setup() {
  Serial.begin(115200);
  pinMode(pinSensor, INPUT);

  // 1. Koneksi WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nWiFi Connected!");
  
  // 2. Setting Waktu Internet (WAJIB DITUNGGU)
  Serial.println("Mengambil Waktu Internet...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  struct tm timeinfo;
  while(!getLocalTime(&timeinfo)){
     Serial.print(".");
     delay(500);
  }
  Serial.println("\nWaktu Berhasil Didapat!");

  // 3. Koneksi Firebase
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // --- [TAMBAHAN BARU] KIRIM WAKTU KONEKSI AWAL ---
  Serial.println("Mengirim Waktu Start-up ke Firebase...");
  
  // Ambil jam saat ini
  String jamKonek = getJamSekarang(); 
  
  // Kirim ke path baru, misal: /Virtual_Object/waktu_mulai_online
  Firebase.setString(firebaseData, "/Virtual_Object/waktu_mulai_online", jamKonek);
  
  Serial.print("Alat Online Sejak: ");
  Serial.println(jamKonek);
}

void loop() {
  int deteksi = digitalRead(pinSensor);

  if (deteksi == LOW) {
    // --- ADA TANGAN ---
    if (statusTerakhir != "ON") { 
      Serial.println("Objek Terdeteksi! -> Kirim Data");
      
      // Ambil jam string yang sudah jadi
      String jamWIB = getJamSekarang(); 
      
      // Kirim Status
      Firebase.setString(firebaseData, "/Virtual_Object/status_sekarang", "ON");
      // Kirim Jam yang bisa dibaca manusia
      Firebase.setString(firebaseData, "/Virtual_Object/waktu_update", jamWIB);
      
      Serial.print("Update ke Firebase: ON pada ");
      Serial.println(jamWIB);
      
      statusTerakhir = "ON";
    }
  } 
  else {
    // --- KOSONG ---
    if (statusTerakhir != "OFF") {
      Serial.println("Kosong -> Kirim Data");
      
      String jamWIB = getJamSekarang();

      Firebase.setString(firebaseData, "/Virtual_Object/status_sekarang", "OFF");
      Firebase.setString(firebaseData, "/Virtual_Object/waktu_update", jamWIB);

      Serial.print("Update ke Firebase: OFF pada ");
      Serial.println(jamWIB);
      
      statusTerakhir = "OFF";
    }
  }
  delay(200);
}