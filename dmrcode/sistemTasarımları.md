0.1 version sonrasında yapılacak yapısal ve sistemsel düzenlemeler : 


- Yetki sistemlerini bankaların ve finans firmalarının kullandıgı sekılde tasarlayacagız.
____________________________________________________________________________________________________________________
#  Platform Yetkilendirme Sistemi - Finans Sektörü Standardına Yükseltme

## Amaç
Mevcut Bug Tracker platformunun yetkilendirme sistemini, Goldman Sachs/JPMorgan seviyesinde finans sektörü regülasyonlarına (SOX, GDPR) uygun hale getirmek. Express'ten bağımsız, saf Node.js + TypeScript ile Zero Trust mimarisi kurmak.

---

## Story 1: Permission Evaluator Service (Merkezi Yetkilendirme Motoru)
**Öncelik:** Critical | **Tahmin:** 13 SP | **Bağımlılık:** Yok

Tüm yetkilendirme mantığını tek bir merkezi serviste topla. Controller'lar sadece bu servisi çağırsın, yetki kontrolü yapmasın.

### Yetkilendirme Kuralları (Finans Standardı)
- [ ] Super Admin: Her şeye tam erişim
- [ ] Support Admin: Sadece kendi tenant'ındaki bug'ları görür/listeler
- [ ] Güvenlik Seviyesi Kontrolü: PUBLIC(1), INTERNAL(2), CONFIDENTIAL(4), CRITICAL(5)
- [ ] Tenant İzolasyonu: Farklı tenant verilerine kesinlikle erişilemez
- [ ] Departman Kısıtlaması: CONFIDENTIAL bug'lar sadece yetkili departmanlara açık

### Definition of Done
- [ ] Tüm yetkilendirme mantığı PermissionEvaluator'da toplandı
- [ ] Controller'lardaki yetki kontrolleri temizlendi
- [ ] Her kontrol bağımsız test edilebilir durumda
- [ ] Fail-secure: Hata durumunda varsayılan olarak erişim reddediliyor

---

## Story 2: 4 Göz Prensibi (Dual Approval) Sistemi
**Öncelik:** Critical | **Tahmin:** 8 SP | **Bağımlılık:** Story 1

Kritik ve regülasyona tabi bug'ların silinmesi için 4 göz prensibi uygula. Tek bir admin'in kritik veriyi silmesini engelle.

### 4 Göz Prensibi Tetikleyiciler
1. Bug classification === 'CRITICAL'
2. Bug regulatory === true (SOX, GDPR kapsamında)
3. Bug yaşı < 30 gün (Soğuma süresi)

### Onay Süreci
- Silme isteği → Otomatik approval request oluştur
- Başka bir super_admin onaylamalı
- Onaylayan ≠ İstekte bulunan
- Onay 24 saat geçerli

### Definition of Done
- [ ] `approvals` tablosu oluşturuldu
- [ ] Kritik bug silme denemesi approval flow'u tetikliyor
- [ ] Aynı kişi kendi isteğini onaylayamıyor
- [ ] 24 saat içinde onaylanmayan istekler otomatik reddediliyor
- [ ] Onay süreci tamamen loglanıyor

---

## Story 3: Tamper-Proof Audit Trail (Blockchain Benzeri)
**Öncelik:** High | **Tahmin:** 13 SP | **Bağımlılık:** Story 1

SOX uyumlu, değiştirilemez denetim kaydı sistemi. Her yetkilendirme kararı loglanacak ve hash zinciri ile korunacak.

### Audit Log Yapısı
- id: UUID, userId, action, resourceId, timestamp, ipAddress, userAgent
- result: SUCCESS/FAILURE
- reason: string (opsiyonel)
- hash: SHA-256
- previousHash: Blockchain tarzı zincir
- metadata: { tenantId, userRole, clearanceLevel }

### Definition of Done
- [ ] AuditService sınıfı oluşturuldu
- [ ] Tüm yetkilendirme kararları otomatik loglanıyor
- [ ] SHA-256 hash zinciri ile değiştirilemez yapı
- [ ] Başarısız denemeler ayrıca işaretleniyor
- [ ] Hash zinciri düzgün çalışıyor (previousHash kontrolü)
- [ ] Audit log'lar değiştirilemez (WORM prensibi)
- [ ] Log manipülasyonu tespit ediliyor

---

## Story 4: Çin Seddi (Chinese Wall) Politikası
**Öncelik:** High | **Tahmin:** 8 SP | **Bağımlılık:** Story 1, Story 3

Finans sektöründe zorunlu olan rakip firma veri izolasyonu. Bir kullanıcı A firmasının bug'larını gördüyse, rakip B firmasının bug'larını göremez.

### Kontrol Mantığı
1. Bug'un competitorInfo'su var mı?
2. Kullanıcı son 90 günde rakip firmalara erişti mi?
3. Eriştiyse → Erişimi engelle

### Definition of Done
- [ ] `isChineseWallViolation()` metodu çalışıyor
- [ ] `getUserAccessedCompanies()` - Son 90 gün sorgusu
- [ ] Bug modeline `competitorInfo` alanı eklendi
- [ ] Rakip firma verilerine erişim engelleniyor
- [ ] 90 günlük pencere düzgün çalışıyor
- [ ] Çin Seddi ihlalleri Security Alert tetikliyor

---

## Story 5: Saf Node.js HTTP Server (Express'siz)
**Öncelik:** Critical | **Tahmin:** 8 SP | **Bağımlılık:** Yok

Express bağımlılığını kaldır, sadece Node.js'in `http` modülü ile routing ve middleware sistemi kur.

### Mimari
- FintechServer class'ı: handleRequest, parseBody, routeRequest, sendResponse
- Route Yapısı:
  - GET /api/v1/bugs → listBugs()
  - GET /api/v1/bugs/:id → getBug()
  - PUT /api/v1/bugs/:id → updateBug()
  - DELETE /api/v1/bugs/:id → deleteBug()

### Definition of Done
- [ ] Express bağımlılığı tamamen kaldırıldı
- [ ] Body parsing çalışıyor (JSON)
- [ ] Route matching düzgün
- [ ] CORS headers var
- [ ] Error handling merkezi

---

## Story 6: Auth Middleware (JWT Bazlı)
**Öncelik:** Critical | **Tahmin:** 5 SP | **Bağımlılık:** Story 5

Her request'te JWT token doğrulaması yapan, kullanıcı bilgilerini request context'ine ekleyen middleware.

### Token Yapısı
- id, tenantId, role (super_admin/support_admin/developer/viewer)
- permissions: string[]
- department, clearanceLevel (1-5)
- exp: number

### Definition of Done
- [ ] Authorization: Bearer <token> header'ından token alınıyor
- [ ] HMAC-SHA256 ile signature doğrulanıyor
- [ ] Expiry kontrolü yapılıyor
- [ ] Kullanıcı bilgileri request context'ine ekleniyor
- [ ] Geçersiz token → 401 dönüyor
- [ ] Expired token'lar reddediliyor

---

## Story 7: Security Alert & Monitoring
**Öncelik:** High | **Tahmin:** 5 SP | **Bağımlılık:** Story 3

Şüpheli aktiviteleri tespit edip alert üreten sistem.

### Alert Tetikleyiciler
1. Art arda 3 başarısız yetkilendirme → BRUTE_FORCE
2. Yetkisiz CRITICAL bug erişim denemesi → UNAUTHORIZED_CRITICAL
3. Çin Seddi ihlali denemesi → CHINESE_WALL_VIOLATION
4. 4 göz prensibi bypass denemesi → DUAL_APPROVAL_BYPASS
5. Farklı IP'lerden aynı anda erişim → SESSION_HIJACKING

### Definition of Done
- [ ] Security incident tespit mantığı çalışıyor
- [ ] Alert'ler console'da belirgin şekilde loglanıyor
- [ ] Kritik alert'ler için 🚨 emoji ile görsel ayırt edicilik
- [ ] Her alert'te: timestamp, userId, action, IP, reason

---

## Story 8: Test Suite (Jest)
**Öncelik:** Medium | **Tahmin:** 8 SP | **Bağımlılık:** Story 1-7

Tüm yetkilendirme senaryolarını kapsayan test suite.

### Test Kategorileri
- Role bazlı testler (Super admin her şeyi yapabilir, Support admin sadece kendi tenant'ında)
- 4 Göz Prensibi testleri (Kritik bug silme onay gerektirir, Aynı kişi kendi isteğini onaylayamaz)
- Çin Seddi testleri (Rakip firma verisine erişim engellenir)
- Tenant izolasyonu (Farklı tenant bug'ına erişim 404 döner)
- Audit trail (Tüm kararlar loglanır, Hash zinciri bozulursa tespit edilir)

### Definition of Done
- [ ] Minimum %90 code coverage
- [ ] Tüm yetkilendirme senaryoları test edildi
- [ ] Edge case'ler kapsandı
- [ ] CI/CD pipeline'a entegre edildi

---

## Teknik Spesifikasyonlar
- Runtime: Node.js 20+
- Language: TypeScript 5+
- HTTP: Saf http modülü (Express YOK)
- Auth: JWT (HMAC-SHA256)
- Hash: SHA-256 (crypto modülü)
- Database: PostgreSQL / MySQL
- Testing: Jest
- External: YOK (sıfır bağımlılık hedefi)

## Response Formatı Standardı
- Başarılı: { data: {...}, meta: { auditId, accessLevel } }
- Yetkisiz: { error: "Forbidden", reason: "...", auditId }
- Onay Bekliyor: { message: "...", status: "PENDING_APPROVAL", approvalId }
- Hata: 401 (Auth yok), 403 (Yetkisiz), 404 (Kaynak yok/yetkisiz), 202 (Onay bekliyor), 500 (Sistem hatası)

## Sprint Planı
- Sprint 1: Story 5, Story 6 (1 hafta)
- Sprint 2: Story 1, Story 2 (1.5 hafta)
- Sprint 3: Story 3, Story 4 (1.5 hafta)
- Sprint 4: Story 7, Story 8 (1 hafta)

## Kritik Notlar
1. Express kullanılmayacak - Sadece Node.js http modülü
2. Sıfır dış bağımlılık hedefi - Mümkün olduğunca core modüller
3. Fail-Secure prensibi - Her hata durumunda erişim REDDEDİLECEK
4. Audit her şeyin üstünde - Log'suz işlem olmayacak
5. Test'ler bağımsız olacak - Her servis kendi başına test edilebilecek
________________________________________________________________________________________________________________


