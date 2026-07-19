### 🚀 Jira-Clone Geliştirme Yol Haritası: Özellik Matrisi

| Hedef Kitle        | Özellik                               | Arka Plan İşlevi / Açıklama                                                                               |      Değer      |
| :----------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------         | :-------------- |
| **Tenant Admin**   | Dinamik Rol ve Yetki Atama            | Sabit roller yerine, veritabanından okunan ince ayarlı (granular) yetki tanımlama altyapısı.              | :stars:  2      |
| **Tenant Admin**   | Merkezi Yönetim Paneli                | Tüm organizasyon, site ve proje ayarlarının tek bir API üzerinden yönetilmesi.                            | :stars:  1      |
| **Tenant Admin**   | Organizasyon/Proje Analiz Grafikleri  | Proje ve issue durumlarının metriklerini dönen istatistik endpointleri.                                   | :stars:  1      |
| **Tenant Admin**   | Kullanıcı Analiz Grafikleri           | Yetkililerin, ekiplerinin performans verilerini (çözülen bug sayısı vb.) çekebilmesi.                     | :stars:  1      |
| **Tenant Admin**   | Feedback ve Ödül Sistemi              | Geliştiricilere performanslarına göre sistem içi geri bildirim/ödül dağıtımı.                             | :stars:  1      |
| **Tenant Admin**   | Webhook Entegrasyonu                  | Olay bazlı (issue açıldı/çözüldü) dış servislere (Slack, Discord, Github) HTTP tetiklemesi.               | :stars:  1      |
| **Tenant Admin**   | Otomatik İş Akışları (Workflow)       | Belirli şartlar sağlandığında statü veya atama değiştiren arka plan kural motoru.                         | :stars:  1      |
| **Tenant Admin**   | Gelişmiş Audit Log                    | Sistemdeki tüm kritik değişikliklerin kaydedildiği silinemez ve sorgulanabilir log tablosu.               | :stars:  1      |
| **Tenant Admin**   | SLA Sayaçları                         | Kritiklik seviyesine göre çözüm süresi kısıtları ve zaman aşımında tetiklenen uyarılar.                   | :stars:  1      |
| **Tenant User**    | Takvim ve Toplantı Ekranı             | Kullanıcıların sistem üzerinden meeting zamanlayabilmesi.                                                 | :stars:  1      |
| **Tenant User**    | Kişisel API Key Üretimi               | Geliştiricilerin terminal, VS Code uzantıları veya scriptler üzerinden doğrudan sisteme bağlanabilmesi.   | :stars:  1      |
| **Tenant User**    | Gelişmiş Filtreleme (JQL Tarzı)       | Metin tabanlı spesifik veritabanı sorguları (ör: `status=open AND assignee=me`).                          | :stars:  1      |
| **Tenant User**    | Toplu İşlem (Bulk Action)             | Çoklu issue seçimi ile tek bir POST isteğinde onlarca kaydın statüsünü güncelleme.                        | :stars:  1      |
| **Platform Admin** | Tenant Analiz ve Log Tablosu          | Platformun genel tenant hareketlerini ve sunucu hatalarını izlemesi.                                      | :pstars: 1      |
| **Platform Admin** | Kaynak Tüketim Monitörü               | Veritabanı disk alanı ve RAM tüketiminin tenant bazlı kullanım metrikleri.                                | :pstars: 1      |
| **Platform Admin** | Tek Tuşla Tenant Karantinası          | Sorunlu tenant'ı dondurma veya tamamen "Read-Only" moduna alma yeteneği.                                  | :pstars: 1      |
| **Platform Admin** | Global Broadcast (Duyuru)             | Tüm tenant'lara sistem bakımı gibi acil durum duyurularını tek merkezden basma.                           | :pstars: 1      |