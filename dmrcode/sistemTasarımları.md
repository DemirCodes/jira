### 🛠️ Geliştirme Yol Haritası (Saf Backend Eksikleri)

| Faz    | Modül / Özellik                   | Arka Plan İşlevi / Beklenen Aksiyon                                                                 | Durum / Öncelik |
| :----- | :-------------------------------- | :-------------------------------------------------------------------------------------------------- | :-------------- |
| **1**  | Platform User CRUD                | Sistemdeki adminleri listeleme (GET), güncelleme (PATCH) ve silme/pasife alma (DELETE) endpointleri.| 🔴 Kritik       |
| **1**  | Şifre Sıfırlama & Mail Doğrulama  | Şemada bulunan token alanlarını kullanarak e-posta üzerinden şifre sıfırlama akışının yazılması.    | 🔴 Kritik       |
| **1**  | API Key Yönetimi                  | Harici scriptler için `api_keys` modeli üzerinden anahtar üretme ve iptal etme (revoke) sistemi.    | 🟠 Yüksek       |
| **2**  | Org. ve Workspace (Site) CRUD     | Yeni tenant kayıt, yapılandırma ve hesap dondurma API'leri (`tenantRoutes` için).                   | 🔴 Kritik       |
| **2**  | Davet (Invitation) Sistemi        | Organizasyona e-posta linki ve token ile yeni tenant_user davet etme mantığı.                       | 🟠 Yüksek       |
| **3**  | Proje Yönetimi API                | Tenant içi projeler oluşturma ve ID üretme mimarisi (Örn: "BUG-101").                               | 🔴 Kritik       |
| **3**  | Issue CRUD & Workflow Engine      | Ticket oluşturma, atama ve statü değiştirme (Open -> In Progress) kurallarını yönetecek servisler.  | 🔴 Kritik       |
| **4**  | BullMQ Kuyruk (Queue) Altyapısı   | Mail gönderimi, webhook tetiklemeleri ve ağır arka plan işlemleri için Redis tabanlı kuyruk sistemi.| 🔴 Kritik       |
| **4**  | Shared Auth Middleware (DRY)      | `platformAuth` ve yazılacak `tenantAuth` yapılarını tek merkezden yönetmek için kod tekrarını önleme| 🟡 Orta         |
| **4**  | Platform Audit Logs               | Kritik işlemleri (admin silme vb.) kimin, ne zaman, hangi IP'den yaptığını loglayan aracı sistem.   | 🟡 Orta         |