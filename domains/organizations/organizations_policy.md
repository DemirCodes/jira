# Organization Access Policy

## Genel Bakış

Bu doküman **organizations tablosu için erişim kurallarını** tanımlar.

Organization yapısı sistemde **tenant sınırını temsil eder**.
Yani sistemdeki tüm kaynaklar aşağıdaki hiyerarşiye bağlıdır:

```id="hierarchy"}
Organization
   └ Sites
        └ Projects
             └ Issues
```

Bu nedenle organization erişimi **sistemin en kritik güvenlik katmanıdır**.

Organization erişimi **organization_memberships tablosu üzerinden belirlenir.**

---

# Yetkilendirme Modeli

Sistem **Role Based Access Control (RBAC)** modeli kullanır.

Bir kullanıcı bir organization içinde aşağıdaki rollerden birine sahip olabilir:

| Rol    | Açıklama                        |
| ------ | ------------------------------- |
| owner  | Organization üzerinde tam yetki |
| admin  | Organization yönetim yetkisi    |
| member | Normal kullanıcı                |
| viewer | Salt okunur erişim              |

Bu roller **organization_memberships** tablosunda tutulur.

---

# Organization Görüntüleme Yetkisi

Bir kullanıcı bir organization'ı görüntüleyebilir eğer:

1. Organization'a üyeliği varsa
2. Üyeliği aktif ise
3. Üyeliği soft delete edilmemişse

Kontrol mantığı:

```id="logic1"}
organization_memberships.user_id = current_user
AND membership_is_active = true
AND deleted_at IS NULL
```

---

# Organization Güncelleme Yetkisi

Organization üzerinde değişiklik yapabilen roller:

```id="roles-update"}
owner
admin
```

Aşağıdaki roller organization üzerinde değişiklik yapamaz:

```id="roles-deny"}
member
viewer
```

---

# Organization Silme Kuralları

Organization'lar doğrudan sistemden silinmez.

Bunun yerine **soft delete mekanizması uygulanır**.

Organization silme işlemini başlatabilecek rol:

```id="roles-delete"}
owner
```

Admin kullanıcılar organization silemez.

---

# Ownership Garantisi

Her organization'da **en az bir owner bulunmak zorundadır.**

Sistem şu kuralı garanti etmelidir:

```id="ownership-rule"}
organization_memberships.role = 'owner'
COUNT >= 1
```

Owner transferi açık bir işlem ile yapılmalıdır.

---

# Güvenlik Önlemleri

Yetki yükseltme (privilege escalation) saldırılarını önlemek için:

* Kullanıcılar kendi rollerinden daha yüksek bir rol atayamaz.
* Rol atamaları database trigger'ları tarafından doğrulanır.

Bu mekanizmada kullanılan bileşenler:

```id="components"}
organization_memberships
trg_project_memberships_role_guard()
can_assign_project_role()
```

---

# Özet

Organization erişim modeli şu şekildedir:

```id="summary"}
Owner   → Tam kontrol
Admin   → Organization yönetimi
Member  → Organization içinde çalışma
Viewer  → Salt okunur erişim
```

Organization üyeliği sistemdeki **tüm erişim kontrollerinin temelini oluşturur**.

Alt seviyedeki tüm kaynaklara erişim bu ilişki üzerinden türetilir.
