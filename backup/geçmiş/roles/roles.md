Roller & Yetkı Katmanı

|____________________________________________________ |
|                   Platform Rols                     |
|-----------------------------------------------------|
| Roller         | Yetkiler                           |
| -------------- | ---------------                    |
| super_admin    | Herşeyi görür siler tenant kapatır |
| support_admin  | Sadece okur, debug yapar           |
| billing_admin  | Abonelik & ödeme yönetir           |
| --------------------------------------------------- |



__________________________
| Organizasyon Yetkileri |
| -----------------------|
| Owner                  |
| Admin                  |
| Member                 |
| Viewer                 |
|________________________|




ROLE: OWNER
Organizasyonun mutlak yetkilisidir.
Tüm projeleri görür (is_private true dahil).
Tüm projelerde rol bağımsız tam yetkiye sahiptir.
Project role atanmasa bile override yetkisi vardır.
Public ve private proje oluşturabilir.
Projeyi silebilir (soft/hard policy’ye bağlı).
Proje üyelerini ekleyebilir ve çıkarabilir.
Proje rollerini değiştirebilir.
Organizasyon üyelerinin rollerini değiştirebilir.
Admin atayabilir ve admin düşürebilir.
Organizasyonu archive edebilir.
Organizasyonu suspend edebilir.
Organizasyonu silebilir (policy’ye bağlı).
Kendisini son owner ise rolden çıkaramaz.
Tüm issue’larda tam yetkilidir.
Tüm asset’leri silebilir.
Tüm logları görebilir.

ROLE: ADMIN
Organizasyonu görür.
is_private=false olan tüm projeleri görür.
is_private=true projeleri yalnızca project membership varsa görür.
Public proje oluşturabilir.
Private proje oluşturabilir.
Oluşturduğu projede otomatik project_admin olur.
Proje silebilir (owner policy’sine bağlı).
Project membership ekleyebilir.
Project membership çıkarabilir.
Project rollerini değiştirebilir (owner hariç).
Issue oluşturabilir.
Issue düzenleyebilir (project rolüne bağlı).
Issue status değiştirebilir (project rolüne bağlı).
Organizasyonu silemez.
Owner rolünü değiştiremez.
Organizasyonu suspend edemez.
Tüm projelerde otomatik tam yetkili değildir.

ROLE: MEMBER
Organizasyonu görür.
Sadece dahil olduğu projeleri görür.
Private projeye sadece membership varsa erişir.
Project oluşturamaz (policy’ye bağlı opsiyonel açılabilir).
Issue oluşturabilir.
Kendi oluşturduğu issue’yu düzenleyebilir.
Atandığı issue’yu düzenleyebilir.
Issue status değiştirme yetkisi project rolüne bağlıdır.
Project membership yönetemez.
Organizasyon rolü değiştiremez.
Proje silemez.
Private proje oluşturamaz.

ROLE: VIEWER
Organizasyonu görür.
Sadece dahil olduğu projeleri görür.
Private projeye sadece membership varsa erişir.
Issue oluşturamaz (opsiyonel açılabilir).
Issue düzenleyemez.
Issue status değiştiremez.
Sadece okuma yetkisine sahiptir.
Comment atma yetkisi opsiyoneldir.
Project membership yönetemez.
Organizasyon yönetimi yapamaz.


_________________
| Project Roles |
| ------------- |
| PROJECT_ADMIN |
| CONTRIBUTOR   |
| REVIEWER      |
| VIEWER        |
|_______________|


PROJECT_ROLE: PROJECT_ADMIN
Projede tam yetkilidir.
Issue silebilir.
Issue assign edebilir.
Issue status değiştirebilir.
Project membership yönetebilir.
Project ayarlarını değiştirebilir.
Private flag değiştiremez (owner policy’sine bağlı).

PROJECT_ROLE: CONTRIBUTOR
Issue oluşturabilir.
Issue düzenleyebilir.
Issue status değiştirebilir (kısıtlı akışta).
Issue silemez.
Project membership yönetemez.

PROJECT_ROLE: REVIEWER
Issue görüntüleyebilir.
In_review durumundaki issue’yu fixed veya rejected yapabilir.
Issue oluşturamaz (opsiyonel açılabilir).
Project membership yönetemez.

PROJECT_ROLE: VIEWER
Projeyi görüntüleyebilir.
Issue görüntüleyebilir.
İşlem yapamaz.




